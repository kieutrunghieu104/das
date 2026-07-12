import { getCollection, toObjectId } from "../config/mongodb.js";
import { COLLECTIONS } from "../models/index.js";
import {
  findById,
  findMany,
  findOne,
  insertDocuments,
  normalizeIdFields,
  populate
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

export async function findActiveRoomsWithDentists() {
  const rooms = await findMany(COLLECTIONS.clinicRooms, {});
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

async function getRoleIds(roleName) {
  const roles = await findMany(COLLECTIONS.roles, { roleName }, { projection: "_id" });
  return roles.map((role) => role._id);
}

export async function findActiveNurses() {
  const roleIds = await getRoleIds("nurse");
  return findMany(
    COLLECTIONS.users,
    { roleRef: { $in: roleIds }, status: "active" },
    { sort: { fullName: 1 } }
  );
}

export async function findPatientById(patientId) {
  const patient = await findById(COLLECTIONS.users, patientId);
  await populate(patient, { path: "roleRef", select: "roleName" });
  if (patient?.roleRef?.roleName) patient.role = patient.roleRef.roleName;
  return patient;
}

export function createAppointment(data) {
  return insertDocuments(COLLECTIONS.appointments, {
    status: "pending",
    paymentStatus: "not_required",
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
