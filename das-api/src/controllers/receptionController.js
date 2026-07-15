import * as receptionService from "../services/receptionService.js";

export async function getDashboard(req, res) {
  res.json(await receptionService.getDashboard(req.query));
}

export async function getPatients(req, res) {
  const patients = await receptionService.getPatients(req.query);
  res.json({ patients });
}

export async function resetPatientPassword(req, res) {
  res.json(await receptionService.resetPatientPassword(req.params.id, req.body));
}

export async function createPatient(req, res) {
  const result = await receptionService.createPatient(req.body);
  res.status(result.statusCode).json({ patient: result.patient });
}

export async function getConsultations(req, res) {
  const requests = await receptionService.getConsultations(req.query);
  res.json({ requests });
}

export async function updateConsultation(req, res) {
  const request = await receptionService.updateConsultation(req.params.id, req.body);
  res.json({ request });
}

export async function deleteConsultation(req, res) {
  const request = await receptionService.deleteConsultation(req.params.id);
  res.json({ request });
}

export async function updateAppointmentSlot(req, res) {
  const slot = await receptionService.updateAppointmentSlot(req.params.id, req.body);
  res.json({ slot });
}
