import * as schedulingRepository from "../repository/schedulingRepository.js";
import {
  WORKING_SESSIONS,
  APPOINTMENT_SLOT_MINUTES,
  addMinutes,
  calculateArrivalAt,
  combineDateAndTime,
  endOfLocalDay,
  isWorkingDate,
  minutesBetween,
  startOfLocalDay
} from "../utils/time.js";

const BLOCKING_STATUSES = ["pending", "scheduled", "confirmed", "checked_in", "in_treatment"];
const BOOKING_DURATION_MINUTES = APPOINTMENT_SLOT_MINUTES;

function httpError(message, statusCode = 400) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

function sameId(a, b) {
  return a?.toString() === b?.toString();
}

function hasTimeConflict(appointments, startAt, endAt) {
  return appointments.some((appointment) => startAt < appointment.endAt && endAt > appointment.startAt);
}

function slotBoundsFor(startAt) {
  const local = new Date(startAt.getTime() + 7 * 60 * 60 * 1000);
  const hour = local.getUTCHours();
  const minute = local.getUTCMinutes();
  const total = hour * 60 + minute;
  const slots = [
    [8 * 60, 10 * 60 + 30],
    [10 * 60 + 30, 12 * 60],
    [14 * 60, 16 * 60],
    [16 * 60, 17 * 60 + 30]
  ];
  const slot = slots.find(([start, end]) => total >= start && total < end) || [total, total + BOOKING_DURATION_MINUTES];
  const dayStartUtc = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate(), 0, 0) - 7 * 60 * 60 * 1000;
  return {
    startAt: new Date(dayStartUtc + slot[0] * 60_000),
    endAt: new Date(dayStartUtc + slot[1] * 60_000)
  };
}

async function getAppointmentsForDate(date, excludeAppointmentId) {
  const query = {
    status: { $in: BLOCKING_STATUSES },
    startAt: { $lt: endOfLocalDay(date) },
    endAt: { $gt: startOfLocalDay(date) }
  };

  if (excludeAppointmentId) {
    query._id = { $ne: excludeAppointmentId };
  }

  return schedulingRepository.findAppointments(query);
}

async function getPatientAppointmentsForDate(patientId, date, excludeAppointmentId) {
  const query = {
    patient: patientId,
    status: { $in: BLOCKING_STATUSES },
    startAt: { $lt: endOfLocalDay(date) },
    endAt: { $gt: startOfLocalDay(date) }
  };

  if (excludeAppointmentId) {
    query._id = { $ne: excludeAppointmentId };
  }

  return schedulingRepository.findAppointments(query, "startAt endAt");
}

async function assertPatientHasNoTimeConflict(patientId, startAt, endAt, excludeAppointmentId, knownAppointments) {
  if (knownAppointments && hasTimeConflict(knownAppointments, startAt, endAt)) {
    throw httpError("Bệnh nhân đã có lịch hẹn trùng thời gian.", 409);
  }

  const query = {
    patient: patientId,
    status: { $in: BLOCKING_STATUSES },
    startAt: { $lt: endAt },
    endAt: { $gt: startAt }
  };

  if (excludeAppointmentId) {
    query._id = { $ne: excludeAppointmentId };
  }

  const existing = await schedulingRepository.findAppointmentConflict(query, "startAt endAt");

  if (existing) {
    throw httpError("Bệnh nhân đã có lịch hẹn trùng thời gian.", 409);
  }
}

async function assertPatientHasNoSameSlot(patientId, startAt, excludeAppointmentId) {
  const slot = slotBoundsFor(startAt);
  const query = {
    patient: patientId,
    status: { $in: BLOCKING_STATUSES },
    startAt: { $lt: slot.endAt },
    endAt: { $gt: slot.startAt }
  };
  if (excludeAppointmentId) query._id = { $ne: excludeAppointmentId };
  const existing = await schedulingRepository.findAppointmentConflict(query, "startAt endAt");
  if (existing) {
    throw httpError("Bệnh nhân đã có lịch hẹn trong cùng slot của ngày này.", 409);
  }
}

async function assertAppointmentResourcesAvailable({ patientId, dentistId, nurseId, roomId, startAt, endAt, excludeAppointmentId }) {
  const resourceChecks = [
    { room: roomId },
    { dentist: dentistId },
    { patient: patientId }
  ];

  if (nurseId) {
    resourceChecks.push({ nurse: nurseId });
  }

  const query = {
    status: { $in: BLOCKING_STATUSES },
    startAt: { $lt: endAt },
    endAt: { $gt: startAt },
    $or: resourceChecks
  };

  if (excludeAppointmentId) {
    query._id = { $ne: excludeAppointmentId };
  }

  const conflict = await schedulingRepository.findAppointmentConflict(query, "room dentist nurse patient");
  if (!conflict) return;

  if (sameId(conflict.patient, patientId)) {
    throw httpError("Bệnh nhân đã có lịch hẹn trùng thời gian.", 409);
  }
  if (sameId(conflict.room, roomId)) {
    throw httpError("Phòng khám đã có lịch hẹn trùng thời gian.", 409);
  }
  if (sameId(conflict.dentist, dentistId)) {
    throw httpError("Bác sĩ đã có lịch hẹn trùng thời gian.", 409);
  }
  if (nurseId && sameId(conflict.nurse, nurseId)) {
    throw httpError("Y tá đã có lịch hẹn trùng thời gian.", 409);
  }
}

export async function findAvailableSlots({ date, serviceId, excludeAppointmentId, includeBooked = false }) {
  if (!isWorkingDate(date)) {
    return [];
  }

  const service = await schedulingRepository.findServiceById(serviceId);
  if (!service) {
    throw httpError("Không tìm thấy dịch vụ nha khoa.", 404);
  }

  const [rooms, appointments] = await Promise.all([
    schedulingRepository.findActiveRoomsWithDentists(),
    getAppointmentsForDate(date, excludeAppointmentId)
  ]);

  const slots = [];

  for (const room of rooms) {
    if (!room.assignedDentist) continue;
    const roomAppointments = appointments.filter((item) => sameId(item.room, room._id));
    const dentistAppointments = appointments.filter((item) => sameId(item.dentist, room.assignedDentist._id));

    for (const session of WORKING_SESSIONS) {
      const sessionStart = combineDateAndTime(date, session.start);
      const sessionEnd = combineDateAndTime(date, session.end);

      for (
        let startAt = sessionStart;
        minutesBetween(startAt, sessionEnd) >= BOOKING_DURATION_MINUTES;
        startAt = addMinutes(startAt, APPOINTMENT_SLOT_MINUTES)
      ) {
        const endAt = addMinutes(startAt, BOOKING_DURATION_MINUTES);

        const conflictingAppointments = uniqueAppointments([
          ...roomAppointments.filter((appointment) => hasTimeConflict([appointment], startAt, endAt)),
          ...dentistAppointments.filter((appointment) => hasTimeConflict([appointment], startAt, endAt))
        ]);
        const isBooked = conflictingAppointments.length > 0;

        if (includeBooked || !isBooked) {
          slots.push(buildSlot({ room, service, startAt, endAt, session, conflictingAppointments }));
        }
      }
    }
  }

  return slots.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
}

function buildSlot({ room, service, startAt, endAt, session, conflictingAppointments = [] }) {
  return {
    startAt,
    endAt,
    arrivalAt: calculateArrivalAt(startAt),
    session: session.label,
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

async function selectAvailableNurse(startAt, endAt, date) {
  const [nurses, appointments] = await Promise.all([
    schedulingRepository.findActiveNurses(),
    getAppointmentsForDate(date)
  ]);

  return nurses.find((nurse) => {
    const nurseAppointments = appointments.filter((item) => sameId(item.nurse, nurse._id));
    return !hasTimeConflict(nurseAppointments, startAt, endAt);
  });
}

export async function createAppointmentFromSlot({ requester, patientId, serviceId, date, startAt, roomId, channel, note, dentistPreference = "selected" }) {
  const patient = await schedulingRepository.findPatientById(patientId);
  if (!patient || patient.role !== "patient") {
    throw httpError("Không tìm thấy tài khoản bệnh nhân.", 404);
  }

  const service = await schedulingRepository.findServiceById(serviceId);
  if (!service) {
    throw httpError("Không tìm thấy dịch vụ nha khoa.", 404);
  }

  const requestedStart = startAt ? new Date(startAt) : null;
  const requiresReceptionScheduling =
    ["receptionist", "admin"].includes(requester.role) &&
    channel === "offline" &&
    !roomId &&
    Boolean(requestedStart);

  if (requiresReceptionScheduling) {
    if (!isWorkingDate(date)) {
      throw httpError("Phòng khám không làm việc trong ngày đã chọn.", 400);
    }

    const requestedEnd = addMinutes(requestedStart, BOOKING_DURATION_MINUTES);
    await assertPatientHasNoSameSlot(patient._id, requestedStart);
    await assertPatientHasNoTimeConflict(patient._id, requestedStart, requestedEnd);

    return schedulingRepository.createAppointment({
      patient: patient._id,
      createdBy: requester._id,
      receptionist: requester._id,
      service: service._id,
      channel,
      dentistPreference: "random",
      startAt: requestedStart,
      endAt: requestedEnd,
      status: "pending",
      paymentStatus: "not_required",
      patientNote: note,
      receptionistNote: "Lịch do lễ tân đặt hộ, đang chờ xác nhận giờ khám và bác sĩ."
    });
  }

  if (requester.role === "patient" && dentistPreference === "random" && requestedStart) {
    if (!isWorkingDate(date)) {
      throw httpError("Phòng khám không làm việc trong ngày đã chọn.", 400);
    }
    const requestedEnd = addMinutes(requestedStart, BOOKING_DURATION_MINUTES);
    await assertPatientHasNoSameSlot(patient._id, requestedStart);
    await assertPatientHasNoTimeConflict(patient._id, requestedStart, requestedEnd);

    return schedulingRepository.createAppointment({
      patient: patient._id,
      createdBy: requester._id,
      service: service._id,
      channel,
      dentistPreference,
      startAt: requestedStart,
      endAt: requestedEnd,
      arrivalAt: calculateArrivalAt(requestedStart),
      status: "pending",
      paymentStatus: "not_required",
      patientNote: note
    });
  }

  const canRequestBookedSlot = Boolean(requestedStart) && (requester.role === "patient" || channel === "online");
  const [slots, patientAppointments] = await Promise.all([
    findAvailableSlots({ date, serviceId, includeBooked: canRequestBookedSlot }),
    getPatientAppointmentsForDate(patient._id, date)
  ]);
  const selected = requestedStart
    ? selectRequestedSlot(slots, requestedStart, roomId, dentistPreference)
    : slots.find((slot) => !hasTimeConflict(patientAppointments, slot.startAt, slot.endAt));

  if (!selected) {
    throw httpError("Không còn lịch trống phù hợp với dịch vụ hoặc ngày đã chọn.", 409);
  }

  await assertPatientHasNoTimeConflict(patient._id, selected.startAt, selected.endAt, undefined, patientAppointments);
  await assertPatientHasNoSameSlot(patient._id, selected.startAt);

  const nurse = selected.nurse || await selectAvailableNurse(selected.startAt, selected.endAt, date);
  if (!canRequestBookedSlot) {
    await assertAppointmentResourcesAvailable({
      patientId: patient._id,
      dentistId: selected.dentist._id,
      nurseId: nurse?._id,
      roomId: selected.room._id,
      startAt: selected.startAt,
      endAt: selected.endAt
    });
  }

  const appointmentStatus = requester.role === "patient" || channel === "online" ? "pending" : "confirmed";

  return schedulingRepository.createAppointment({
    patient: patient._id,
    createdBy: requester._id,
    dentist: selected.dentist._id,
    receptionist: ["receptionist", "admin"].includes(requester.role) ? requester._id : undefined,
    nurse: nurse?._id,
    room: selected.room._id,
    service: selected.service._id,
    channel,
    dentistPreference,
    startAt: selected.startAt,
    endAt: selected.endAt,
    arrivalAt: selected.arrivalAt,
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

export async function rescheduleAppointmentFromSlot({ appointment, serviceId, date, startAt, roomId }) {
  const requestedStart = startAt ? new Date(startAt) : null;
  const targetServiceId = serviceId || appointment.service.toString();
  const [slots, patientAppointments] = await Promise.all([
    findAvailableSlots({
      date,
      serviceId: targetServiceId,
      excludeAppointmentId: appointment._id,
      includeBooked: true
    }),
    getPatientAppointmentsForDate(appointment.patient, date, appointment._id)
  ]);

  const selected = requestedStart
    ? slots.find(
        (slot) =>
          slot.startAt.getTime() === requestedStart.getTime() &&
          (!roomId || sameId(slot.room._id, roomId))
      )
    : slots.find((slot) => !hasTimeConflict(patientAppointments, slot.startAt, slot.endAt));

  if (!selected) {
    throw httpError("Không còn lịch trống phù hợp để đổi lịch.", 409);
  }

  await assertPatientHasNoTimeConflict(appointment.patient, selected.startAt, selected.endAt, appointment._id, patientAppointments);
  await assertPatientHasNoSameSlot(appointment.patient, selected.startAt, appointment._id);
  const nurse = selected.nurse || await selectAvailableNurse(selected.startAt, selected.endAt, date);

  appointment.service = selected.service._id;
  appointment.room = selected.room._id;
  appointment.dentist = selected.dentist._id;
  appointment.nurse = nurse?._id;
  appointment.startAt = selected.startAt;
  appointment.endAt = selected.endAt;
  appointment.arrivalAt = selected.arrivalAt;
  appointment.status = "scheduled";
  return schedulingRepository.saveAppointment(appointment);
}
