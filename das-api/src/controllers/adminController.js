import * as adminService from "../services/adminService.js";

export async function getStats(_req, res) {
  res.json(await adminService.buildAdminStats());
}

export async function getDashboard(_req, res) {
  res.json(await adminService.getDashboard());
}

export async function getUsers(req, res) {
  const users = await adminService.getUsers(req.query);
  res.json({ users });
}

export async function getWorkingHours(_req, res) {
  res.json(await adminService.getWorkingHours());
}

export async function createWorkingHour(req, res) {
  const workingHour = await adminService.createWorkingHour(req.body);
  res.status(201).json({ workingHour });
}

export async function updateWorkingHour(req, res) {
  const workingHour = await adminService.updateWorkingHour(req.params.id, req.body);
  res.json({ workingHour });
}

export async function getStaffSchedules(req, res) {
  const schedules = await adminService.getStaffSchedules(req.query);
  res.json({ schedules });
}

export async function createStaffSchedule(req, res) {
  const schedule = await adminService.createStaffSchedule(req.body);
  res.status(201).json({ schedule });
}

export async function updateStaffSchedule(req, res) {
  const schedule = await adminService.updateStaffSchedule(req.params.id, req.body);
  res.json({ schedule });
}

export async function exportReports(_req, res) {
  res.json(await adminService.exportReports());
}

export async function getRevenueReport(req, res) {
  res.json(await adminService.getRevenueReport(req.query));
}

export async function getPatientStatistics(req, res) {
  res.json(await adminService.getPatientStatistics(req.query));
}

export async function createUser(req, res) {
  const user = await adminService.createUser(req.body);
  res.status(201).json({ user });
}

export async function resetUserPassword(req, res) {
  res.json(await adminService.resetUserPassword(req.params.id, req.body));
}

export async function updateUser(req, res) {
  const user = await adminService.updateUser(req.params.id, req.body);
  res.json({ user });
}

export async function createDentalService(req, res) {
  const service = await adminService.createDentalService(req.body);
  res.status(201).json({ service });
}

export async function updateDentalService(req, res) {
  const service = await adminService.updateDentalService(req.params.id, req.body);
  res.json({ service });
}

export async function deactivateDentalService(req, res) {
  const service = await adminService.deactivateDentalService(req.params.id);
  res.json({ service });
}

export async function createClinicRoom(req, res) {
  const room = await adminService.createClinicRoom(req.body);
  res.status(201).json({ room });
}

export async function updateClinicRoom(req, res) {
  const room = await adminService.updateClinicRoom(req.params.id, req.body);
  res.json({ room });
}

export async function deleteClinicRoom(req, res) {
  const room = await adminService.deleteClinicRoom(req.params.id);
  res.json({ room });
}

export async function updateReviewVisibility(req, res) {
  const review = await adminService.updateReviewVisibility(req.params.id, req.body);
  res.json({ review });
}
