import { z } from "zod";
import {
  nameSchema,
  objectIdSchema,
  optionalObjectIdSchema,
  phoneSchema
} from "../utils/validation.js";

const dateInputSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày phải có định dạng YYYY-MM-DD.");

function todayInput() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

const todayOrFutureDateInputSchema = dateInputSchema.refine(
  (value) => value >= todayInput(),
  "Tạo hồ sơ điều trị không được chọn ngày trong quá khứ."
);

export const treatmentRecordSchema = z.object({
  visitNumber: z.coerce.number().int().min(1).max(100).default(1),
  visitDate: dateInputSchema.optional(),
  vitalSigns: z
    .object({
      bloodPressure: z.string().optional(),
      heartRate: z.string().optional(),
      spo2: z.string().optional(),
      temperature: z.string().optional(),
      respiratoryRate: z.string().optional()
    })
    .optional(),
  diagnosis: z.string().max(2000).optional(),
  medicalHistory: z.string().max(4000).optional(),
  treatmentResult: z.string().max(2000).optional(),
  treatmentNote: z.string().max(4000).optional(),
  treatmentPlan: z.string().max(4000).optional(),
  prescription: z.string().max(4000).optional(),
  aftercareInstructions: z.string().max(4000).optional(),
  estimatedCost: z.coerce.number().optional()
});

export const treatmentRecordSearchSchema = z.object({
  phone: phoneSchema
});

export const createTreatmentRecordSchema = z.object({
  phone: phoneSchema,
  serviceId: objectIdSchema,
  treatmentDate: todayOrFutureDateInputSchema
});

export const clinicalRoomStatusSchema = z.object({
  status: z.enum(["available", "unavailable"])
});

const performedChargeSchema = z.object({
  serviceId: optionalObjectIdSchema,
  name: nameSchema,
  amount: z.coerce.number().min(0)
});

export const performedServicesSchema = z.object({
  services: z.array(performedChargeSchema).default([]),
  extraCosts: z.array(performedChargeSchema.omit({ serviceId: true })).default([])
});
