import { z } from "zod";
import {
  nameSchema,
  optionalObjectIdSchema
} from "../utils/validation.js";

export const treatmentRecordSchema = z.object({
  visitNumber: z.coerce.number().int().min(1).max(100).default(1),
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

export const clinicalRoomStatusSchema = z.object({
  status: z.enum(["available", "unavailable"])
});

const performedChargeSchema = z.object({
  serviceId: optionalObjectIdSchema,
  name: nameSchema,
  amount: z.coerce.number().min(0)
});

export const performedServicesSchema = z.object({
  services: z.array(performedChargeSchema).min(1),
  extraCosts: z.array(performedChargeSchema.omit({ serviceId: true })).default([])
});
