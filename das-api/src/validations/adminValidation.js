import { z } from "zod";
import {
  nameSchema,
  noteSchema,
  optionalEmailSchema,
  optionalObjectIdSchema,
  optionalPhoneSchema,
  passwordSchema
} from "../utils/validation.js";

const priceStringSchema = z
  .union([z.string().trim().min(1), z.coerce.number().min(0)])
  .transform((value) => String(value));

export const createAdminUserSchema = z.object({
  fullName: nameSchema,
  email: optionalEmailSchema,
  phone: optionalPhoneSchema,
  password: passwordSchema.default("nhakhoa2026"),
  role: z.enum(["patient", "receptionist", "dentist", "nurse", "admin"]),
  bio: noteSchema,
  yearsOfExperience: z.coerce.number().int().min(0).max(80).default(0)
});

export const resetAdminUserPasswordSchema = z.object({
  password: passwordSchema.optional()
});

export const updateAdminUserSchema = z.object({
  fullName: nameSchema.optional(),
  email: optionalEmailSchema,
  phone: optionalPhoneSchema,
  status: z.enum(["active", "inactive", "locked"]).optional(),
  bio: noteSchema,
  yearsOfExperience: z.coerce.number().int().min(0).max(80).optional()
});

export const createDentalServiceSchema = z.object({
  name: nameSchema,
  description: noteSchema,
  price: priceStringSchema
});

export const updateDentalServiceSchema = z.object({
  name: nameSchema.optional(),
  description: noteSchema.optional(),
  price: priceStringSchema.optional()
});

export const createClinicRoomSchema = z.object({
  name: nameSchema,
  equipment: z.array(z.string().trim().min(1).max(80)).max(20).default([]),
  assignedDentist: optionalObjectIdSchema,
  assignedNurse: optionalObjectIdSchema
});

export const updateClinicRoomSchema = z.object({
  name: nameSchema.optional(),
  equipment: z.array(z.string().trim().min(1).max(80)).max(20).optional(),
  assignedDentist: optionalObjectIdSchema,
  assignedNurse: optionalObjectIdSchema
});

export const updateReviewVisibilitySchema = z.object({
  isHidden: z.boolean()
});
