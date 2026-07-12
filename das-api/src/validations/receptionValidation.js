import { z } from "zod";
import {
  nameSchema,
  optionalEmailSchema,
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
