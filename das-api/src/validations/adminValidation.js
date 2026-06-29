import { z } from "zod";
import {
  futureDateInputSchema,
  nameSchema,
  noteSchema,
  objectIdSchema,
  optionalEmailSchema,
  optionalObjectIdSchema,
  optionalPhoneSchema,
  passwordSchema
} from "../utils/validation.js";

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const priceStringSchema = z
  .union([z.string().trim().min(1), z.coerce.number().min(0)])
  .transform((value) => String(value));

export const createWorkingHourSchema = z.object({
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  shiftName: nameSchema,
  startTime: timeSchema,
  endTime: timeSchema,
  status: z.enum(["active", "inactive"]).default("active")
});

export const updateWorkingHourSchema = z.object({
  dayOfWeek: z.coerce.number().int().min(0).max(6).optional(),
  shiftName: nameSchema.optional(),
  startTime: timeSchema.optional(),
  endTime: timeSchema.optional(),
  status: z.enum(["active", "inactive"]).optional()
});

export const createStaffScheduleSchema = z.object({
  userId: objectIdSchema,
  timeSlotId: objectIdSchema,
  roomId: optionalObjectIdSchema,
  workDate: futureDateInputSchema,
  startTime: timeSchema,
  endTime: timeSchema,
  status: z.enum(["scheduled", "off", "completed", "cancelled"]).default("scheduled")
});

export const updateStaffScheduleSchema = z.object({
  roomId: optionalObjectIdSchema,
  startTime: timeSchema.optional(),
  endTime: timeSchema.optional(),
  status: z.enum(["scheduled", "off", "completed", "cancelled"]).optional()
});

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
