import { getCollection, toObjectId } from "../config/mongodb.js";
import { COLLECTIONS } from "../models/index.js";
import {
  findById,
  findMany,
  findOne,
  insertDocuments,
  normalizeIdFields,
  populate,
  removeById,
  updateById,
  updateOneAndReturn
} from "./mongoRepository.js";

const roomDentistSelect = "fullName avatarUrl yearsOfExperience bio";
const roomNurseSelect = "fullName phone";
const staffSchedulePopulate = [
  { path: "user", select: "fullName role phone" },
  { path: "timeSlot", select: "slotName startTime endTime" },
  { path: "room", select: "name status" }
];

function aggregate(collectionName, pipeline) {
  return getCollection(collectionName).aggregate(pipeline).toArray();
}

export function aggregateAppointmentStats() {
  return aggregate(COLLECTIONS.appointments, [
    { $group: { _id: "$status", count: { $sum: 1 } } }
  ]);
}

export function aggregatePaidRevenue() {
  return aggregate(COLLECTIONS.invoices, [
    { $match: { status: "paid" } },
    { $group: { _id: null, total: { $sum: "$total" } } }
  ]);
}

export function countPatients() {
  return getCollection(COLLECTIONS.patients).countDocuments({});
}

export function countNewPatients(startDate, endDate) {
  const createdAt = { $gte: startDate };
  if (endDate) createdAt.$lte = endDate;
  return getCollection(COLLECTIONS.users).countDocuments({ role: "patient", createdAt });
}

export function aggregateReturningPatients(match = {}) {
  return aggregate(COLLECTIONS.appointments, [
    ...(Object.keys(match).length ? [{ $match: match }] : []),
    { $group: { _id: "$patient", count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
    { $count: "total" }
  ]);
}

export function aggregateServiceUsage(match = {}, limit = null) {
  const pipeline = [
    ...(Object.keys(match).length ? [{ $match: match }] : []),
    { $group: { _id: "$service", count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ];
  if (limit) pipeline.push({ $limit: limit });
  pipeline.push(
    {
      $lookup: {
        from: COLLECTIONS.dentalServices,
        localField: "_id",
        foreignField: "_id",
        as: "service"
      }
    },
    { $unwind: { path: "$service", preserveNullAndEmptyArrays: true } },
    { $project: { count: 1, serviceName: "$service.name" } }
  );
  return aggregate(COLLECTIONS.appointments, pipeline);
}

export function countNoShowAppointments() {
  return getCollection(COLLECTIONS.appointments).countDocuments({ status: "no_show" });
}

export function aggregateReviewStats() {
  return aggregate(COLLECTIONS.reviews, [
    { $group: { _id: null, average: { $avg: "$rating" }, count: { $sum: 1 } } }
  ]);
}

export function findDashboardUsers() {
  return findMany(COLLECTIONS.users, {}, {
    projection: "-passwordHash",
    sort: { role: 1, fullName: 1 },
    limit: 160
  });
}

export function findUsers(query = {}, limit = 200) {
  return findMany(COLLECTIONS.users, query, {
    projection: "-passwordHash",
    sort: { role: 1, fullName: 1 },
    limit
  });
}

export function findDashboardServices() {
  return findMany(COLLECTIONS.dentalServices, {}, { sort: { name: 1 } });
}

export async function findDashboardRooms() {
  const rooms = await findMany(COLLECTIONS.clinicRooms, {}, { sort: { name: 1 } });
  await populate(rooms, [
    { path: "assignedDentist", select: roomDentistSelect },
    { path: "assignedNurse", select: roomNurseSelect }
  ]);
  return rooms;
}

export function findWorkingHours() {
  return findMany(COLLECTIONS.clinicWorkingHours, { status: "active" }, {
    sort: { dayOfWeek: 1, startTime: 1 }
  });
}

export function findTimeSlots() {
  return findMany(COLLECTIONS.timeSlots, {}, { sort: { startTime: 1 } });
}

export async function findReviews() {
  const reviews = await findMany(COLLECTIONS.reviews, {}, {
    sort: { createdAt: -1 },
    limit: 80
  });
  await populate(reviews, [
    { path: "patient", select: "fullName phone" },
    { path: "dentist", select: "fullName" },
    { path: "service", select: "name" }
  ]);
  return reviews;
}

export function updateReview(reviewId, data) {
  return updateById(COLLECTIONS.reviews, reviewId, data);
}

export function createWorkingHour(data) {
  return insertDocuments(COLLECTIONS.clinicWorkingHours, {
    status: "active",
    ...data
  });
}

export function findWorkingHourById(workingHourId) {
  return findById(COLLECTIONS.clinicWorkingHours, workingHourId);
}

export function updateWorkingHour(workingHourId, data) {
  return updateById(COLLECTIONS.clinicWorkingHours, workingHourId, data);
}

export async function findStaffSchedules(query, limit) {
  const schedules = await findMany(
    COLLECTIONS.staffSchedules,
    normalizeIdFields(query, ["_id", "user", "timeSlot", "room"]),
    { sort: { workDate: 1, startTime: 1 }, limit }
  );
  await populate(schedules, staffSchedulePopulate);
  return schedules;
}

export function createStaffSchedule(data) {
  return insertDocuments(COLLECTIONS.staffSchedules, {
    status: "scheduled",
    ...data,
    user: toObjectId(data.user),
    timeSlot: toObjectId(data.timeSlot),
    room: data.room ? toObjectId(data.room) : undefined
  });
}

export function populateStaffSchedule(schedule) {
  return populate(schedule, staffSchedulePopulate);
}

export function findStaffScheduleById(scheduleId) {
  return findById(COLLECTIONS.staffSchedules, scheduleId);
}

export async function updateStaffSchedule(scheduleId, update) {
  const normalized = { ...update };
  if ("room" in normalized) normalized.room = normalized.room ? toObjectId(normalized.room) : null;
  const schedule = await updateById(COLLECTIONS.staffSchedules, scheduleId, normalized);
  await populate(schedule, staffSchedulePopulate);
  return schedule;
}

export function countAppointments(match = {}) {
  return getCollection(COLLECTIONS.appointments).countDocuments(match);
}

export function aggregateInvoicesByStatus(match = {}) {
  return aggregate(COLLECTIONS.invoices, [
    ...(Object.keys(match).length ? [{ $match: match }] : []),
    { $group: { _id: "$status", total: { $sum: "$total" }, count: { $sum: 1 } } }
  ]);
}

export function aggregateAppointmentsByStatus(match = {}) {
  return aggregate(COLLECTIONS.appointments, [
    ...(Object.keys(match).length ? [{ $match: match }] : []),
    { $group: { _id: "$status", count: { $sum: 1 } } }
  ]);
}

export async function findRevenueInvoices(match, status, sort) {
  const invoices = await findMany(
    COLLECTIONS.invoices,
    { ...match, status },
    { sort, limit: 80 }
  );
  await populate(invoices, { path: "appointment", select: "startAt" });
  return invoices;
}

export function ensureRole(data) {
  return updateOneAndReturn(
    COLLECTIONS.roles,
    { roleName: data.roleName },
    data,
    { upsert: true }
  );
}

export function createUser(data) {
  return insertDocuments(COLLECTIONS.users, {
    status: "active",
    gender: "unknown",
    yearsOfExperience: 0,
    ...data
  });
}

export function findUserByPhone(phone) {
  return findOne(COLLECTIONS.users, { phone });
}

export function findUserByEmail(email) {
  return findOne(COLLECTIONS.users, { email });
}

export function findDuplicatePhone(phone, excludedUserId) {
  return findOne(COLLECTIONS.users, {
    phone,
    _id: { $ne: toObjectId(excludedUserId) }
  });
}

export function findDuplicateEmail(email, excludedUserId) {
  return findOne(COLLECTIONS.users, {
    email,
    _id: { $ne: toObjectId(excludedUserId) }
  });
}

export function findUserById(userId) {
  return findById(COLLECTIONS.users, userId);
}

export async function updateUser(userId, data) {
  const user = await updateById(COLLECTIONS.users, userId, data);
  if (user) delete user.passwordHash;
  return user;
}

export function saveUser(user) {
  const update = { ...user };
  delete update._id;
  return updateById(COLLECTIONS.users, user._id, update);
}

export function createPatientProfile(data) {
  return insertDocuments(COLLECTIONS.patients, { gender: "unknown", ...data });
}

export function createReceptionistProfile(data) {
  return insertDocuments(COLLECTIONS.receptionists, { status: "active", ...data });
}

export function createDentistProfile(data) {
  return insertDocuments(COLLECTIONS.dentists, {
    experienceYears: 0,
    status: "active",
    ...data
  });
}

export function createNurseProfile(data) {
  return insertDocuments(COLLECTIONS.nurses, { status: "active", ...data });
}

export function createAdminProfile(data) {
  return insertDocuments(COLLECTIONS.adminProfiles, {
    permissionLevel: "super_admin",
    status: "active",
    ...data
  });
}

export function createDentalService(data) {
  return insertDocuments(COLLECTIONS.dentalServices, {
    transitionTime: 10,
    price: "0",
    ...data
  });
}

export function updateDentalService(serviceId, data) {
  return updateById(COLLECTIONS.dentalServices, serviceId, data);
}

export function deleteDentalService(serviceId) {
  return removeById(COLLECTIONS.dentalServices, serviceId);
}

export function findClinicRoomByName(name) {
  return findOne(COLLECTIONS.clinicRooms, { name });
}

export function findClinicRoomAssignmentConflict(field, staffId, excludeRoomId) {
  const query = { [field]: toObjectId(staffId) };
  if (excludeRoomId) query._id = { $ne: excludeRoomId };
  return findOne(COLLECTIONS.clinicRooms, query);
}

export function createClinicRoom(data) {
  return insertDocuments(COLLECTIONS.clinicRooms, {
    roomType: "Phòng điều trị nha khoa",
    equipment: [],
    status: "available",
    ...data,
    assignedDentist: data.assignedDentist ? toObjectId(data.assignedDentist) : undefined,
    assignedNurse: data.assignedNurse ? toObjectId(data.assignedNurse) : undefined
  });
}

export function populateClinicRoom(room) {
  return populate(room, [
    { path: "assignedDentist", select: roomDentistSelect },
    { path: "assignedNurse", select: roomNurseSelect }
  ]);
}

export async function updateClinicRoom(roomId, data) {
  const update = { ...data };
  if ("assignedDentist" in update) {
    update.assignedDentist = update.assignedDentist ? toObjectId(update.assignedDentist) : null;
  }
  if ("assignedNurse" in update) {
    update.assignedNurse = update.assignedNurse ? toObjectId(update.assignedNurse) : null;
  }
  const room = await updateById(COLLECTIONS.clinicRooms, roomId, update);
  await populate(room, [
    { path: "assignedDentist", select: roomDentistSelect },
    { path: "assignedNurse", select: roomNurseSelect }
  ]);
  return room;
}

export function deleteClinicRoom(roomId) {
  return removeById(COLLECTIONS.clinicRooms, roomId);
}

export function findScheduleAssignmentUser(userId) {
  return findById(COLLECTIONS.users, userId, "fullName role status");
}

export async function findStaffScheduleConflict(query) {
  const schedule = await findOne(
    COLLECTIONS.staffSchedules,
    normalizeIdFields(query, ["_id", "user", "room"])
  );
  await populate(schedule, { path: "room", select: "name" });
  return schedule;
}

export function findRoomForSchedule(roomId) {
  return findById(COLLECTIONS.clinicRooms, roomId, "name status isActive");
}

export async function findRoomScheduleConflicts(query) {
  const schedules = await findMany(
    COLLECTIONS.staffSchedules,
    normalizeIdFields(query, ["_id", "user", "room"])
  );
  await populate(schedules, { path: "user", select: "fullName role" });
  return schedules;
}
