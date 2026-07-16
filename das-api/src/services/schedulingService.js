import * as schedulingRepository from "../repository/schedulingRepository.js";
import {
  calculateArrivalAt,
  combineDateAndTime,
  endOfLocalDay,
  isWorkingDate,
  startOfLocalDay
} from "../utils/time.js";

const BLOCKING_STATUSES = ["pending", "scheduled", "confirmed", "checked_in", "in_treatment"];

function httpError(message, statusCode = 400) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

function sameId(a, b) {
  return (a?._id || a)?.toString() === (b?._id || b)?.toString();
}

function slotTimes(date, slot) {
  return {
    startAt: combineDateAndTime(date, slot.startTime)
  };
}

function slotWindow(date, slot) {
  return {
    startAt: combineDateAndTime(date, slot.startTime),
    endAt: combineDateAndTime(date, slot.endTime)
  };
}

function slotOption(slot) {
  return {
    _id: slot._id,
    slotName: slot.slotName,
    startTime: slot.startTime,
    endTime: slot.endTime,
    order: slot.order
  };
}

function sameSlot(appointment, slot) {
  if (appointment.slot) return sameId(appointment.slot, slot._id);
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).format(new Date(appointment.startAt));
  return time === slot.startTime;
}

function findSlotForDateTime(slots, date, value, exactStart = false) {
  const target = value instanceof Date ? value : new Date(value);
  return slots
    .map((slot) => ({ slot, ...slotTimes(date, slot) }))
    .find(({ slot, startAt }) => {
      if (exactStart) return startAt.getTime() === target.getTime();
      const [endHour, endMinute] = slot.endTime.split(":").map(Number);
      const endAt = combineDateAndTime(date, `${String(endHour).padStart(2, "0")}:${String(endMinute).padStart(2, "0")}`);
      return target >= startAt && target < endAt;
    });
}

async function findBookableAppointmentSlots(date) {
  const [slots, closedSlots] = await Promise.all([
    schedulingRepository.findActiveAppointmentSlots(),
    schedulingRepository.findClosedAppointmentSlots(date)
  ]);
  const closedSlotIds = new Set(closedSlots.map((item) => item.slot?.toString()).filter(Boolean));
  return slots.filter((slot) => !closedSlotIds.has(slot._id.toString()));
}

async function getRequestedSlot(date, startAt) {
  const slots = await findBookableAppointmentSlots(date);
  const found = findSlotForDateTime(slots, date, startAt, true);
  if (!found) {
    throw httpError("Khung giờ khám không hợp lệ hoặc đã đóng trong ngày này.", 400);
  }
  return found;
}

async function getAppointmentsForDate(date, excludeAppointmentId) {
  const query = {
    status: { $in: BLOCKING_STATUSES },
    startAt: { $gte: startOfLocalDay(date), $lte: endOfLocalDay(date) }
  };

  if (excludeAppointmentId) query._id = { $ne: excludeAppointmentId };
  return schedulingRepository.findAppointments(query);
}

async function getPatientAppointmentsForDate(patientId, date, excludeAppointmentId) {
  if (!patientId) return [];
  const query = {
    patient: patientId,
    status: { $in: BLOCKING_STATUSES },
    startAt: { $gte: startOfLocalDay(date), $lte: endOfLocalDay(date) }
  };

  if (excludeAppointmentId) query._id = { $ne: excludeAppointmentId };
  return schedulingRepository.findAppointments(query, "startAt slot");
}

async function resolveAppointmentOwner(patientOrId, guestPatient) {
  const guestPhone = guestPatient?.phone || patientOrId?.phone;
  const patient = patientOrId?.isGuest
    ? null
    : patientOrId?._id
    ? patientOrId
    : patientOrId
      ? await schedulingRepository.findPatientById(patientOrId)
      : null;
  const phone = patient?.phone || guestPhone;
  const phonePatient = !patient && phone ? await schedulingRepository.findPatientByPhone(phone) : null;

  return {
    patientId: patient?._id || phonePatient?._id,
    guestPhone: phone
  };
}

async function assertPatientHasNoSameSlot({ patientId, guestPhone, date, slot, excludeAppointmentId, knownAppointments }) {
  if (knownAppointments?.some((appointment) => sameSlot(appointment, slot))) {
    throw httpError("Bệnh nhân đã có lịch hẹn trong cùng khung giờ của ngày này.", 409);
  }

  const ownerFilters = [];
  if (patientId) ownerFilters.push({ patient: patientId });
  if (guestPhone) ownerFilters.push({ "guestPatient.phone": guestPhone });
  if (!ownerFilters.length) return;

  const query = {
    $or: ownerFilters,
    status: { $in: BLOCKING_STATUSES },
    startAt: { $gte: startOfLocalDay(date), $lte: endOfLocalDay(date) }
  };
  const window = slotWindow(date, slot);
  query.$and = [{
    $or: [
      { slot: slot._id },
      { startAt: { $gte: window.startAt, $lt: window.endAt } }
    ]
  }];
  if (excludeAppointmentId) query._id = { $ne: excludeAppointmentId };
  const existing = await schedulingRepository.findAppointmentConflict(query, "_id");
  if (existing) {
    throw httpError("Bệnh nhân đã có lịch hẹn trong cùng khung giờ của ngày này.", 409);
  }
}

async function assertAppointmentResourcesAvailable({ patientId, guestPhone, dentistId, nurseId, roomId, date, slot, excludeAppointmentId }) {
  const resourceChecks = [
    { room: roomId },
    { dentist: dentistId }
  ];

  if (patientId) resourceChecks.push({ patient: patientId });
  if (guestPhone) resourceChecks.push({ "guestPatient.phone": guestPhone });
  if (nurseId) resourceChecks.push({ nurse: nurseId });

  const query = {
    status: { $in: BLOCKING_STATUSES },
    startAt: { $gte: startOfLocalDay(date), $lte: endOfLocalDay(date) },
    $or: resourceChecks
  };
  const window = slotWindow(date, slot);
  query.$and = [{
    $or: [
      { slot: slot._id },
      { startAt: { $gte: window.startAt, $lt: window.endAt } }
    ]
  }];

  if (excludeAppointmentId) query._id = { $ne: excludeAppointmentId };

  const conflict = await schedulingRepository.findAppointmentConflict(query, "room dentist nurse patient guestPatient slot");
  if (!conflict) return;

  if (patientId && sameId(conflict.patient, patientId)) {
    throw httpError("Bệnh nhân đã có lịch hẹn trong cùng khung giờ của ngày này.", 409);
  }
  if (guestPhone && conflict.guestPatient?.phone === guestPhone) {
    throw httpError("Bệnh nhân đã có lịch hẹn trong cùng khung giờ của ngày này.", 409);
  }
  if (sameId(conflict.room, roomId)) {
    throw httpError("Phòng khám đã có lịch hẹn trong khung giờ này.", 409);
  }
  if (sameId(conflict.dentist, dentistId)) {
    throw httpError("Bác sĩ đã có lịch hẹn trong khung giờ này.", 409);
  }
  if (nurseId && sameId(conflict.nurse, nurseId)) {
    throw httpError("Y tá đã có lịch hẹn trong khung giờ này.", 409);
  }
}

export async function findAvailableSlots({ date, serviceId, excludeAppointmentId, includeBooked = false }) {
  if (!isWorkingDate(date)) return [];

  const service = await schedulingRepository.findServiceById(serviceId);
  if (!service) throw httpError("Không tìm thấy dịch vụ nha khoa.", 404);

  const [rooms, appointments, activeSlots] = await Promise.all([
    schedulingRepository.findActiveRoomsWithDentists(),
    getAppointmentsForDate(date, excludeAppointmentId),
    findBookableAppointmentSlots(date)
  ]);

  const slots = [];

  for (const room of rooms) {
    if (!room.assignedDentist) continue;
    const roomAppointments = appointments.filter((item) => sameId(item.room, room._id));
    const dentistAppointments = appointments.filter((item) => sameId(item.dentist, room.assignedDentist._id));

    for (const slotConfig of activeSlots) {
      const { startAt } = slotTimes(date, slotConfig);
      const conflictingAppointments = uniqueAppointments([
        ...roomAppointments.filter((appointment) => sameSlot(appointment, slotConfig)),
        ...dentistAppointments.filter((appointment) => sameSlot(appointment, slotConfig))
      ]);
      const isBooked = conflictingAppointments.length > 0;

      if (includeBooked || !isBooked) {
        slots.push(buildSlot({ room, service, startAt, slotConfig, conflictingAppointments }));
      }
    }
  }

  return slots.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
}

function buildSlot({ room, service, startAt, slotConfig, conflictingAppointments = [] }) {
  return {
    startAt,
    arrivalAt: calculateArrivalAt(startAt),
    slot: slotOption(slotConfig),
    session: slotConfig.slotName,
    isBooked: conflictingAppointments.length > 0,
    bookedCount: conflictingAppointments.length,
    turnoverMinutes: 0,
    service: {
      _id: service._id,
      name: service.name,
      price: service.price
    },
    room: {
      _id: room._id,
      name: room.name,
      status: room.status,
      equipment: room.equipment
    },
    dentist: room.assignedDentist,
    nurse: room.assignedNurse
  };
}

function uniqueAppointments(appointments) {
  return Array.from(new Map(appointments.map((appointment) => [appointment._id.toString(), appointment])).values());
}

async function selectAvailableNurse(slot, date) {
  const [nurses, appointments] = await Promise.all([
    schedulingRepository.findActiveNurses(),
    getAppointmentsForDate(date)
  ]);

  return nurses.find((nurse) => {
    const nurseAppointments = appointments.filter((item) => sameId(item.nurse, nurse._id));
    return !nurseAppointments.some((appointment) => sameSlot(appointment, slot));
  });
}

function normalizeGuestPatient(guestPatient) {
  if (!guestPatient) return null;
  return {
    fullName: guestPatient.fullName,
    phone: guestPatient.phone,
    email: guestPatient.email || undefined,
    gender: guestPatient.gender || "unknown"
  };
}

export async function createAppointmentFromSlot({
  requester,
  patientId,
  guestPatient,
  serviceId,
  date,
  startAt,
  roomId,
  channel,
  note,
  dentistPreference = "selected"
}) {
  const patient = patientId ? await schedulingRepository.findPatientById(patientId) : null;
  if (patientId && (!patient || patient.role !== "patient")) {
    throw httpError("Không tìm thấy tài khoản bệnh nhân.", 404);
  }

  const guest = patientId ? null : normalizeGuestPatient(guestPatient);
  if (!patient && !guest) {
    throw httpError("Cần chọn bệnh nhân hoặc nhập thông tin bệnh nhân chưa có tài khoản.", 400);
  }

  const service = await schedulingRepository.findServiceById(serviceId);
  if (!service) throw httpError("Không tìm thấy dịch vụ nha khoa.", 404);

  const requestedStart = startAt ? new Date(startAt) : null;
  const requestedSlot = requestedStart ? await getRequestedSlot(date, requestedStart) : null;
  const owner = await resolveAppointmentOwner(patient, guest);
  const requiresReceptionScheduling =
    ["receptionist", "admin"].includes(requester.role) &&
    channel === "offline" &&
    !roomId &&
    Boolean(requestedStart);

  if (requiresReceptionScheduling || (requester.role === "patient" && dentistPreference === "random" && requestedStart)) {
    if (!isWorkingDate(date)) {
      throw httpError("Phòng khám không làm việc trong ngày đã chọn.", 400);
    }

    await assertPatientHasNoSameSlot({ ...owner, date, slot: requestedSlot.slot });

    return schedulingRepository.createAppointment({
      patient: patient?._id,
      guestPatient: guest || undefined,
      createdBy: requester._id,
      receptionist: ["receptionist", "admin"].includes(requester.role) ? requester._id : undefined,
      service: service._id,
      slot: requestedSlot.slot._id,
      channel,
      dentistPreference: requiresReceptionScheduling ? "random" : dentistPreference,
      startAt: requestedSlot.startAt,
      arrivalAt: calculateArrivalAt(requestedSlot.startAt),
      patientRequestedAt: new Date(),
      status: "pending",
      paymentStatus: "not_required",
      patientNote: note,
      receptionistNote: requiresReceptionScheduling
        ? "Lịch do lễ tân đặt hộ, đang chờ xác nhận giờ khám và bác sĩ."
        : undefined
    });
  }

  const canRequestBookedSlot = Boolean(requestedStart) && (requester.role === "patient" || channel === "online");
  const [slots, patientAppointments] = await Promise.all([
    findAvailableSlots({ date, serviceId, includeBooked: canRequestBookedSlot }),
    getPatientAppointmentsForDate(owner.patientId, date)
  ]);
  const selected = requestedStart
    ? selectRequestedSlot(slots, requestedStart, roomId, dentistPreference)
    : slots.find((slot) => !patientAppointments.some((appointment) => sameSlot(appointment, slot.slot)));

  if (!selected) {
    throw httpError("Không còn lịch trống phù hợp với dịch vụ hoặc ngày đã chọn.", 409);
  }

  await assertPatientHasNoSameSlot({ ...owner, date, slot: selected.slot, knownAppointments: patientAppointments });

  const nurse = selected.nurse || await selectAvailableNurse(selected.slot, date);
  if (!canRequestBookedSlot) {
    await assertAppointmentResourcesAvailable({
      ...owner,
      dentistId: selected.dentist._id,
      nurseId: nurse?._id,
      roomId: selected.room._id,
      date,
      slot: selected.slot
    });
  }

  const appointmentStatus = requester.role === "patient" || channel === "online" ? "pending" : "confirmed";

  return schedulingRepository.createAppointment({
    patient: patient?._id,
    guestPatient: guest || undefined,
    createdBy: requester._id,
    dentist: selected.dentist._id,
    receptionist: ["receptionist", "admin"].includes(requester.role) ? requester._id : undefined,
    nurse: nurse?._id,
    room: selected.room._id,
    service: selected.service._id,
    slot: selected.slot._id,
    channel,
    dentistPreference,
    startAt: selected.startAt,
    arrivalAt: selected.arrivalAt,
    patientRequestedAt: new Date(),
    status: appointmentStatus,
    paymentStatus: "not_required",
    patientNote: note
  });
}

function selectRequestedSlot(slots, requestedStart, roomId, dentistPreference) {
  const matches = slots.filter(
    (slot) =>
      slot.startAt.getTime() === requestedStart.getTime() &&
      (!roomId || sameId(slot.room._id, roomId))
  );

  if (!matches.length) return undefined;
  if (dentistPreference !== "random") return matches[0];

  return matches[Math.floor(Math.random() * matches.length)];
}

function slotContainsStartTime(slot, date, requestedStart) {
  const window = slotWindow(date, slot.slot);
  return requestedStart >= window.startAt && requestedStart < window.endAt;
}

export async function rescheduleAppointmentFromSlot({ appointment, serviceId, date, startAt, roomId }) {
  const requestedStart = startAt ? new Date(startAt) : null;
  const targetServiceId = serviceId || appointment.service.toString();
  const owner = await resolveAppointmentOwner(appointment.patient, appointment.guestPatient);
  const [slots, patientAppointments] = await Promise.all([
    findAvailableSlots({
      date,
      serviceId: targetServiceId,
      excludeAppointmentId: appointment._id,
      includeBooked: true
    }),
    getPatientAppointmentsForDate(owner.patientId, date, appointment._id)
  ]);

  const selected = requestedStart
    ? slots.find(
        (slot) =>
          slotContainsStartTime(slot, date, requestedStart) &&
          (!roomId || sameId(slot.room._id, roomId))
      )
    : slots.find((slot) => !patientAppointments.some((appointmentItem) => sameSlot(appointmentItem, slot.slot)));

  if (!selected) {
    throw httpError("Không còn lịch trống phù hợp để đổi lịch.", 409);
  }

  await assertPatientHasNoSameSlot({
    ...owner,
    date,
    slot: selected.slot,
    excludeAppointmentId: appointment._id,
    knownAppointments: patientAppointments
  });
  const nurse = selected.nurse || await selectAvailableNurse(selected.slot, date);
  const confirmedStartAt = requestedStart || selected.startAt;

  appointment.service = selected.service._id;
  appointment.room = selected.room._id;
  appointment.dentist = selected.dentist._id;
  appointment.nurse = nurse?._id;
  appointment.slot = selected.slot._id;
  appointment.startAt = confirmedStartAt;
  appointment.arrivalAt = calculateArrivalAt(confirmedStartAt);
  appointment.status = "scheduled";
  return schedulingRepository.saveAppointment(appointment);
}
