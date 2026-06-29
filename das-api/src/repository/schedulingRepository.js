import { getCollection, toObjectId } from "../config/mongodb.js";
import { COLLECTIONS } from "../models/index.js";
import {
  findById,
  findMany,
  findOne,
  insertDocuments,
  normalizeIdFields,
  populate,
  updateById
} from "./mongoRepository.js";

const appointmentIdFields = ["_id", "patient", "dentist", "nurse", "room", "service"];

export function findAppointments(query, select) {
  return findMany(
    COLLECTIONS.appointments,
    normalizeIdFields(query, appointmentIdFields),
    { projection: select, sort: { startAt: 1 } }
  );
}

export function findAppointmentConflict(query, select) {
  return findOne(
    COLLECTIONS.appointments,
    normalizeIdFields(query, appointmentIdFields),
    select
  );
}

export function findServiceById(serviceId) {
  return findById(COLLECTIONS.dentalServices, serviceId);
}

export function findDentistServicesByService(serviceId) {
  return findMany(COLLECTIONS.dentistServices, { service: toObjectId(serviceId) });
}

export async function findActiveRoomsWithDentists() {
  const rooms = await findMany(COLLECTIONS.clinicRooms, {
    isActive: { $ne: false },
    status: { $ne: "maintenance" }
  });
  await populate(rooms, {
    path: "assignedDentist",
    select: "fullName yearsOfExperience bio email phone avatarUrl"
  });
  await populate(rooms, {
    path: "assignedNurse",
    select: "fullName phone"
  });
  return rooms;
}

export function findActiveNurses() {
  return findMany(
    COLLECTIONS.users,
    { role: "nurse", status: "active" },
    { sort: { fullName: 1 } }
  );
}

export function findPatientById(patientId) {
  return findById(COLLECTIONS.users, patientId);
}

export function createAppointmentSlot(data) {
  return insertDocuments(COLLECTIONS.appointmentSlots, {
    status: "available",
    ...data
  });
}

export function updateAppointmentSlotStatus(slotId, status) {
  return updateById(COLLECTIONS.appointmentSlots, slotId, { status });
}

export function createAppointment(data) {
  return insertDocuments(COLLECTIONS.appointments, {
    bookingDate: new Date(),
    status: "pending",
    paymentStatus: "pending_checkin",
    ...data
  });
}

export function saveAppointment(appointment) {
  const relationFields = [
    "patient",
    "createdBy",
    "dentist",
    "receptionist",
    "nurse",
    "room",
    "service",
    "appointmentSlot",
    "confirmationBy",
    "cancelledBy"
  ];
  const update = { ...appointment };
  delete update._id;
  for (const field of relationFields) {
    if (update[field]?._id) update[field] = update[field]._id;
  }
  return getCollection(COLLECTIONS.appointments).findOneAndUpdate(
    { _id: toObjectId(appointment._id) },
    { $set: { ...update, updatedAt: new Date() } },
    { returnDocument: "after" }
  );
}
