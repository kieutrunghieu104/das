import * as appointmentService from "../services/appointmentService.js";

export async function getAppointments(req, res) {
  const appointments = await appointmentService.getAppointments(req.user, req.query);
  res.json({ appointments });
}

export async function getAppointmentById(req, res) {
  const appointment = await appointmentService.getAppointmentById(req.params.id, req.user);
  res.json({ appointment });
}

export async function createAppointment(req, res) {
  const appointment = await appointmentService.createAppointment(req.user, req.body);
  res.status(201).json({ appointment });
}

export async function rescheduleAppointment(req, res) {
  const appointment = await appointmentService.rescheduleAppointment(req.params.id, req.user, req.body);
  res.json({ appointment });
}

export async function scheduleByReception(req, res) {
  const appointment = await appointmentService.scheduleByReception(req.params.id, req.user, req.body);
  res.json({ appointment });
}

export async function cancelAppointment(req, res) {
  const appointment = await appointmentService.cancelAppointment(req.params.id, req.user, req.body);
  res.json({ appointment });
}

export async function updateAppointmentStatus(req, res) {
  const appointment = await appointmentService.updateAppointmentStatus(req.params.id, req.user, req.body);
  res.json({ appointment });
}

export async function recordConfirmationCall(req, res) {
  const appointment = await appointmentService.recordConfirmationCall(req.params.id, req.user, req.body);
  res.json({ appointment });
}

export async function checkInAppointment(req, res) {
  res.json(await appointmentService.checkInAppointment(req.params.id, req.user, req.body));
}

export async function markNoShow(req, res) {
  const appointment = await appointmentService.markNoShow(req.params.id, req.user, req.body);
  res.json({ appointment });
}

export async function createInvoiceForAppointment(req, res) {
  const invoice = await appointmentService.createInvoiceForAppointment(req.params.id, req.body);
  res.status(201).json({ invoice });
}

export async function processAppointmentPayment(req, res) {
  res.json(await appointmentService.processAppointmentPayment(req.params.id, req.body));
}

export async function getAppointmentInvoice(req, res) {
  const invoice = await appointmentService.getAppointmentInvoice(req.params.id, req.user);
  res.json({ invoice });
}

export async function deleteEmptyInvoiceAppointment(req, res) {
  const appointment = await appointmentService.deleteEmptyInvoiceAppointment(req.params.id, req.user);
  res.json({ appointment });
}

export async function getServicesForPayment(_req, res) {
  const services = await appointmentService.getServicesForPayment();
  res.json({ services });
}
