import { z } from "zod";
import {
  futureDateInputSchema,
  nameSchema,
  noteSchema,
  optionalEmailSchema,
  optionalTimeSchema,
  passwordSchema,
  phoneSchema
} from "../utils/validation.js";

export const resetPatientPasswordSchema = z.object({
  password: passwordSchema.default("nhakhoa2026")
});

export const createReceptionPatientSchema = z.object({
  fullName: nameSchema,
  email: optionalEmailSchema,
  phone: phoneSchema,
  gender: z.enum(["male", "female", "other", "unknown"]).default("unknown"),
  address: z.string().trim().max(255).optional().or(z.literal("")),
  createAccount: z.boolean().default(true),
  password: passwordSchema.default("nhakhoa2026")
});

export const updateConsultationSchema = z.object({
  status: z.enum(["new", "contacted", "scheduled", "closed"]),
  message: noteSchema,
  preferredDate: futureDateInputSchema.optional(),
  preferredTime: optionalTimeSchema
});
