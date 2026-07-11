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
  return patientRepository.findPatientInvoices(patientId);
}

export async function getInvoiceById(invoiceId, patientId) {
  const invoice = await patientRepository.findPatientInvoiceById(invoiceId, patientId);
  if (!invoice) throw createNotFound("Không tìm thấy hóa đơn.");
  return invoice;
}

export function getTreatmentRecords(patientId) {
  return patientRepository.findPatientTreatmentRecords(patientId);
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
