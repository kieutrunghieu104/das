import { getCollection, toObjectId } from "../config/mongodb.js";
import { COLLECTIONS } from "../models/index.js";
import {
  findMany,
  findOne,
  insertDocuments,
  populate
} from "./mongoRepository.js";

const publicDentistProjection = {
  fullName: 1,
  email: 1,
  phone: 1,
  roleRef: 1,
  status: 1,
  createdAt: 1
};

async function getRoleIds(roleName) {
  const roles = await findMany(COLLECTIONS.roles, { roleName }, { projection: "_id" });
  return roles.map((role) => role._id);
}

function roleUserFilter(roleIds) {
  return roleIds.length ? { roleRef: { $in: roleIds } } : { roleRef: null };
}

async function findActiveUsersByRole(roleName, options = {}) {
  const roleIds = await getRoleIds(roleName);
  const cursor = getCollection(COLLECTIONS.users)
    .find({
      status: "active",
      ...roleUserFilter(roleIds)
    })
    .project(options.projection || {})
    .sort(options.sort || {});
  if (options.limit) cursor.limit(options.limit);
  return cursor.toArray();
}

export function findActiveServices() {
  return findMany(COLLECTIONS.dentalServices, {}, { sort: { name: 1 } });
}

export function findActiveAppointmentSlots() {
  return findMany(COLLECTIONS.appointmentSlots, { isActive: { $ne: false } }, { sort: { order: 1, startTime: 1 } });
}

export async function findClinicInformation() {
  const [settings, receptionist] = await Promise.all([
    findMany(COLLECTIONS.clinicSettings, { key: "public" }, { limit: 1 }),
    findActiveUsersByRole("receptionist", {
      projection: { fullName: 1, phone: 1 },
      sort: { phone: 1 },
      limit: 1
    })
  ]);

  return {
    ...(settings[0] || {}),
    receptionist: receptionist[0] || null,
    receptionistPhone: receptionist[0]?.phone || ""
  };
}

function normalizeDentist(user, profile) {
  return {
    _id: user._id,
    profileId: profile?._id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    avatarUrl: profile?.avatarUrl || "",
    yearsOfExperience: Number(profile?.experienceYears || 0),
    qualification: profile?.qualification || "Bác sĩ Răng Hàm Mặt",
    address: profile?.address || "",
    bio: profile?.description || "",
    description: profile?.description || "",
    createdAt: user.createdAt
  };
}

async function attachDentistProfiles(users) {
  if (!users.length) return [];
  const profiles = await findMany(COLLECTIONS.dentists, {
    user: { $in: users.map((user) => user._id) }
  });
  const profileMap = new Map(profiles.map((profile) => [profile.user.toString(), profile]));
  return users.map((user) => normalizeDentist(user, profileMap.get(user._id.toString())));
}

export async function findActiveDentists() {
  const profiles = await findMany(
    COLLECTIONS.dentists,
    {},
    { sort: { createdAt: -1 } }
  );
  await populate(profiles, {
    path: "user",
    select: "fullName email phone status createdAt"
  });
  const dentists = profiles
    .filter((profile) => profile.user?.status === "active")
    .map((profile) => normalizeDentist(profile.user, profile));
  if (dentists.length) return dentists;

  const users = await findActiveUsersByRole("dentist", {
    projection: publicDentistProjection,
    sort: { fullName: 1 }
  });
  return attachDentistProfiles(users);
}

export async function findActiveDentistById(id) {
  const profileByUser = await findOne(COLLECTIONS.dentists, {
    user: toObjectId(id)
  });
  const profile = profileByUser || await findOne(COLLECTIONS.dentists, {
    _id: toObjectId(id)
  });
  if (profile) {
    await populate(profile, {
      path: "user",
      select: "fullName email phone status createdAt"
    });
    if (profile.user?.status === "active") return normalizeDentist(profile.user, profile);
  }

  const roleIds = await getRoleIds("dentist");
  const user = await getCollection(COLLECTIONS.users).findOne(
    {
      _id: toObjectId(id),
      status: "active",
      ...roleUserFilter(roleIds)
    },
    { projection: publicDentistProjection }
  );
  if (!user) return null;
  const [dentist] = await attachDentistProfiles([user]);
  return dentist;
}

export async function findActiveRooms() {
  const rooms = await findMany(COLLECTIONS.clinicRooms, {}, { sort: { name: 1 } });
  await populate(rooms, {
    path: "assignedDentist",
    select: "fullName phone"
  });
  await populate(rooms, {
    path: "assignedNurse",
    select: "fullName phone"
  });
  return rooms;
}

export async function findPublicReviews(limit = 8) {
  const reviews = await findMany(
    COLLECTIONS.reviews,
    { comment: { $exists: true, $ne: "" }, isHidden: { $ne: true } },
    { sort: { createdAt: -1 }, limit }
  );
  await populate(reviews, [
    { path: "patient", select: "fullName" },
    { path: "service", select: "name" },
    { path: "dentist", select: "fullName" }
  ]);
  return reviews;
}

export async function findReviewsByDentist(dentistId, limit = 10) {
  const reviews = await findMany(
    COLLECTIONS.reviews,
    { dentist: toObjectId(dentistId), isHidden: { $ne: true } },
    { sort: { createdAt: -1 }, limit }
  );
  await populate(reviews, { path: "patient", select: "fullName" });
  return reviews;
}

export async function getPublicBootstrapData() {
  const [services, dentists, rooms, reviews, clinic, slots] = await Promise.all([
    findActiveServices(),
    findActiveDentists(),
    findActiveRooms(),
    findPublicReviews(8),
    findClinicInformation(),
    findActiveAppointmentSlots()
  ]);
  return { services, dentists, rooms, reviews, clinic, slots };
}

export function createConsultationRequest(data) {
  return insertDocuments(COLLECTIONS.consultationRequests, data);
}
