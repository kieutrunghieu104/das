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
  {
    path: "service",
    select: "name price"
  }
];

const consultationPopulate = [
  { path: "service", select: "name" },
  { path: "handledBy", select: "fullName" }
];

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
  return appointments;
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
    normalizeIdFields(query, ["service", "handledBy"]),
    { sort: { createdAt: -1 }, limit }
  );
  await populate(requests, consultationPopulate);
  return requests;
}

export function findActivePatientById(patientId) {
  return findOne(COLLECTIONS.users, {
    _id: toObjectId(patientId),
    role: "patient",
    status: "active"
  });
}

export function findUserByPhone(phone) {
  return findOne(COLLECTIONS.users, { phone });
}

export function findUserByEmail(email) {
  return findOne(COLLECTIONS.users, { email });
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

export async function updateConsultationRequest(requestId, data) {
  const request = await updateById(COLLECTIONS.consultationRequests, requestId, data);
  await populate(request, consultationPopulate);
  return request;
}

export function deleteConsultationRequest(requestId) {
  return removeById(COLLECTIONS.consultationRequests, requestId);
}
