import * as authService from "../services/authService.js";

export async function register(req, res) {
  const result = await authService.registerPatient(req.validatedBody);
  res.status(201).json(result);
}

export async function login(req, res) {
  res.json(await authService.login(req.validatedBody));
}

export async function me(req, res) {
  res.json(await authService.getCurrentUser(req.user));
}

export async function updateProfile(req, res) {
  res.json(await authService.updateProfile(req.user, req.validatedBody));
}

export async function notifications(req, res) {
  res.json(await authService.getNotifications(req.user));
}

export async function markAllNotificationsRead(req, res) {
  res.json(await authService.markAllNotificationsRead(req.user));
}

export async function markNotificationRead(req, res) {
  res.json(await authService.markNotificationRead(req.user, req.params.id));
}

export async function removeNotification(req, res) {
  res.json(await authService.deleteNotification(req.user, req.params.id));
}

export async function removeAllNotifications(req, res) {
  res.json(await authService.deleteAllNotifications(req.user));
}

export async function forgotPassword(req, res) {
  res.json(await authService.requestPasswordReset(req.validatedBody));
}

export async function resetPassword(req, res) {
  res.json(await authService.resetPassword(req.validatedBody));
}

export async function changePassword(req, res) {
  res.json(await authService.changePassword(req.user, req.validatedBody));
}

export function logout(_req, res) {
  res.json(authService.logout());
}
