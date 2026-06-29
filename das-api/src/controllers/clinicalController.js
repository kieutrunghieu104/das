import * as clinicalService from "../services/clinicalService.js";

export async function getDashboard(req, res) {
  res.json(await clinicalService.getDashboard(req.user, req.query));
}

export async function getWorkSchedules(req, res) {
  const schedules = await clinicalService.getWorkSchedules(req.user, req.query);
  res.json({ schedules });
}

export async function getSchedule(req, res) {
  const appointments = await clinicalService.getSchedule(req.user, req.query);
  res.json({ appointments });
}

export async function getTreatmentRecords(req, res) {
  const records = await clinicalService.getTreatmentRecords(req.user);
  res.json({ records });
}

export async function getPatientHistory(req, res) {
  const records = await clinicalService.getPatientHistory(req.user, req.params.patientId);
  res.json({ records });
}

export async function getPatientInformation(req, res) {
  res.json(await clinicalService.getPatientInformation(req.user, req.params.patientId));
}

export async function upsertAppointmentTreatmentRecord(req, res) {
  const record = await clinicalService.upsertAppointmentTreatmentRecord(req.user, req.params.appointmentId, req.body);
  res.json({ record });
}

export async function updatePerformedServices(req, res) {
  const appointment = await clinicalService.updatePerformedServices(req.user, req.params.appointmentId, req.body);
  res.json({ appointment });
}

export async function updateClinicalRoomStatus(req, res) {
  const room = await clinicalService.updateClinicalRoomStatus(req.user, req.params.id, req.body);
  res.json({ room });
}
