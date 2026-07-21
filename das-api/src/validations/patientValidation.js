import { z } from "zod";
import { objectIdSchema } from "../utils/validation.js";

const reviewCommentSchema = z.preprocess(
  (value) => String(value ?? "").trim(),
  z.string().max(1000, "Nhận xét tối đa 1000 ký tự.")
);

export const patientReviewSchema = z.object({
  appointmentId: objectIdSchema,
  rating: z.coerce.number().min(1).max(5),
  comment: reviewCommentSchema
});
