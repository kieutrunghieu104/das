import { getCollection, toObjectId } from "../config/mongodb.js";
import { COLLECTIONS } from "../models/index.js";
import {
  findById,
  findMany,
  findOne,
  insertDocuments,
  populate,
  updateById,
  updateOneAndReturn
} from "./mongoRepository.js";

async function attachRole(user) {
  await populate(user, { path: "roleRef", select: "roleName" });
  if (user?.roleRef?.roleName) user.role = user.roleRef.roleName;
  return user;
}

export async function findUserByPhone(phone, projection) {
  return attachRole(await findOne(COLLECTIONS.users, { phone }, projection));
}

export async function findUserByEmail(email, projection) {
  return attachRole(await findOne(COLLECTIONS.users, { email }, projection));
}

export async function findActiveUserById(id) {
  return attachRole(await findById(COLLECTIONS.users, id, "-passwordHash"));
}

export async function findUserByIdWithPassword(id) {
  return attachRole(await findById(COLLECTIONS.users, id));
}

export async function findUserByEmailWithResetFields(email) {
  return attachRole(await findOne(COLLECTIONS.users, { email }));
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

export function upsertRole(query, data) {
  return updateOneAndReturn(COLLECTIONS.roles, query, data, { upsert: true });
}

export function createUser(data) {
  return insertDocuments(COLLECTIONS.users, {
    status: "active",
    ...data
  });
}

export function createPatientProfile(data) {
  return insertDocuments(COLLECTIONS.patients, {
    gender: "unknown",
    ...data
  });
}

export function updatePatientProfileByUser(userId, data) {
  return updateOneAndReturn(
    COLLECTIONS.patients,
    { user: toObjectId(userId) },
    { ...data, user: toObjectId(userId) },
    { upsert: true }
  );
}

export function updateUserById(id, data) {
  return updateById(COLLECTIONS.users, id, data);
}

export function saveUser(user) {
  const update = { ...user };
  delete update._id;
  delete update.role;
  return updateById(COLLECTIONS.users, user._id, update);
}

export function findNotificationsByUser(userId, limit = 50) {
  return findMany(
    COLLECTIONS.notifications,
    { user: toObjectId(userId) },
    { sort: { createdAt: -1 }, limit }
  );
}

export function markAllNotificationsRead(userId) {
  return getCollection(COLLECTIONS.notifications).updateMany(
    { user: toObjectId(userId), isRead: false },
    { $set: { isRead: true, updatedAt: new Date() } }
  );
}

export function markNotificationRead(userId, notificationId) {
  return updateOneAndReturn(
    COLLECTIONS.notifications,
    { _id: toObjectId(notificationId), user: toObjectId(userId) },
    { isRead: true }
  );
}

export function deleteNotification(userId, notificationId) {
  return getCollection(COLLECTIONS.notifications).findOneAndDelete({
    _id: toObjectId(notificationId),
    user: toObjectId(userId)
  });
}

export function deleteAllNotifications(userId) {
  return getCollection(COLLECTIONS.notifications).deleteMany({ user: toObjectId(userId) });
}
