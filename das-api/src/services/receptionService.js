import * as receptionRepository from "../repository/receptionRepository.js";
import { hashPassword } from "../utils/password.js";
import { endOfLocalDay, startOfLocalDay } from "../utils/time.js";
import {
  createReceptionPatientSchema,
  resetPatientPasswordSchema
} from "../validations/receptionValidation.js";

function createError(message, statusCode) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function buildPatientFilter(searchText) {
  const role = await receptionRepository.ensurePatientRole({ roleName: "patient" });
  const filter = { roleRef: role._id, status: "active" };
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
  const patientFilter = await buildPatientFilter(query.q);
  const [appointments, patients, services, consultations, rooms, slots] = await Promise.all([
    receptionRepository.findReceptionAppointments(buildAppointmentQuery(query.date && query.scopeByDate === "true" ? query.date : "")),
    receptionRepository.findReceptionPatients(patientFilter, 40),
    receptionRepository.findActiveServices(),
    receptionRepository.findConsultationRequests({}, 60),
    receptionRepository.findReceptionRooms(),
    receptionRepository.findAppointmentSlots()
  ]);

  return { appointments, patients, services, consultations, rooms, slots };
}

export async function getPatients(query) {
  return receptionRepository.findReceptionPatients(await buildPatientFilter(query.q), 50);
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
  if (!data.createAccount) {
    throw createError("Chỉ tạo tài khoản khi lễ tân đã tick chọn tạo tài khoản.", 400);
  }

  const duplicate = await receptionRepository.findUserByPhone(data.phone);

  if (duplicate) {
    if (duplicate.status !== "active" && duplicate.role === "patient") {
      const reactivated = await receptionRepository.updatePatientUser(duplicate._id, {
        fullName: data.fullName,
        email: data.email || undefined,
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

    throw createError("Số điện thoại đã tồn tại.", 409);
  }

  if (data.email) {
    const emailOwner = await receptionRepository.findUserByEmail(data.email);
    if (emailOwner) {
      throw createError("Email đã tồn tại.", 409);
    }
  }

  const role = await receptionRepository.ensurePatientRole({ roleName: "patient" });

  const patient = await receptionRepository.createPatientUser({
    fullName: data.fullName,
    email: data.email || undefined,
    phone: data.phone,
    roleRef: role._id,
    status: "active",
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

export function getConsultations() {
  return receptionRepository.findConsultationRequests({}, 100);
}

export async function deleteConsultation(requestId) {
  const request = await receptionRepository.deleteConsultationRequest(requestId);
  if (!request) {
    throw createError("Không tìm thấy yêu cầu tư vấn.", 404);
  }
  return request;
}

export async function updateAppointmentSlot(slotId, body) {
  const slot = await receptionRepository.updateAppointmentSlot(slotId, {
    isActive: Boolean(body?.isActive)
  });
  if (!slot) {
    throw createError("KhÃ´ng tÃ¬m tháº¥y slot khÃ¡m.", 404);
  }
  return slot;
}
