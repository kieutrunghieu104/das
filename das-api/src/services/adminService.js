import { getInheritanceChain, getRoleHierarchyList, ROLE_HIERARCHY } from "../config/roleHierarchy.js";
import * as adminRepository from "../repository/adminRepository.js";
import { hashPassword } from "../utils/password.js";
import {
  createAdminUserSchema,
  createClinicRoomSchema,
  createDentalServiceSchema,
  createStaffScheduleSchema,
  createWorkingHourSchema,
  resetAdminUserPasswordSchema,
  updateAdminUserSchema,
  updateClinicRoomSchema,
  updateDentalServiceSchema,
  updateReviewVisibilitySchema,
  updateStaffScheduleSchema,
  updateWorkingHourSchema
} from "../validations/adminValidation.js";

const STAFF_SCHEDULE_ROLES = ["dentist", "nurse", "receptionist"];
const BLOCKING_SCHEDULE_STATUSES = ["scheduled", "completed"];
const CLINIC_WORKING_SESSIONS = [
  { start: "08:00", end: "11:30" },
  { start: "14:00", end: "17:30" }
];

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

function validateTimeWindow(startTime, endTime) {
  if (startTime >= endTime) {
    throwHttpError("Giờ bắt đầu phải trước giờ kết thúc.", 400);
  }
}

function validateClinicSessionWindow(startTime, endTime) {
  const isValidSession = CLINIC_WORKING_SESSIONS.some((session) => startTime >= session.start && endTime <= session.end);
  if (!isValidSession) {
    throwHttpError("Thời gian phải nằm trong ca sáng 08:00 - 11:30 hoặc ca chiều 14:00 - 17:30.", 400);
  }
}

function validateWorkday(_date) {}

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

function buildStaffScheduleOverlapQuery({ workDate, startTime, endTime, excludeScheduleId }) {
  const query = {
    workDate,
    status: { $in: BLOCKING_SCHEDULE_STATUSES },
    startTime: { $lt: endTime },
    endTime: { $gt: startTime }
  };

  if (excludeScheduleId) {
    query._id = { $ne: excludeScheduleId };
  }

  return query;
}

function isBlockingRoomSchedule(nextRole, existingRole) {
  if (nextRole === "dentist") return existingRole !== "nurse";
  if (nextRole === "nurse") return existingRole !== "dentist";
  return true;
}

function buildRoomScheduleConflictMessage(roomName, conflict) {
  const staffName = conflict.user?.fullName || "nhân sự khác";
  const role = formatRoleName(conflict.user?.role);
  return `${roomName} đã có ${role} ${staffName} làm ${conflict.startTime} - ${conflict.endTime}.`;
}

async function validateStaffScheduleAssignment({ userId, roomId, workDate, startTime, endTime, status, excludeScheduleId }) {
  const user = await adminRepository.findScheduleAssignmentUser(userId);

  if (!user) {
    throwHttpError("Không tìm thấy tài khoản nhân sự.", 404);
  }

  if (!STAFF_SCHEDULE_ROLES.includes(user.role)) {
    throwHttpError("Chỉ bác sĩ, y tá hoặc lễ tân mới được xếp lịch làm việc.", 400);
  }

  if (user.status !== "active") {
    throwHttpError("Không thể xếp lịch cho tài khoản đang ngưng hoạt động hoặc bị khóa.", 409);
  }

  if (!BLOCKING_SCHEDULE_STATUSES.includes(status)) {
    return;
  }

  const overlapQuery = buildStaffScheduleOverlapQuery({ workDate, startTime, endTime, excludeScheduleId });
  const userConflict = await adminRepository.findStaffScheduleConflict({
    ...overlapQuery,
    user: userId
  });

  if (userConflict) {
    const roomName = userConflict.room?.name ? ` tại ${userConflict.room.name}` : "";
    throwHttpError(`Nhân sự này đã có lịch ${userConflict.startTime} - ${userConflict.endTime}${roomName}.`, 409);
  }

  if (!roomId) {
    return;
  }

  const room = await adminRepository.findRoomForSchedule(roomId);
  if (!room) {
    throwHttpError("Không tìm thấy phòng khám.", 404);
  }
  const roomConflicts = await adminRepository.findRoomScheduleConflicts({
    ...overlapQuery,
    room: roomId
  });

  const conflict = roomConflicts.find((schedule) => isBlockingRoomSchedule(user.role, schedule.user?.role));
  if (conflict) {
    throwHttpError(buildRoomScheduleConflictMessage(room.name, conflict), 409);
  }
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
      status: "active"
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
  const [stats, users, services, rooms, roleHierarchy, workingHours, timeSlots, reviews] = await Promise.all([
    buildAdminStats(),
    adminRepository.findDashboardUsers(),
    adminRepository.findDashboardServices(),
    adminRepository.findDashboardRooms(),
    Promise.resolve(getRoleHierarchyList()),
    adminRepository.findWorkingHours(true),
    adminRepository.findTimeSlots(true),
    adminRepository.findReviews()
  ]);

  return { stats, users, services, rooms, roleHierarchy, workingHours, timeSlots, reviews };
}

export function getUsers(query) {
  const filter = {};
  if (query.role) filter.role = query.role;
  if (query.q) {
    const text = String(query.q).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.fullName = new RegExp(text, "i");
  }
  return adminRepository.findUsers(filter);
}

export async function getWorkingHours() {
  const [workingHours, timeSlots] = await Promise.all([
    adminRepository.findWorkingHours(),
    adminRepository.findTimeSlots()
  ]);
  return { workingHours, timeSlots };
}

export async function createWorkingHour(body) {
  const data = createWorkingHourSchema.parse(body);
  validateTimeWindow(data.startTime, data.endTime);
  validateClinicSessionWindow(data.startTime, data.endTime);
  return adminRepository.createWorkingHour(data);
}

export async function updateWorkingHour(workingHourId, body) {
  const data = updateWorkingHourSchema.parse(body);
  const existing = await adminRepository.findWorkingHourById(workingHourId);

  if (!existing) {
    throwHttpError("Không tìm thấy giờ làm việc.", 404);
  }

  const nextStartTime = data.startTime || existing.startTime;
  const nextEndTime = data.endTime || existing.endTime;
  validateTimeWindow(nextStartTime, nextEndTime);
  validateClinicSessionWindow(nextStartTime, nextEndTime);

  return adminRepository.updateWorkingHour(workingHourId, data);
}

export function getStaffSchedules(query) {
  const filter = {};
  if (query.date) {
    filter.workDate = new Date(`${query.date}T00:00:00`);
  }
  if (query.userId) filter.user = query.userId;

  const limit = Math.min(Number(query.limit) || 80, 300);
  return adminRepository.findStaffSchedules(filter, limit);
}

export async function createStaffSchedule(body) {
  const data = createStaffScheduleSchema.parse(body);
  validateTimeWindow(data.startTime, data.endTime);
  validateClinicSessionWindow(data.startTime, data.endTime);

  const workDate = new Date(`${data.workDate}T00:00:00`);
  validateWorkday(workDate);

  await validateStaffScheduleAssignment({
    userId: data.userId,
    roomId: data.roomId,
    workDate,
    startTime: data.startTime,
    endTime: data.endTime,
    status: data.status
  });

  const schedule = await adminRepository.createStaffSchedule({
    user: data.userId,
    timeSlot: data.timeSlotId,
    room: data.roomId,
    workDate,
    startTime: data.startTime,
    endTime: data.endTime,
    status: data.status
  });
  await adminRepository.populateStaffSchedule(schedule);
  return schedule;
}

export async function updateStaffSchedule(scheduleId, body) {
  const data = updateStaffScheduleSchema.parse(body);
  const existing = await adminRepository.findStaffScheduleById(scheduleId);

  if (!existing) {
    throwHttpError("Không tìm thấy lịch nhân sự.", 404);
  }

  const hasRoomUpdate = Object.prototype.hasOwnProperty.call(data, "roomId");
  const nextRoomId = hasRoomUpdate ? data.roomId : existing.room;
  const nextStartTime = data.startTime || existing.startTime;
  const nextEndTime = data.endTime || existing.endTime;
  const nextStatus = data.status || existing.status;

  validateTimeWindow(nextStartTime, nextEndTime);
  validateClinicSessionWindow(nextStartTime, nextEndTime);
  await validateStaffScheduleAssignment({
    userId: existing.user,
    roomId: nextRoomId,
    workDate: existing.workDate,
    startTime: nextStartTime,
    endTime: nextEndTime,
    status: nextStatus,
    excludeScheduleId: existing._id
  });

  const update = {};
  if (hasRoomUpdate) update.room = data.roomId;
  if (data.startTime) update.startTime = data.startTime;
  if (data.endTime) update.endTime = data.endTime;
  if (data.status) update.status = data.status;

  return adminRepository.updateStaffSchedule(scheduleId, update);
}

export async function exportReports() {
  const [appointments, invoices, reviews, noShowCount] = await Promise.all([
    adminRepository.countAppointments(),
    adminRepository.aggregateInvoicesByStatus(),
    adminRepository.aggregateReviewStats(),
    adminRepository.countNoShowAppointments()
  ]);

  return {
    generatedAt: new Date(),
    appointments,
    invoiceSummary: invoices,
    reviewSummary: reviews[0] || { average: 0, count: 0 },
    noShowCount
  };
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
    ...data,
    email: buildLoginEmail(data),
    roleRef: role._id,
    passwordHash: await hashPassword(data.password)
  });
  await createRoleProfile(user, data);

  const object = { ...user };
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

  const user = await adminRepository.updateUser(userId, data);

  if (!user) {
    throwHttpError("Không tìm thấy tài khoản.", 404);
  }

  return user;
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


