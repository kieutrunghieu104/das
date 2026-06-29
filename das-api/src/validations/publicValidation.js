import { z } from "zod";
import {
  futureDateInputSchema,
  nameSchema,
  noteSchema,
  objectIdSchema,
  optionalEmailSchema,
  optionalFutureDateInputSchema,
  optionalObjectIdSchema,
  optionalTimeSchema,
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
  email: optionalEmailSchema,
  service: optionalObjectIdSchema,
  preferredDate: optionalFutureDateInputSchema,
  preferredTime: optionalTimeSchema,
  message: noteSchema
});
