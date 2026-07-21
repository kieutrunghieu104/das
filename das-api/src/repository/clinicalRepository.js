import { toObjectId } from "../config/mongodb.js";
import { COLLECTIONS } from "../models/index.js";
import {
  findById,
  findMany,
  findOne,
  insertDocuments,
  normalizeIdFields,
  populate,
  removeById,
  updateById,
  updateOneAndReturn
} from "./mongoRepository.js";
import { attachProfileToUser } from "./profileRepository.js";

const clinicalAppointmentPopulate = [
  { path: "patient", select: "fullName phone email" },
  { path: "dentist", select: "fullName" },
  { path: "nurse", select: "fullName" },
  { path: "room", select: "name status" },
  { path: "slot", select: "slotName startTime endTime order" },
  { path: "service", select: "name price" }
];

const treatmentRecordPopulate = [
  { path: "appointment", populate: { path: "service", select: "name" } },
  { path: "patient", select: "fullName phone email" },
  { path: "dentist", select: "fullName" },
  { path: "nurse", select: "fullName" }
];

const patientHistoryPopulate = [
  {
    path: "appointment",
    populate: [
      { path: "service", select: "name" },
      { path: "room", select: "name" }
    ]
  },
  { path: "patient", select: "fullName phone email" },
  { path: "dentist", select: "fullName" },
  { path: "nurse", select: "fullName" }
];

const appointmentIdFields = ["patient", "dentist", "nurse", "room", "service", "slot"];

function attachGuestPatient(appointment) {
  if (appointment && !appointment.patient && appointment.guestPatient) {
    appointment.patient = {
      ...appointment.guestPatient,
      isGuest: true
    };
  }
  return appointment;
}

export async function findClinicalAppointments(query, limit = 120) {
  const appointments = await findMany(
    COLLECTIONS.appointments,
    normalizeIdFields(query, appointmentIdFields),
    { sort: { startAt: 1 }, limit }
  );
  await populate(appointments, clinicalAppointmentPopulate);
  return appointments.map(attachGuestPatient);
}

export function findActiveAppointmentSlots() {
  return findMany(COLLECTIONS.appointmentSlots, {}, { sort: { order: 1, startTime: 1 } });
}

export async function findClinicalTreatmentRecords(query, limit = 100) {
  const records = await findMany(
    COLLECTIONS.treatmentRecords,
    normalizeIdFields(query, ["patient", "dentist", "nurse", "appointment"]),
    { sort: { updatedAt: -1 }, limit }
  );
  await populate(records, treatmentRecordPopulate);
  return records;
}

export async function findClinicalRooms() {
  const rooms = await findMany(COLLECTIONS.clinicRooms, {}, { sort: { name: 1 } });
  await populate(rooms, [
    { path: "assignedDentist", select: "fullName" },
    { path: "assignedNurse", select: "fullName phone" }
  ]);
  return rooms;
}

export function findActiveDentalServices() {
  return findMany(COLLECTIONS.dentalServices, {}, { sort: { name: 1 } });
}

export async function findPatientByPhone(phone) {
  const patient = await findOne(
    COLLECTIONS.users,
    { phone, status: "active" },
    "fullName phone email roleRef status"
  );
  return attachProfileToUser(patient);
}

export function findServiceById(serviceId) {
  return findById(COLLECTIONS.dentalServices, serviceId);
}

export async function hasRelatedAppointment(query) {
  const appointment = await findOne(
    COLLECTIONS.appointments,
    normalizeIdFields(query, appointmentIdFields),
    "_id"
  );
  return Boolean(appointment);
}

export async function findPatientAppointments(patientId) {
  const appointments = await findMany(
    COLLECTIONS.appointments,
    { patient: toObjectId(patientId) },
    { sort: { startAt: -1 }, limit: 10 }
  );
  await populate(appointments, [
    { path: "patient", select: "fullName phone email gender address" },
    { path: "service", select: "name" },
    { path: "dentist", select: "fullName" },
    { path: "room", select: "name" }
  ]);
  return appointments;
}

export async function findPatientTreatmentHistory(patientId) {
  const records = await findMany(
    COLLECTIONS.treatmentRecords,
    { patient: toObjectId(patientId) },
    { sort: { treatmentDate: -1, updatedAt: -1 }, limit: 50 }
  );
  await populate(records, patientHistoryPopulate);
  return records;
}

export function findAppointmentById(appointmentId) {
  return findById(COLLECTIONS.appointments, appointmentId);
}

export function findTreatmentRecordByAppointment(appointmentId) {
  return findOne(COLLECTIONS.treatmentRecords, { appointment: toObjectId(appointmentId) });
}

export function findTreatmentRecordByPatientServiceDate(patientId, serviceId, treatmentDate) {
  return findOne(
    COLLECTIONS.treatmentRecords,
    {
      patient: toObjectId(patientId),
      "serviceSnapshot.service": toObjectId(serviceId),
      treatmentDate
    },
    "_id"
  );
}

export async function findTreatmentRecordById(recordId) {
  const record = await findById(COLLECTIONS.treatmentRecords, recordId);
  await populate(record, treatmentRecordPopulate);
  return record;
}

export async function updateAppointment(appointmentId, data) {
  const appointment = await updateById(COLLECTIONS.appointments, appointmentId, data);
  await populate(appointment, clinicalAppointmentPopulate);
  return appointment;
}

export async function createTreatmentRecord(data) {
  const record = await insertDocuments(COLLECTIONS.treatmentRecords, data);
  await populate(record, treatmentRecordPopulate);
  return record;
}

export async function updateTreatmentRecord(recordId, update) {
  const record = await updateById(COLLECTIONS.treatmentRecords, recordId, update);
  await populate(record, treatmentRecordPopulate);
  return record;
}

export function deleteTreatmentRecord(recordId) {
  return removeById(COLLECTIONS.treatmentRecords, recordId);
}

export async function upsertTreatmentRecord(appointmentId, update) {
  const record = await updateOneAndReturn(
    COLLECTIONS.treatmentRecords,
    { appointment: toObjectId(appointmentId) },
    { ...update, appointment: toObjectId(appointmentId) },
    { upsert: true }
  );
  await populate(record, [
    { path: "appointment", populate: { path: "service", select: "name" } },
    { path: "patient", select: "fullName phone email" }
  ]);
  return record;
}

export function updateRoomStatus(roomId, data) {
  return updateById(COLLECTIONS.clinicRooms, roomId, data);
}

export function findActiveTreatmentByRoom(roomId) {
  return findOne(COLLECTIONS.appointments, {
    room: toObjectId(roomId),
    status: "in_treatment"
  });
}

export function createRoomStatus(data) {
  return insertDocuments(COLLECTIONS.roomStatuses, data);
}

