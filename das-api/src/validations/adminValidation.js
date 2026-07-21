import { z } from "zod";
import {
  nameSchema,
  noteSchema,
  objectIdSchema,
  optionalEmailSchema,
  optionalObjectIdSchema,
  optionalPhoneSchema,
  passwordSchema
} from "../utils/validation.js";

const priceStringSchema = z
  .preprocess(
    (value) => String(value ?? "").trim(),
    z.string()
      .min(1, "Giá tiền là bắt buộc.")
      .regex(/^\d+(?:-\d+)*$/, "Giá tiền chỉ được nhập số và dấu gạch ngang.")
  );

export const createAdminUserSchema = z.object({
  fullName: nameSchema,
  email: optionalEmailSchema,
  phone: optionalPhoneSchema,
  address: z.string().trim().max(255).optional().or(z.literal("")),
  password: passwordSchema.default("nhakhoa2026"),
  role: z.enum(["patient", "receptionist", "dentist", "nurse", "admin"]),
  bio: noteSchema,
  yearsOfExperience: z.coerce.number().int().min(0).max(80).default(0)
});

export const updateAdminUserSchema = z.object({
  fullName: nameSchema.optional(),
  email: optionalEmailSchema,
  phone: optionalPhoneSchema,
  address: z.string().trim().max(255).optional().or(z.literal("")),
  role: z.enum(["patient", "receptionist", "dentist", "nurse", "admin"]).optional(),
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
  assignedDentist: objectIdSchema,
  assignedNurse: optionalObjectIdSchema
});

export const updateClinicRoomSchema = z.object({
  name: nameSchema.optional(),
  assignedDentist: optionalObjectIdSchema,
  assignedNurse: optionalObjectIdSchema
});

export const updateReviewVisibilitySchema = z.object({
  isHidden: z.boolean()
});
