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
