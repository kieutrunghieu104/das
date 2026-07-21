import * as clinicalRepository from "../repository/clinicalRepository.js";
import { combineDateAndTime, endOfLocalDay, startOfLocalDay } from "../utils/time.js";
import {
  clinicalRoomStatusSchema,
  createTreatmentRecordSchema,
  performedServicesSchema,
  treatmentRecordSearchSchema,
  treatmentRecordSchema
} from "../validations/clinicalValidation.js";

function createError(message, statusCode) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

function sameId(left, right) {
  const leftId = left?._id || left;
  const rightId = right?._id || right;
  return leftId?.toString() === rightId?.toString();
}

function dateInputToDateText(value) {
  if (!value) return new Date().toISOString().slice(0, 10);
  const dateText = String(value).slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateText)) return dateText;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString().slice(0, 10) : date.toISOString().slice(0, 10);
}

function buildScheduleQuery(user, date) {
  const visibleStatuses = ["scheduled", "confirmed", "checked_in", "in_treatment", "completed"];
  const query = { status: { $in: visibleStatuses } };
  if (user.role === "dentist") query.dentist = user._id;
  if (user.role === "nurse") query.nurse = user._id;
  if (date) {
    query.startAt = {
      $gte: startOfLocalDay(date),
      $lte: endOfLocalDay(date)
    };
  }
  return query;
}

function buildRecordQuery(user) {
  const query = {};
  if (user.role === "dentist") query.dentist = user._id;
  if (user.role === "nurse") query.nurse = user._id;
  return query;
}

function normalizeVisits(record) {
  const visits = Array.isArray(record?.visits) ? record.visits.filter(Boolean) : [];
  return visits
    .map((visit, index) => ({
      ...visit,
      visitNumber: Number(visit.visitNumber || index + 1)
    }))
    .sort((first, second) => first.visitNumber - second.visitNumber);
}

function buildVisitPayload(data, visitNumber, user) {
  const visitDate = dateInputToDateText(data.visitDate);
  return {
    visitNumber,
    visitDate,
    vitalSigns: data.vitalSigns || {},
    diagnosis: data.diagnosis || "",
    medicalHistory: data.medicalHistory || "",
    treatmentResult: data.treatmentResult || "",
    treatmentNote: data.treatmentNote || "",
    treatmentPlan: data.treatmentPlan || "",
    prescription: data.prescription || "",
    aftercareInstructions: data.aftercareInstructions || "",
    estimatedCost: data.estimatedCost || 0,
    updatedBy: user._id,
    updatedAt: combineDateAndTime(visitDate, "00:00")
  };
}

function hasTreatmentValue(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return Number.isFinite(value) && value !== 0;
  if (typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.some(hasTreatmentValue);
  if (typeof value === "object") return Object.values(value).some(hasTreatmentValue);
  return Boolean(value);
}

const treatmentContentFields = [
  "vitalSigns",
  "diagnosis",
  "medicalHistory",
  "treatmentResult",
  "treatmentNote",
  "treatmentPlan",
  "prescription",
  "aftercareInstructions",
  "estimatedCost"
];

function hasTreatmentContent(record) {
  if (!record) return false;
  const hasLegacyContent = treatmentContentFields.some((field) => hasTreatmentValue(record[field]));
  const visits = Array.isArray(record.visits) ? record.visits : [];
  const hasVisitContent = visits.some((visit) =>
    treatmentContentFields.some((field) => hasTreatmentValue(visit?.[field]))
  );
  return hasLegacyContent || hasVisitContent;
}

async function assertPatientAccess(user, patientId) {
  if (user.role === "admin") return;

  const accessQuery = { patient: patientId };
  if (user.role === "dentist") accessQuery.dentist = user._id;
  if (user.role === "nurse") accessQuery.nurse = user._id;

  const relatedAppointment = await clinicalRepository.hasRelatedAppointment(accessQuery);
  if (!relatedAppointment) {
    throw createError("Bạn không có quyền xem thông tin bệnh nhân này.", 403);
  }
}

export async function getDashboard(user, query) {
  const [appointments, records, rooms, services, slots] = await Promise.all([
    clinicalRepository.findClinicalAppointments(buildScheduleQuery(user, query.date), 120),
    clinicalRepository.findClinicalTreatmentRecords(buildRecordQuery(user), 60),
    clinicalRepository.findClinicalRooms(),
    clinicalRepository.findActiveDentalServices(),
    clinicalRepository.findActiveAppointmentSlots()
  ]);

  const visibleRooms = user.role === "dentist"
    ? rooms.filter((room) => sameId(room.assignedDentist, user._id) || appointments.some((appointment) => sameId(appointment.room, room._id)))
    : user.role === "nurse"
      ? rooms.filter((room) => sameId(room.assignedNurse, user._id) || appointments.some((appointment) => sameId(appointment.room, room._id)))
      : rooms;

  return { appointments, records, rooms: visibleRooms, services, slots };
}

export function getTreatmentRecords(user) {
  return clinicalRepository.findClinicalTreatmentRecords(buildRecordQuery(user), 100);
}

export async function searchTreatmentRecordsByPhone(user, query) {
  const data = treatmentRecordSearchSchema.parse(query);
  const patient = await clinicalRepository.findPatientByPhone(data.phone);
  if (!patient) {
    return { patient: null, records: [] };
  }

  const records = await clinicalRepository.findPatientTreatmentHistory(patient._id);
  if (user.role === "dentist") {
    const allowed = await clinicalRepository.hasRelatedAppointment({
      patient: patient._id,
      dentist: user._id
    });
    return { patient, records: allowed ? records : [] };
  }

  return { patient, records };
}

export async function createTreatmentRecord(user, body) {
  if (!["nurse", "admin"].includes(user.role)) {
    throw createError("Chỉ y tá hoặc quản trị viên được tạo hồ sơ điều trị.", 403);
  }

  const data = createTreatmentRecordSchema.parse(body);
  const patient = await clinicalRepository.findPatientByPhone(data.phone);
  if (!patient) throw createError("Không tìm thấy bệnh nhân theo số điện thoại.", 404);

  const service = await clinicalRepository.findServiceById(data.serviceId);
  if (!service) throw createError("Không tìm thấy dịch vụ.", 404);

  const treatmentDate = dateInputToDateText(data.treatmentDate);
  const duplicateRecord = await clinicalRepository.findTreatmentRecordByPatientServiceDate(
    patient._id,
    service._id,
    treatmentDate
  );
  if (duplicateRecord) {
    throw createError("Bệnh nhân đã có hồ sơ điều trị cho dịch vụ này trong ngày đã chọn.", 409);
  }

  const record = await clinicalRepository.createTreatmentRecord({
    patient: patient._id,
    nurse: user.role === "nurse" ? user._id : undefined,
    serviceSnapshot: {
      service: service._id,
      name: service.name,
      price: service.price,
      description: service.description
    },
    initialInfo: {
      patientPhone: patient.phone,
      serviceName: service.name,
      treatmentDate
    },
    treatmentDate,
    visits: [],
    status: "active"
  });

  return record;
}

export async function getPatientHistory(user, patientId) {
  if (user.role === "dentist") {
    const relatedAppointment = await clinicalRepository.hasRelatedAppointment({
      patient: patientId,
      dentist: user._id
    });

    if (!relatedAppointment) {
      throw createError("Bạn không có quyền xem lịch sử điều trị của bệnh nhân này.", 403);
    }
  }

  return clinicalRepository.findPatientTreatmentHistory(patientId);
}

export async function getPatientInformation(user, patientId) {
  await assertPatientAccess(user, patientId);

  const appointments = await clinicalRepository.findPatientAppointments(patientId);
  const patient = appointments[0]?.patient;
  if (!patient) {
    throw createError("Không tìm thấy thông tin bệnh nhân.", 404);
  }

  return { patient, appointments };
}

export async function upsertAppointmentTreatmentRecord(user, appointmentId, body) {
  const data = treatmentRecordSchema.parse(body);
  const appointment = await clinicalRepository.findAppointmentById(appointmentId);
  if (!appointment) throw createError("Không tìm thấy lịch hẹn.", 404);

  const canEdit =
    user.role === "admin" ||
    sameId(appointment.nurse, user._id) ||
    sameId(appointment.dentist, user._id);

  if (!canEdit) {
    throw createError("Chỉ nhân sự được phân công mới được cập nhật điều trị.", 403);
  }

  const existingRecord = await clinicalRepository.findTreatmentRecordByAppointment(appointment._id);
  const visitNumber = data.visitNumber || 1;
  const visits = normalizeVisits(existingRecord);
  if (visitNumber > visits.length + 1) {
    throw createError(`Cần cập nhật lần ${visits.length + 1} trước khi cập nhật lần ${visitNumber}.`, 409);
  }

  const visitPayload = buildVisitPayload(data, visitNumber, user);
  const existingVisitIndex = visits.findIndex((visit) => Number(visit.visitNumber) === visitNumber);
  if (existingVisitIndex >= 0) {
    throw createError("Lần điều trị đã có thông tin nên không thể cập nhật lại. Vui lòng tạo lần điều trị tiếp theo.", 409);
  } else {
    visits.push({ ...visitPayload, createdAt: new Date() });
  }
  visits.sort((first, second) => first.visitNumber - second.visitNumber);

  const updateFields = {
    patient: appointment.patient,
    dentist: appointment.dentist,
    nurse: user.role === "nurse" ? user._id : appointment.nurse,
    treatmentDate: existingRecord?.treatmentDate || dateInputToDateText(appointment.startAt),
    visits,
    status: "active"
  };

  const record = await clinicalRepository.upsertTreatmentRecord(appointment._id, updateFields);

  return record;
}

export async function updateTreatmentRecord(user, recordId, body) {
  if (!["nurse", "admin"].includes(user.role)) {
    throw createError("Chỉ y tá hoặc quản trị viên được cập nhật hồ sơ điều trị.", 403);
  }

  const data = treatmentRecordSchema.parse(body);
  const existingRecord = await clinicalRepository.findTreatmentRecordById(recordId);
  if (!existingRecord) throw createError("Không tìm thấy hồ sơ điều trị.", 404);

  const visitNumber = data.visitNumber || 1;
  const visits = normalizeVisits(existingRecord);
  if (visitNumber > visits.length + 1) {
    throw createError(`Cần cập nhật lần ${visits.length + 1} trước khi cập nhật lần ${visitNumber}.`, 409);
  }

  const visitPayload = buildVisitPayload(data, visitNumber, user);
  const existingVisitIndex = visits.findIndex((visit) => Number(visit.visitNumber) === visitNumber);
  if (existingVisitIndex >= 0) {
    throw createError("Lần điều trị đã có thông tin nên không thể cập nhật lại. Vui lòng tạo lần điều trị tiếp theo.", 409);
  } else {
    visits.push({ ...visitPayload, createdAt: new Date() });
  }
  visits.sort((first, second) => first.visitNumber - second.visitNumber);

  const updateFields = {
    nurse: user.role === "nurse" ? user._id : existingRecord.nurse?._id || existingRecord.nurse,
    visits,
    treatmentDate: existingRecord.treatmentDate,
    status: "active"
  };

  return clinicalRepository.updateTreatmentRecord(recordId, updateFields);
}

export async function deleteTreatmentRecord(user, recordId) {
  if (!["nurse", "admin"].includes(user.role)) {
    throw createError("Chỉ y tá hoặc quản trị viên được xóa hồ sơ điều trị.", 403);
  }

  const existingRecord = await clinicalRepository.findTreatmentRecordById(recordId);
  if (!existingRecord) throw createError("Không tìm thấy hồ sơ điều trị.", 404);

  if (user.role === "nurse" && existingRecord.nurse && !sameId(existingRecord.nurse, user._id)) {
    throw createError("Y tá chỉ được xóa hồ sơ điều trị do mình phụ trách.", 403);
  }

  if (hasTreatmentContent(existingRecord)) {
    throw createError("Chỉ xóa được hồ sơ điều trị chưa có thông tin trong các lần điều trị.", 409);
  }

  const deletedRecord = await clinicalRepository.deleteTreatmentRecord(recordId);
  if (!deletedRecord) throw createError("Không tìm thấy hồ sơ điều trị.", 404);
  return deletedRecord;
}

export async function updateClinicalRoomStatus(user, roomId, body) {
  const data = clinicalRoomStatusSchema.parse(body);
  const activeTreatment = await clinicalRepository.findActiveTreatmentByRoom(roomId);
  if (activeTreatment) {
    throw createError("Phòng đang có bệnh nhân trong trạng thái đang khám nên không thể đổi trạng thái sẵn sàng/chưa sẵn sàng.", 409);
  }
  const room = await clinicalRepository.updateRoomStatus(roomId, data);
  if (!room) throw createError("Không tìm thấy phòng khám.", 404);

  await clinicalRepository.createRoomStatus({
    room: room._id,
    nurse: user.role === "nurse" ? user._id : undefined,
    availabilityStatus: data.status,
    note: "Cập nhật trạng thái phòng từ bảng điều khiển lâm sàng."
  });

  return room;
}

export async function updatePerformedServices(user, appointmentId, body) {
  const data = performedServicesSchema.parse(body);
  const appointment = await clinicalRepository.findAppointmentById(appointmentId);
  if (!appointment) throw createError("Không tìm thấy lịch khám.", 404);

  const canEdit =
    user.role === "admin" ||
    sameId(appointment.nurse, user._id) ||
    sameId(appointment.dentist, user._id);

  if (!canEdit) {
    throw createError("Chỉ nhân sự được phân công mới được cập nhật dịch vụ đã thực hiện.", 403);
  }

  if (appointment.status !== "in_treatment") {
    throw createError("Chỉ lịch đang khám mới được xác nhận dịch vụ đã thực hiện.", 409);
  }

  const services = data.services.map((item) => ({
    service: item.serviceId,
    name: item.name,
    amount: item.amount
  }));
  const extraCosts = data.extraCosts.map((item) => ({
    name: item.name,
    amount: item.amount
  }));
  const performedTotal = [...services, ...extraCosts].reduce((sum, item) => sum + Number(item.amount || 0), 0);

  return clinicalRepository.updateAppointment(appointmentId, {
    performedServices: services,
    extraCosts,
    performedTotal,
    servicesConfirmedAt: new Date(),
    servicesConfirmedBy: user._id
  });
}
