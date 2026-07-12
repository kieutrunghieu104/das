import { toObjectId } from "../config/mongodb.js";
import { COLLECTIONS } from "../models/index.js";
import { findMany, findOne, populate, updateOneAndReturn } from "./mongoRepository.js";

const PROFILE_COLLECTION_BY_ROLE = Object.freeze({
  admin: COLLECTIONS.adminProfiles,
  dentist: COLLECTIONS.dentists,
  nurse: COLLECTIONS.nurses,
  patient: COLLECTIONS.patients,
  receptionist: COLLECTIONS.receptionists
});

function compact(data) {
  return Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined));
}

export function getProfileCollection(role) {
  return PROFILE_COLLECTION_BY_ROLE[role] || null;
}

export function roleNameFromUser(user) {
  if (!user) return "";
  if (user.roleRef?.roleName) return user.roleRef.roleName;
  return typeof user.role === "string" ? user.role : "";
}

export function normalizeUserRole(user) {
  if (!user) return user;
  const role = roleNameFromUser(user);
  if (role) user.role = role;
  return user;
}

export function pickUserFields(data = {}) {
  return compact({
    fullName: data.fullName,
    email: data.email || undefined,
    phone: data.phone,
    status: data.status
  });
}

export function pickProfileFields(role, data = {}) {
  if (role === "patient") {
    return compact({
      gender: data.gender,
      address: data.address,
      medicalNote: data.medicalNote,
      avatarUrl: data.avatarUrl || undefined,
      bio: data.bio
    });
  }

  if (role === "dentist") {
    return compact({
      qualification: data.qualification,
      experienceYears: data.experienceYears ?? data.yearsOfExperience,
      description: data.description ?? data.bio,
      address: data.address,
      avatarUrl: data.avatarUrl || undefined
    });
  }

  if (role === "nurse") {
    return compact({
      qualification: data.qualification,
      address: data.address,
      avatarUrl: data.avatarUrl || undefined,
      bio: data.bio
    });
  }

  if (role === "receptionist") {
    return compact({
      address: data.address,
      avatarUrl: data.avatarUrl || undefined,
      bio: data.bio
    });
  }

  if (role === "admin") {
    return compact({
      position: data.position,
      permissionLevel: data.permissionLevel,
      address: data.address,
      avatarUrl: data.avatarUrl || undefined,
      bio: data.bio
    });
  }

  return {};
}

export function mergeProfileFields(user, profile = null) {
  if (!user) return user;

  const merged = { ...user };
  normalizeUserRole(merged);
  if (profile) {
    merged.profile = profile;
  }

  if (merged.role === "patient") {
    merged.gender = profile?.gender || user.gender || "unknown";
    merged.address = profile?.address || "";
    merged.medicalNote = profile?.medicalNote || "";
    merged.avatarUrl = profile?.avatarUrl || "";
    merged.bio = profile?.bio || "";
  }

  if (merged.role === "dentist") {
    merged.qualification = profile?.qualification || "Bác sĩ Răng Hàm Mặt";
    merged.yearsOfExperience = Number(profile?.experienceYears ?? 0);
    merged.experienceYears = merged.yearsOfExperience;
    merged.bio = profile?.description || "";
    merged.description = profile?.description || "";
    merged.address = profile?.address || "";
    merged.avatarUrl = profile?.avatarUrl || "";
  }

  if (merged.role === "nurse") {
    merged.qualification = profile?.qualification || "";
    merged.address = profile?.address || "";
    merged.avatarUrl = profile?.avatarUrl || "";
    merged.bio = profile?.bio || "";
  }

  if (merged.role === "receptionist") {
    merged.address = profile?.address || "";
    merged.avatarUrl = profile?.avatarUrl || "";
    merged.bio = profile?.bio || "";
  }

  if (merged.role === "admin") {
    merged.position = profile?.position || "";
    merged.permissionLevel = profile?.permissionLevel || "";
    merged.address = profile?.address || "";
    merged.avatarUrl = profile?.avatarUrl || "";
    merged.bio = profile?.bio || "";
  }

  return merged;
}

export async function findProfileByUser(user) {
  const collectionName = getProfileCollection(user?.role);
  if (!collectionName || !user?._id) return null;
  return findOne(collectionName, { user: toObjectId(user._id) });
}

export async function attachProfileToUser(user) {
  if (!user) return user;
  await populate(user, { path: "roleRef", select: "roleName" });
  normalizeUserRole(user);
  const profile = await findProfileByUser(user);
  return mergeProfileFields(user, profile);
}

export async function attachProfilesToUsers(users = []) {
  if (!users.length) return [];

  await populate(users, { path: "roleRef", select: "roleName" });
  users.forEach(normalizeUserRole);

  const profileMaps = new Map();
  const usersByRole = new Map();

  users.forEach((user) => {
    if (!user?.role || !getProfileCollection(user.role)) return;
    if (!usersByRole.has(user.role)) usersByRole.set(user.role, []);
    usersByRole.get(user.role).push(user);
  });

  await Promise.all(
    Array.from(usersByRole.entries()).map(async ([role, roleUsers]) => {
      const profiles = await findMany(getProfileCollection(role), {
        user: { $in: roleUsers.map((user) => toObjectId(user._id)) }
      });
      profileMaps.set(
        role,
        new Map(profiles.map((profile) => [profile.user.toString(), profile]))
      );
    })
  );

  return users.map((user) => {
    const profile = profileMaps.get(user.role)?.get(user._id.toString());
    return mergeProfileFields(user, profile);
  });
}

export function upsertProfileForUser(user, data = {}) {
  const collectionName = getProfileCollection(user?.role);
  if (!collectionName || !user?._id) return null;

  const profileFields = pickProfileFields(user.role, data);
  if (!Object.keys(profileFields).length) return null;

  return updateOneAndReturn(
    collectionName,
    { user: toObjectId(user._id) },
    { ...profileFields, user: toObjectId(user._id) },
    { upsert: true }
  );
}
