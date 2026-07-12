import { z } from "zod";
import {
  futureDateInputSchema,
  nameSchema,
  objectIdSchema,
  optionalObjectIdSchema,
  phoneSchema
} from "../utils/validation.js";

export const availabilityQuerySchema = z.object({
  date: futureDateInputSchema,
  serviceId: objectIdSchema,
  includeBooked: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true")
});

export const consultationSchema = z.object({
  fullName: nameSchema,
  phone: phoneSchema,
  service: optionalObjectIdSchema,
  gender: z.enum(["male", "female", "other", "unknown"]).default("unknown")
});
