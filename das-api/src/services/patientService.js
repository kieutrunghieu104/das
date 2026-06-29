import * as patientRepository from "../repository/patientRepository.js";
import { patientReviewSchema } from "../validations/patientValidation.js";

function createNotFound(message) {
  const err = new Error(message);
  err.statusCode = 404;
  return err;
}

export async function getDashboard(patientId) {
  const [appointments, appointmentHistory, records, invoices, notifications, reviews] = await Promise.all([
    patientRepository.findPatientAppointments(patientId),
    patientRepository.findPatientAppointmentHistory(patientId),
    patientRepository.findPatientTreatmentRecords(patientId),
    patientRepository.findPatientInvoices(patientId),
    buildPatientNotifications(patientId),
    patientRepository.findPatientReviews(patientId)
  ]);

  return { appointments, appointmentHistory, records, invoices, notifications, reviews };
}

export function getInvoices(patientId) {
  return patientRepository.findPatientInvoices(patientId, false);
}

export async function getInvoiceById(invoiceId, patientId) {
  const invoice = await patientRepository.findPatientInvoiceById(invoiceId, patientId);
  if (!invoice) throw createNotFound("Không tìm thấy hóa đơn.");
  return invoice;
}

export async function payInvoice(invoiceId, patientId) {
  const invoice = await patientRepository.findPatientInvoiceForPayment(invoiceId, patientId);
  if (!invoice) throw createNotFound("Không tìm thấy hóa đơn.");

  invoice.status = "paid";
  invoice.paidAt = new Date();
  invoice.paidAmount = Number(invoice.total || invoice.totalAmount || 0);
  const paidInvoice = await patientRepository.saveInvoice(invoice);

  if (invoice.appointment) {
    await patientRepository.updateAppointmentPaymentStatus(invoice.appointment, patientId, "paid");
  }

  await patientRepository.createPayment({
    invoice: invoice._id,
    amount: invoice.paidAmount,
    paymentStatus: "paid",
    paymentMethod: "bank_transfer"
  });

  return paidInvoice;
}

export function getTreatmentRecords(patientId) {
  return patientRepository.findPatientTreatmentRecords(patientId, false);
}

export async function submitReview(patientId, body) {
  const data = patientReviewSchema.parse(body);
  const appointment = await patientRepository.findCompletedPatientAppointment(data.appointmentId, patientId);

  if (!appointment) {
    throw createNotFound("Không tìm thấy lịch hẹn đã hoàn tất.");
  }

  return patientRepository.upsertPatientReview(appointment, patientId, data);
}

export async function buildPatientNotifications(patientId) {
  const [appointments, storedNotifications] = await Promise.all([
    patientRepository.findUpcomingPatientAppointments(patientId),
    patientRepository.findStoredNotifications(patientId)
  ]);

  return [
    ...storedNotifications.map((item) => ({
      id: item._id,
      type: "notification",
      title: item.title,
      message: `${item.title}: ${item.message}`,
      isRead: item.isRead,
      createdAt: item.createdAt
    })),
    ...appointments.map((item) => ({
      type: "appointment",
      message: `Lịch ${item.service?.name || "khám"} lúc ${item.startAt.toLocaleString()}`
    }))
  ];
}

export async function markNotificationRead(notificationId, patientId) {
  const notification = await patientRepository.markNotificationRead(notificationId, patientId);
  if (!notification) throw createNotFound("Không tìm thấy thông báo.");
  return notification;
}
