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

export const appointmentPopulate = [
  { path: "patient", select: "fullName email phone" },
  { path: "createdBy", select: "fullName role" },
  { path: "receptionist", select: "fullName role" },
  { path: "confirmationBy", select: "fullName role" },
  { path: "dentist", select: "fullName phone avatarUrl yearsOfExperience bio" },
  { path: "nurse", select: "fullName phone" },
  { path: "room", select: "name status equipment" },
  {
    path: "service",
    select: "name durationMinutes transitionTime price requiresPrepayment isConsultation"
  },
  { path: "appointmentSlot", select: "slotDate startAt endAt status" }
];

const appointmentIdFields = ["_id", "patient", "dentist", "nurse", "room", "service"];
const appointmentRelationFields = [
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

export async function findAppointments(query) {
  const appointments = await findMany(
    COLLECTIONS.appointments,
    normalizeIdFields(query, appointmentIdFields),
    { sort: { startAt: 1 }, limit: 200 }
  );
  await populate(appointments, appointmentPopulate);
  return appointments;
}

export function findAppointmentById(appointmentId) {
  return findById(COLLECTIONS.appointments, appointmentId);
}

export async function findAppointmentByIdPopulated(appointmentId) {
  const appointment = await findAppointmentById(appointmentId);
  await populate(appointment, appointmentPopulate);
  return appointment;
}

export async function findAppointmentWithService(appointmentId) {
  const appointment = await findAppointmentById(appointmentId);
  await populate(appointment, { path: "service" });
  return appointment;
}

export async function findAppointmentWithServiceName(appointmentId) {
  const appointment = await findAppointmentById(appointmentId);
  await populate(appointment, { path: "service", select: "name" });
  return appointment;
}

export function populateAppointment(appointment) {
  return populate(appointment, appointmentPopulate);
}

export function saveAppointment(appointment) {
  const update = { ...appointment };
  delete update._id;
  for (const field of appointmentRelationFields) {
    if (update[field]?._id) update[field] = update[field]._id;
  }
  return getCollection(COLLECTIONS.appointments).findOneAndUpdate(
    { _id: toObjectId(appointment._id) },
    { $set: { ...update, updatedAt: new Date() } },
    { returnDocument: "after" }
  );
}

export function updateAppointmentSlotStatus(slotId, status) {
  return updateById(COLLECTIONS.appointmentSlots, slotId, { status });
}

export function createPatientNotification(data) {
  return insertDocuments(COLLECTIONS.notifications, {
    isRead: false,
    ...data
  });
}

export function findActiveReceptionists() {
  return findMany(COLLECTIONS.users, { role: "receptionist", status: "active" }, { projection: "_id fullName", limit: 100 });
}

export async function findInvoiceByAppointment(appointmentId) {
  const invoice = await findOne(COLLECTIONS.invoices, { appointment: toObjectId(appointmentId) });
  if (!invoice) return invoice;
  invoice.payments = await findMany(
    COLLECTIONS.payments,
    { invoice: invoice._id },
    { sort: { paymentDate: 1, createdAt: 1 }, limit: 100 }
  );
  return invoice;
}

export function createInvoice(data) {
  return insertDocuments(COLLECTIONS.invoices, {
    invoiceDate: new Date(),
    status: "unpaid",
    ...data
  });
}

export function saveInvoice(invoice) {
  const update = { ...invoice };
  delete update._id;
  if (update.appointment?._id) update.appointment = update.appointment._id;
  if (update.patient?._id) update.patient = update.patient._id;
  return updateById(COLLECTIONS.invoices, invoice._id, update);
}

export function createPayment(data) {
  return insertDocuments(COLLECTIONS.payments, {
    paymentMethod: "cash",
    paymentStatus: "paid",
    paymentDate: new Date(),
    ...data
  });
}

export function updateAppointmentRoomStatus(roomId, status) {
  if (!roomId) return null;
  return updateById(COLLECTIONS.clinicRooms, roomId, { status });
}

export async function deleteAppointmentCascade(appointment) {
  const appointmentId = toObjectId(appointment._id);
  const invoices = await findMany(COLLECTIONS.invoices, { appointment: appointmentId }, { projection: "_id" });
  const invoiceIds = invoices.map((invoice) => invoice._id);
  await Promise.all([
    invoiceIds.length
      ? getCollection(COLLECTIONS.payments).deleteMany({ invoice: { $in: invoiceIds } })
      : Promise.resolve(),
    invoiceIds.length
      ? getCollection(COLLECTIONS.invoices).deleteMany({ _id: { $in: invoiceIds } })
      : Promise.resolve(),
    getCollection(COLLECTIONS.treatmentRecords).deleteMany({ appointment: appointmentId }),
    getCollection(COLLECTIONS.reviews).deleteMany({ appointment: appointmentId })
  ]);

  if (appointment.appointmentSlot) {
    await getCollection(COLLECTIONS.appointmentSlots).deleteOne({
      _id: toObjectId(appointment.appointmentSlot?._id || appointment.appointmentSlot)
    });
  }

  await getCollection(COLLECTIONS.appointments).deleteOne({ _id: appointmentId });
  return { _id: appointmentId, deleted: true };
}

export function findActivePaymentServices() {
  return findMany(COLLECTIONS.dentalServices, { isActive: { $ne: false } });
}
