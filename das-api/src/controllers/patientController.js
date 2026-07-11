import * as patientService from "../services/patientService.js";

export async function getDashboard(req, res) {
  res.json(await patientService.getDashboard(req.user._id));
}

export async function getInvoices(req, res) {
  const invoices = await patientService.getInvoices(req.user._id);
  res.json({ invoices });
}

export async function getInvoiceById(req, res) {
  const invoice = await patientService.getInvoiceById(req.params.id, req.user._id);
  res.json({ invoice });
}

export async function getTreatmentRecords(req, res) {
  const records = await patientService.getTreatmentRecords(req.user._id);
  res.json({ records });
}

export async function submitReview(req, res) {
  const review = await patientService.submitReview(req.user._id, req.body);
  res.status(201).json({ review });
}

export async function getNotifications(req, res) {
  res.json({ notifications: await patientService.buildPatientNotifications(req.user._id) });
}

export async function markNotificationRead(req, res) {
  const notification = await patientService.markNotificationRead(req.params.id, req.user._id);
  res.json({ notification });
}
