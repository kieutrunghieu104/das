import { getInheritanceChain } from "../config/roleHierarchy.js";
import * as receptionRepository from "../repository/receptionRepository.js";
import { hashPassword } from "../utils/password.js";
import { endOfLocalDay, startOfLocalDay } from "../utils/time.js";
import {
  createReceptionPatientSchema,
  resetPatientPasswordSchema,
  updateConsultationSchema,
  updateRoomStatusSchema
} from "../validations/receptionValidation.js";

function createError(message, statusCode) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildPatientFilter(searchText) {
  const filter = { role: "patient", status: "active" };
  if (!searchText) return filter;

  const q = escapeRegex(String(searchText).trim().slice(0, 80));
  filter.$or = [
    { fullName: new RegExp(q, "i") },
    { phone: new RegExp(q, "i") },
    { email: new RegExp(q, "i") }
  ];
  return filter;
}

function buildAppointmentQuery(dateText) {
  if (!dateText) return {};

  return {
    startAt: {
      $gte: startOfLocalDay(dateText),
      $lte: endOfLocalDay(dateText)
    }
  };
}

export async function getDashboard(query) {
  const [appointments, patients, services, consultations, rooms] = await Promise.all([
    receptionRepository.findReceptionAppointments(buildAppointmentQuery(query.date && query.scopeByDate === "true" ? query.date : "")),
    receptionRepository.findReceptionPatients(buildPatientFilter(query.q), 40, true),
    receptionRepository.findActiveServices(),
    receptionRepository.findConsultationRequests({}, 60, true),
    receptionRepository.findReceptionRooms(true)
  ]);

  return { appointments, patients, services, consultations, rooms };
}

export function getPatients(query) {
  return receptionRepository.findReceptionPatients(buildPatientFilter(query.q), 50);
}

export async function resetPatientPassword(patientId, body) {
  const data = resetPatientPasswordSchema.parse(body || {});
  const patient = await receptionRepository.findActivePatientById(patientId);

  if (!patient) {
    throw createError("Không tìm thấy tài khoản bệnh nhân.", 404);
  }

  const updatedPatient = await receptionRepository.updatePatientUser(patient._id, {
    passwordHash: await hashPassword(data.password)
  });
  const object = { ...updatedPatient };
  delete object.passwordHash;
  return { patient: object, temporaryPassword: data.password };
}

export async function createPatient(body) {
  const data = createReceptionPatientSchema.parse(body);
  const duplicate = await receptionRepository.findUserByPhone(data.phone);

  if (duplicate) {
    if (data.createAccount && duplicate.status !== "active" && duplicate.role === "patient") {
      const reactivated = await receptionRepository.updatePatientUser(duplicate._id, {
        fullName: data.fullName,
        email: data.email || undefined,
        gender: data.gender,
        address: data.address || undefined,
        passwordHash: await hashPassword(data.password),
        status: "active"
      });
      await receptionRepository.upsertPatientProfile(duplicate._id, {
        gender: data.gender,
        address: data.address || undefined
      });

      const object = { ...reactivated };
      delete object.passwordHash;
      return { statusCode: 200, patient: object };
    }

    if (!data.createAccount && duplicate.role === "patient" && duplicate.status !== "active") {
      const object = { ...duplicate };
      delete object.passwordHash;
      return { statusCode: 200, patient: object };
    }

    throw createError("Số điện thoại đã tồn tại.", 409);
  }

  if (data.email) {
    const emailOwner = await receptionRepository.findUserByEmail(data.email);
    if (emailOwner) {
      throw createError("Email đã tồn tại.", 409);
    }
  }

  const role = await receptionRepository.ensurePatientRole({
    roleName: "patient",
    parentRoleName: "user",
    isAbstract: false,
    inheritanceChain: getInheritanceChain("patient"),
    description: "Bệnh nhân đặt lịch online, xem lịch sử khám, hủy/dời lịch và đánh giá dịch vụ."
  });

  const patient = await receptionRepository.createPatientUser({
    fullName: data.fullName,
    email: data.email || undefined,
    phone: data.phone,
    gender: data.gender,
    address: data.address || undefined,
    roleRef: role._id,
    role: "patient",
    status: data.createAccount ? "active" : "inactive",
    passwordHash: await hashPassword(data.password)
  });

  await receptionRepository.createPatientProfile({
    user: patient._id,
    gender: data.gender,
    address: data.address || undefined
  });

  const object = { ...patient };
  delete object.passwordHash;
  return { statusCode: 201, patient: object };
}

export function getConsultations(query) {
  const filter = {};
  if (query.status) filter.status = query.status;
  return receptionRepository.findConsultationRequests(filter, 100);
}

export async function updateConsultation(requestId, body, handledByUserId) {
  const data = updateConsultationSchema.parse(body);
  const request = await receptionRepository.updateConsultationRequest(requestId, {
    status: data.status,
    message: data.message,
    preferredDate: data.preferredDate ? new Date(data.preferredDate) : undefined,
    preferredTime: data.preferredTime,
    handledBy: handledByUserId
  });

  if (!request) {
    throw createError("Không tìm thấy yêu cầu tư vấn.", 404);
  }

  return request;
}

export async function deleteConsultation(requestId) {
  const request = await receptionRepository.deleteConsultationRequest(requestId);
  if (!request) {
    throw createError("Không tìm thấy yêu cầu tư vấn.", 404);
  }
  return request;
}

export function getRooms() {
  return receptionRepository.findReceptionRooms();
}

export async function updateRoomStatus(roomId, body) {
  const data = updateRoomStatusSchema.parse(body);
  const room = await receptionRepository.updateRoomStatus(roomId, data.status);

  if (!room) {
    throw createError("Không tìm thấy phòng khám.", 404);
  }

  await receptionRepository.createRoomStatusLog({
    room: room._id,
    availabilityStatus: data.status,
    note: data.note || "Lễ tân cập nhật trạng thái phòng."
  });

  return room;
}
