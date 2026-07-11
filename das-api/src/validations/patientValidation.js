import { z } from "zod";
import { noteSchema, objectIdSchema } from "../utils/validation.js";

export const patientReviewSchema = z.object({
  appointmentId: objectIdSchema,
  rating: z.coerce.number().min(1).max(5),
  comment: noteSchema
});
