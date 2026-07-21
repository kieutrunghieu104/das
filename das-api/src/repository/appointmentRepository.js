import { getCollection, toObjectId } from "../config/mongodb.js";
import { COLLECTIONS } from "../models/index.js";
import {
  findById,
  findMany,
  findOne,
  insertDocuments,
  normalizeIdFields,
  populate,
  removeById,
  updateById
} from "./mongoRepository.js";

function compact(data) {
  return Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined));
}

export const appointmentPopulate = [
  { path: "patient", select: "fullName email phone" },
  { path: "createdBy", select: "fullName role" },
  { path: "receptionist", select: "fullName role" },
  { path: "confirmationBy", select: "fullName role" },
  { path: "dentist", select: "fullName phone avatarUrl yearsOfExperience bio" },
  { path: "nurse", select: "fullName phone" },
  { path: "room", select: "name status" },
  { path: "slot", select: "slotName startTime endTime order" },
  {
    path: "service",
    select: "name price"
  }
];

const appointmentIdFields = ["_id", "patient", "dentist", "nurse", "room", "service", "slot"];
const appointmentRelationFields = [
  "patient",
  "createdBy",
  "dentist",
  "receptionist",
  "nurse",
  "room",
  "service",
  "slot",
  "confirmationBy",
  "cancelledBy"
];

function attachGuestPatient(appointment) {
  if (appointment && !appointment.patient && appointment.guestPatient) {
    appointment.patient = {
      ...appointment.guestPatient,
      isGuest: true
    };
  }
  return appointment;
}

export async function findAppointments(query) {
  const appointments = await findMany(
    COLLECTIONS.appointments,
    normalizeIdFields(query, appointmentIdFields),
    { sort: { startAt: 1 }, limit: 200 }
  );
  await populate(appointments, appointmentPopulate);
  return appointments.map(attachGuestPatient);
}

export function findAppointmentById(appointmentId) {
  return findById(COLLECTIONS.appointments, appointmentId);
}

export async function findAppointmentByIdPopulated(appointmentId) {
  const appointment = await findAppointmentById(appointmentId);
  await populate(appointment, appointmentPopulate);
  return attachGuestPatient(appointment);
}

export async function findAppointmentWithService(appointmentId) {
  const appointment = await findAppointmentById(appointmentId);
  await populate(appointment, { path: "service" });
  return attachGuestPatient(appointment);
}

export async function findAppointmentWithServiceName(appointmentId) {
  const appointment = await findAppointmentById(appointmentId);
  await populate(appointment, { path: "service", select: "name" });
  return attachGuestPatient(appointment);
}

export async function findActiveTreatmentConflict(appointment) {
  const resourceFilters = ["room", "dentist", "nurse"]
    .map((field) => {
      const id = appointment[field]?._id || appointment[field];
      return id ? { [field]: toObjectId(id) } : null;
    })
    .filter(Boolean);

  if (!resourceFilters.length) return null;

  const conflict = await findOne(COLLECTIONS.appointments, {
    _id: { $ne: toObjectId(appointment._id) },
    status: "in_treatment",
    $or: resourceFilters
  });
  if (!conflict) return null;
  await populate(conflict, appointmentPopulate);
  return attachGuestPatient(conflict);
}

export function populateAppointment(appointment) {
  return populate(appointment, appointmentPopulate).then(attachGuestPatient);
}

export function saveAppointment(appointment) {
  const update = { ...appointment };
  delete update._id;
  for (const field of appointmentRelationFields) {
    if (field === "patient" && update[field]?.isGuest) {
      delete update[field];
      continue;
    }
    if (update[field]?._id) update[field] = update[field]._id;
  }
  return getCollection(COLLECTIONS.appointments).findOneAndUpdate(
    { _id: toObjectId(appointment._id) },
    { $set: { ...update, updatedAt: new Date() } },
    { returnDocument: "after" }
  );
}

export function createPatientNotification(data) {
  return insertDocuments(COLLECTIONS.notifications, {
    isRead: false,
    ...data
  });
}

async function getRoleIds(roleName) {
  const roles = await findMany(COLLECTIONS.roles, { roleName }, { projection: "_id" });
  return roles.map((role) => role._id);
}

export async function findActiveReceptionists() {
  const roleIds = await getRoleIds("receptionist");
  return findMany(
    COLLECTIONS.users,
    { status: "active", roleRef: { $in: roleIds } },
    { projection: "_id fullName", limit: 100 }
  );
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
  const update = compact({
    appointment: invoice.appointment?._id || invoice.appointment,
    patient: invoice.patient?._id || invoice.patient,
    items: invoice.items,
    subtotal: invoice.subtotal,
    discountPercent: invoice.discountPercent,
    discountAmount: invoice.discountAmount,
    total: invoice.total,
    paidAmount: invoice.paidAmount,
    paymentPlan: invoice.paymentPlan,
    installmentMonths: invoice.installmentMonths,
    installmentAmount: invoice.installmentAmount,
    status: invoice.status,
    invoiceDate: invoice.invoiceDate,
    paidAt: invoice.paidAt
  });
  return updateById(COLLECTIONS.invoices, invoice._id, update);
}

export function createPayment(data) {
  return insertDocuments(COLLECTIONS.payments, {
    paymentMethod: "cash",
    paymentDate: new Date(),
    ...data
  });
}

export function updateAppointmentRoomStatus(roomId, status) {
  if (!roomId) return null;
  return updateById(COLLECTIONS.clinicRooms, roomId, { status });
}

export function findActivePaymentServices() {
  return findMany(COLLECTIONS.dentalServices, {});
}

export function deleteAppointment(appointmentId) {
  return removeById(COLLECTIONS.appointments, appointmentId);
}
