import { toObjectId } from "../config/mongodb.js";
import { COLLECTIONS } from "../models/index.js";
import {
  findMany,
  findOne,
  populate,
  updateOneAndReturn
} from "./mongoRepository.js";
import { startOfLocalDay, toDateInputValue } from "../utils/time.js";

const appointmentPopulate = [
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

const treatmentRecordPopulate = [
  {
    path: "appointment",
    populate: [
      { path: "service", select: "name" },
      { path: "room", select: "name" }
    ]
  },
  { path: "dentist", select: "fullName" },
  { path: "nurse", select: "fullName" }
];

const invoiceAppointmentPopulate = {
  path: "appointment",
  populate: [
    { path: "service", select: "name" },
    { path: "dentist", select: "fullName" }
  ]
};

async function attachPaymentsToInvoices(invoices) {
  const list = Array.isArray(invoices) ? invoices : [invoices].filter(Boolean);
  if (!list.length) return invoices;

  const payments = await findMany(
    COLLECTIONS.payments,
    { invoice: { $in: list.map((invoice) => invoice._id) } },
    { sort: { paymentDate: 1, createdAt: 1 }, limit: 500 }
  );
  const paymentMap = new Map();
  payments.forEach((payment) => {
    const key = payment.invoice?.toString();
    if (!paymentMap.has(key)) paymentMap.set(key, []);
    paymentMap.get(key).push(payment);
  });
  list.forEach((invoice) => {
    invoice.payments = paymentMap.get(invoice._id.toString()) || [];
  });
  return invoices;
}

export async function findPatientAppointments(patientId) {
  const todayStart = startOfLocalDay(toDateInputValue(new Date()));
  const appointments = await findMany(
    COLLECTIONS.appointments,
    {
      patient: toObjectId(patientId),
      status: { $nin: ["completed", "rejected", "cancelled", "no_show"] },
      startAt: { $gte: todayStart }
    },
    { sort: { startAt: 1 }, limit: 120 }
  );
  await populate(appointments, appointmentPopulate);
  return appointments;
}

export async function findPatientAppointmentHistory(patientId) {
  const todayStart = startOfLocalDay(toDateInputValue(new Date()));
  const appointments = await findMany(
    COLLECTIONS.appointments,
    {
      patient: toObjectId(patientId),
      $or: [
        { status: { $in: ["completed", "rejected", "cancelled", "no_show"] } },
        { startAt: { $lt: todayStart } }
      ]
    },
    { sort: { startAt: -1 }, limit: 120 }
  );
  await populate(appointments, appointmentPopulate);
  return appointments;
}

export async function findPatientTreatmentRecords(patientId) {
  const records = await findMany(
    COLLECTIONS.treatmentRecords,
    { patient: toObjectId(patientId) },
    { sort: { updatedAt: -1 }, limit: 80 }
  );
  await populate(records, treatmentRecordPopulate);
  return records;
}

export async function findPatientInvoices(patientId) {
  const invoices = await findMany(
    COLLECTIONS.invoices,
    { patient: toObjectId(patientId) },
    { sort: { createdAt: -1 }, limit: 80 }
  );
  await populate(invoices, invoiceAppointmentPopulate);
  await attachPaymentsToInvoices(invoices);
  return invoices;
}

export async function findPatientReviews(patientId) {
  const reviews = await findMany(
    COLLECTIONS.reviews,
    { patient: toObjectId(patientId) },
    { sort: { updatedAt: -1, createdAt: -1 }, limit: 5 }
  );
  await populate(reviews, [
    { path: "appointment", select: "startAt status" },
    { path: "dentist", select: "fullName" },
    { path: "service", select: "name" }
  ]);
  return reviews;
}

export async function findPatientInvoiceById(invoiceId, patientId) {
  const invoice = await findOne(COLLECTIONS.invoices, {
    _id: toObjectId(invoiceId),
    patient: toObjectId(patientId)
  });
  await populate(invoice, {
    path: "appointment",
    populate: [
      { path: "service", select: "name price" },
      { path: "dentist", select: "fullName" }
    ]
  });
  await attachPaymentsToInvoices(invoice);
  return invoice;
}

export function findCompletedPatientAppointment(appointmentId, patientId) {
  return findOne(COLLECTIONS.appointments, {
    _id: toObjectId(appointmentId),
    patient: toObjectId(patientId),
    status: "completed"
  });
}

export function upsertPatientReview(appointment, patientId, data) {
  return updateOneAndReturn(
    COLLECTIONS.reviews,
    { appointment: appointment._id },
    {
      patient: toObjectId(patientId),
      dentist: appointment.dentist,
      service: appointment.service,
      rating: data.rating,
      ratingDentist: data.rating,
      ratingService: data.rating,
      comment: data.comment
    },
    { upsert: true }
  );
}

export async function findUpcomingPatientAppointments(patientId) {
  const appointments = await findMany(
    COLLECTIONS.appointments,
    {
      patient: toObjectId(patientId),
      status: { $in: ["pending", "scheduled", "confirmed", "waitlisted"] },
      startAt: { $gte: new Date() }
    },
    { sort: { startAt: 1 }, limit: 5 }
  );
  await populate(appointments, { path: "service", select: "name" });
  return appointments;
}

export function findStoredNotifications(patientId) {
  return findMany(
    COLLECTIONS.notifications,
    { user: toObjectId(patientId) },
    { sort: { createdAt: -1 }, limit: 10 }
  );
}

export function markNotificationRead(notificationId, patientId) {
  return updateOneAndReturn(
    COLLECTIONS.notifications,
    { _id: toObjectId(notificationId), user: toObjectId(patientId) },
    { isRead: true }
  );
}
