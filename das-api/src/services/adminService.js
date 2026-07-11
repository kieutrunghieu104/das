import { getInheritanceChain, ROLE_HIERARCHY } from "../config/roleHierarchy.js";
import * as adminRepository from "../repository/adminRepository.js";
import * as profileRepository from "../repository/profileRepository.js";
import { hashPassword } from "../utils/password.js";
import {
  createAdminUserSchema,
  createClinicRoomSchema,
  createDentalServiceSchema,
  resetAdminUserPasswordSchema,
  updateAdminUserSchema,
  updateClinicRoomSchema,
  updateDentalServiceSchema,
  updateReviewVisibilitySchema
} from "../validations/adminValidation.js";

function throwHttpError(message, statusCode = 400) {
  const err = new Error(message);
  err.statusCode = statusCode;
  throw err;
}

function generateTemporaryPassword() {
  return "nhakhoa2026";
}

function buildLoginEmail(data) {
  if (data.email) return data.email;
  return undefined;
}

function startOfMonth(value) {
  return new Date(value.getFullYear(), value.getMonth(), 1);
}

function parseDateRange(query) {
  const now = new Date();
  const startDate = query.startDate ? new Date(`${query.startDate}T00:00:00`) : startOfMonth(now);
  const endDate = query.endDate
    ? new Date(`${query.endDate}T23:59:59`)
    : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return { startDate, endDate };
}

function formatRoleName(role) {
  const labels = {
    dentist: "bác sĩ",
    nurse: "y tá",
    receptionist: "lễ tân",
    admin: "quản trị viên",
    patient: "bệnh nhân"
  };
  return labels[role] || "nhân sự";
}

async function createRoleProfile(user, data) {
  if (user.role === "patient") {
    await adminRepository.createPatientProfile({ user: user._id });
  } else if (user.role === "receptionist") {
    await adminRepository.createReceptionistProfile({ user: user._id });
  } else if (user.role === "dentist") {
    await adminRepository.createDentistProfile({
      user: user._id,
      qualification: "Bác sĩ Răng Hàm Mặt",
      experienceYears: data.yearsOfExperience || 0,
      description: data.bio,
      avatarUrl: data.avatarUrl || undefined
    });
  } else if (user.role === "nurse") {
    await adminRepository.createNurseProfile({ user: user._id, qualification: "Y tá đã đăng ký" });
  } else if (user.role === "admin") {
    await adminRepository.createAdminProfile({ user: user._id, position: "Quản trị hệ thống" });
  }
}

async function validateUserContactUniqueness(data, excludedUserId) {
  if (data.phone) {
    const duplicatePhone = excludedUserId
      ? await adminRepository.findDuplicatePhone(data.phone, excludedUserId)
      : await adminRepository.findUserByPhone(data.phone);
    if (duplicatePhone) {
      throwHttpError("Số điện thoại đã tồn tại.", 409);
    }
  }

  if (data.email) {
    const duplicateEmail = excludedUserId
      ? await adminRepository.findDuplicateEmail(data.email, excludedUserId)
      : await adminRepository.findUserByEmail(data.email);
    if (duplicateEmail) {
      throwHttpError("Email đã tồn tại.", 409);
    }
  }
}

export async function buildAdminStats() {
  const [
    appointmentStats,
    revenue,
    patientCount,
    newPatientCount,
    returningPatientCount,
    serviceUsage,
    noShowCount,
    reviewStats
  ] = await Promise.all([
    adminRepository.aggregateAppointmentStats(),
    adminRepository.aggregatePaidRevenue(),
    adminRepository.countPatients(),
    adminRepository.countNewPatients(startOfMonth(new Date())),
    adminRepository.aggregateReturningPatients(),
    adminRepository.aggregateServiceUsage({}, 8),
    adminRepository.countNoShowAppointments(),
    adminRepository.aggregateReviewStats()
  ]);

  return {
    appointmentStats,
    revenue: revenue[0]?.total || 0,
    patientCount,
    newPatientCount,
    returningPatientCount: returningPatientCount[0]?.total || 0,
    serviceUsage,
    noShowCount,
    review: reviewStats[0] || { average: 0, count: 0 }
  };
}

export async function getDashboard() {
  const [stats, users, services, rooms, reviews] = await Promise.all([
    buildAdminStats(),
    adminRepository.findDashboardUsers(),
    adminRepository.findDashboardServices(),
    adminRepository.findDashboardRooms(),
    adminRepository.findReviews()
  ]);

  return { stats, users: await profileRepository.attachProfilesToUsers(users), services, rooms, reviews };
}

export function getUsers(query) {
  const filter = {};
  if (query.role) filter.role = query.role;
  if (query.q) {
    const text = String(query.q).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.fullName = new RegExp(text, "i");
  }
  return adminRepository.findUsers(filter).then((users) => profileRepository.attachProfilesToUsers(users));
}

export async function getRevenueReport(query) {
  const { startDate, endDate } = parseDateRange(query);
  const invoiceMatch = { invoiceDate: { $gte: startDate, $lte: endDate } };

  const [summary, paidInvoices, partialInvoices, unpaidInvoices] = await Promise.all([
    adminRepository.aggregateInvoicesByStatus(invoiceMatch),
    adminRepository.findRevenueInvoices(invoiceMatch, "paid", { paidAt: -1 }),
    adminRepository.findRevenueInvoices(invoiceMatch, "partial", { invoiceDate: -1 }),
    adminRepository.findRevenueInvoices(invoiceMatch, "unpaid", { invoiceDate: -1 })
  ]);

  return { startDate, endDate, summary, paidInvoices, partialInvoices, unpaidInvoices };
}

export async function getPatientStatistics(query) {
  const { startDate, endDate } = parseDateRange(query);
  const appointmentMatch = { startAt: { $gte: startDate, $lte: endDate } };

  const [newPatients, returningPatients, appointmentCounts, serviceUsage] = await Promise.all([
    adminRepository.countNewPatients(startDate, endDate),
    adminRepository.aggregateReturningPatients(appointmentMatch),
    adminRepository.aggregateAppointmentsByStatus(appointmentMatch),
    adminRepository.aggregateServiceUsage(appointmentMatch)
  ]);

  return {
    startDate,
    endDate,
    newPatients,
    returningPatients: returningPatients[0]?.total || 0,
    appointmentCounts,
    serviceUsage
  };
}

export async function createUser(body) {
  const data = createAdminUserSchema.parse(body);
  await validateUserContactUniqueness(data);

  const role = await adminRepository.ensureRole({
    roleName: data.role,
    parentRoleName: ROLE_HIERARCHY[data.role]?.parent || null,
    isAbstract: false,
    inheritanceChain: getInheritanceChain(data.role),
    description: ROLE_HIERARCHY[data.role]?.description || `Vai trò ${formatRoleName(data.role)}`
  });

  const user = await adminRepository.createUser({
    fullName: data.fullName,
    email: buildLoginEmail(data),
    phone: data.phone,
    role: data.role,
    roleRef: role._id,
    passwordHash: await hashPassword(data.password)
  });
  await createRoleProfile(user, data);

  const object = await profileRepository.attachProfileToUser(user);
  delete object.passwordHash;
  return object;
}

export async function resetUserPassword(userId, body) {
  const data = resetAdminUserPasswordSchema.parse(body || {});
  const user = await adminRepository.findUserById(userId);

  if (!user) {
    throwHttpError("Không tìm thấy tài khoản.", 404);
  }

  const temporaryPassword = data.password || generateTemporaryPassword();
  const updatedUser = await adminRepository.saveUser({
    ...user,
    passwordHash: await hashPassword(temporaryPassword)
  });
  const object = { ...updatedUser };
  delete object.passwordHash;
  return { user: object, temporaryPassword };
}

export async function updateUser(userId, body) {
  const data = updateAdminUserSchema.parse(body);
  await validateUserContactUniqueness(data, userId);

  const existingUser = await adminRepository.findUserById(userId);

  if (!existingUser) {
    throwHttpError("Không tìm thấy tài khoản.", 404);
  }

  const userUpdate = profileRepository.pickUserFields(data);
  const user = Object.keys(userUpdate).length
    ? await adminRepository.updateUser(userId, userUpdate)
    : existingUser;

  await profileRepository.upsertProfileForUser(user, data);

  const object = await profileRepository.attachProfileToUser(user);
  delete object.passwordHash;
  return object;
}

export function createDentalService(body) {
  return adminRepository.createDentalService(createDentalServiceSchema.parse(body));
}

export async function updateDentalService(serviceId, body) {
  const service = await adminRepository.updateDentalService(serviceId, updateDentalServiceSchema.parse(body));
  if (!service) throwHttpError("Không tìm thấy dịch vụ.", 404);
  return service;
}

export async function deactivateDentalService(serviceId) {
  const service = await adminRepository.deleteDentalService(serviceId);
  if (!service) throwHttpError("Không tìm thấy dịch vụ.", 404);
  return service;
}

async function validateRoomAssignments(data, excludeRoomId) {
  if (data.assignedDentist) {
    const conflict = await adminRepository.findClinicRoomAssignmentConflict("assignedDentist", data.assignedDentist, excludeRoomId);
    if (conflict) throwHttpError("Bác sĩ này đã được gán vào phòng khám khác.", 409);
  }
  if (data.assignedNurse) {
    const conflict = await adminRepository.findClinicRoomAssignmentConflict("assignedNurse", data.assignedNurse, excludeRoomId);
    if (conflict) throwHttpError("Y tá này đã được gán vào phòng khám khác.", 409);
  }
}

export async function createClinicRoom(body) {
  const data = createClinicRoomSchema.parse(body);
  const duplicate = await adminRepository.findClinicRoomByName(data.name);
  if (duplicate) {
    throwHttpError("Tên phòng khám đã tồn tại.", 409);
  }

  await validateRoomAssignments(data);

  const room = await adminRepository.createClinicRoom(data);
  await adminRepository.populateClinicRoom(room);
  return room;
}

export async function updateClinicRoom(roomId, body) {
  const data = updateClinicRoomSchema.parse(body);
  await validateRoomAssignments(data, roomId);
  const room = await adminRepository.updateClinicRoom(roomId, data);
  if (!room) throwHttpError("Không tìm thấy phòng khám.", 404);
  return room;
}

export async function deleteClinicRoom(roomId) {
  const room = await adminRepository.deleteClinicRoom(roomId);
  if (!room) throwHttpError("Không tìm thấy phòng khám.", 404);
  return room;
}

export async function updateReviewVisibility(reviewId, body) {
  const data = updateReviewVisibilitySchema.parse(body);
  const review = await adminRepository.updateReview(reviewId, data);
  if (!review) throwHttpError("Không tìm thấy đánh giá.", 404);
  return review;
}


