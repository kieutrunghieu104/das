import { toObjectId } from "../config/mongodb.js";
import { COLLECTIONS } from "../models/index.js";
import {
  findMany,
  findOne,
  insertDocuments,
  normalizeIdFields,
  populate,
  removeById,
  updateById,
  updateOneAndReturn
} from "./mongoRepository.js";

const appointmentPopulate = [
  { path: "patient", select: "fullName email phone" },
  { path: "createdBy", select: "fullName role" },
  { path: "receptionist", select: "fullName role" },
  { path: "dentist", select: "fullName phone" },
  { path: "nurse", select: "fullName phone" },
  { path: "room", select: "name status equipment" },
  { path: "slot", select: "slotName startTime endTime order" },
  {
    path: "service",
    select: "name price"
  }
];

const consultationPopulate = [
  { path: "service", select: "name" }
];

async function attachRole(user) {
  await populate(user, { path: "roleRef", select: "roleName" });
  if (user?.roleRef?.roleName) user.role = user.roleRef.roleName;
  return user;
}

function attachGuestPatient(appointment) {
  if (appointment && !appointment.patient && appointment.guestPatient) {
    appointment.patient = {
      ...appointment.guestPatient,
      isGuest: true
    };
  }
  return appointment;
}

export async function findReceptionAppointments(query) {
  const appointments = await findMany(
    COLLECTIONS.appointments,
    query,
    { sort: { startAt: 1 }, limit: 120 }
  );
  await populate(appointments, appointmentPopulate);
  const appointmentIds = appointments.map((appointment) => appointment._id);
  if (appointmentIds.length) {
    const invoices = await findMany(
      COLLECTIONS.invoices,
      { appointment: { $in: appointmentIds } },
      { sort: { createdAt: -1 } }
    );
    const invoiceIds = invoices.map((invoice) => invoice._id);
    if (invoiceIds.length) {
      const payments = await findMany(
        COLLECTIONS.payments,
        { invoice: { $in: invoiceIds } },
        { sort: { paymentDate: 1, createdAt: 1 }, limit: 500 }
      );
      const paymentMap = new Map();
      payments.forEach((payment) => {
        const key = payment.invoice?.toString();
        if (!paymentMap.has(key)) paymentMap.set(key, []);
        paymentMap.get(key).push(payment);
      });
      invoices.forEach((invoice) => {
        invoice.payments = paymentMap.get(invoice._id.toString()) || [];
      });
    }
    const invoiceMap = new Map(invoices.map((invoice) => [invoice.appointment.toString(), invoice]));
    appointments.forEach((appointment) => {
      appointment.invoice = invoiceMap.get(appointment._id.toString()) || null;
    });
  }
  return appointments.map(attachGuestPatient);
}

export function findReceptionPatients(filter, limit = 50) {
  return findMany(COLLECTIONS.users, filter, {
    projection: "-passwordHash",
    sort: { fullName: 1 },
    limit
  });
}

export function findActiveServices() {
  return findMany(COLLECTIONS.dentalServices, {}, { sort: { name: 1 } });
}

export function findActiveAppointmentSlots() {
  return findMany(COLLECTIONS.appointmentSlots, {}, { sort: { order: 1, startTime: 1 } });
}

export function findAppointmentSlots() {
  return findMany(COLLECTIONS.appointmentSlots, {}, { sort: { order: 1, startTime: 1 } });
}

export function findAppointmentSlotById(slotId) {
  return findOne(COLLECTIONS.appointmentSlots, { _id: toObjectId(slotId) }, "_id slotName startTime endTime order");
}

export function findAppointmentSlotClosures() {
  return findMany(COLLECTIONS.appointmentSlotClosures, { isClosed: true }, { sort: { date: 1 }, limit: 500 });
}

export function updateAppointmentSlotClosure(slotId, date, isClosed) {
  return updateOneAndReturn(
    COLLECTIONS.appointmentSlotClosures,
    { slot: toObjectId(slotId), date },
    { slot: toObjectId(slotId), date, isClosed },
    { upsert: true }
  );
}

export async function findReceptionRooms() {
  const rooms = await findMany(COLLECTIONS.clinicRooms, {}, { sort: { name: 1 } });
  await populate(rooms, [
    { path: "assignedDentist", select: "fullName phone" },
    { path: "assignedNurse", select: "fullName phone" }
  ]);
  return rooms;
}

export async function findConsultationRequests(query = {}, limit = 100) {
  const requests = await findMany(
    COLLECTIONS.consultationRequests,
    normalizeIdFields(query, ["service"]),
    { sort: { createdAt: -1 }, limit }
  );
  await populate(requests, consultationPopulate);
  return requests;
}

export async function findActivePatientById(patientId) {
  const patient = await findOne(COLLECTIONS.users, {
    _id: toObjectId(patientId),
    status: "active"
  });
  await attachRole(patient);
  return patient?.role === "patient" ? patient : null;
}

export async function findUserByPhone(phone) {
  return attachRole(await findOne(COLLECTIONS.users, { phone }));
}

export async function findUserByEmail(email) {
  return attachRole(await findOne(COLLECTIONS.users, { email }));
}

export function ensurePatientRole(data) {
  return updateOneAndReturn(
    COLLECTIONS.roles,
    { roleName: "patient" },
    data,
    { upsert: true }
  );
}

export function createPatientUser(data) {
  return insertDocuments(COLLECTIONS.users, {
    status: "active",
    ...data
  });
}

export function updatePatientUser(userId, data) {
  return updateById(COLLECTIONS.users, userId, data);
}

export function upsertPatientProfile(userId, data) {
  return updateOneAndReturn(
    COLLECTIONS.patients,
    { user: toObjectId(userId) },
    { ...data, user: toObjectId(userId) },
    { upsert: true }
  );
}

export function createPatientProfile(data) {
  return insertDocuments(COLLECTIONS.patients, {
    gender: "unknown",
    ...data
  });
}

export function deleteConsultationRequest(requestId) {
  return removeById(COLLECTIONS.consultationRequests, requestId);
}

export function updateConsultationRequest(requestId, data) {
  return updateById(COLLECTIONS.consultationRequests, requestId, data);
}
