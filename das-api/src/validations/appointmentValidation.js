import { z } from "zod";
import {
  futureDateInputSchema,
  noteSchema,
  objectIdSchema,
  optionalIsoDateTimeSchema,
  optionalObjectIdSchema
} from "../utils/validation.js";

export const createAppointmentSchema = z.object({
  patientId: optionalObjectIdSchema,
  serviceId: objectIdSchema,
  date: futureDateInputSchema,
  startAt: optionalIsoDateTimeSchema,
  roomId: optionalObjectIdSchema,
  channel: z.enum(["online", "offline"]).optional(),
  dentistPreference: z.enum(["selected", "random"]).default("selected"),
  note: noteSchema
});

export const rescheduleAppointmentSchema = z.object({
  serviceId: optionalObjectIdSchema,
  date: futureDateInputSchema,
  startAt: optionalIsoDateTimeSchema,
  roomId: optionalObjectIdSchema
});

export const receptionScheduleSchema = rescheduleAppointmentSchema.extend({
  note: noteSchema
});

export const cancelAppointmentSchema = z.object({
  reason: noteSchema
});

export const updateAppointmentStatusSchema = z.object({
  status: z.enum([
    "pending",
    "scheduled",
    "confirmed",
    "waitlisted",
    "rejected",
    "checked_in",
    "in_treatment",
    "completed",
    "cancelled",
    "no_show"
  ]),
  note: noteSchema
});

export const appointmentNoteSchema = z.object({
  note: noteSchema
});

export const checkInAppointmentSchema = z.object({
  paid: z.boolean().default(false)
});

export const createAppointmentInvoiceSchema = z.object({
  amount: z.coerce.number().positive("Số tiền hóa đơn phải lớn hơn 0.").optional(),
  items: z.array(z.object({
    name: z.string().trim().min(1).max(160),
    amount: z.coerce.number().min(0)
  })).optional()
});

export const appointmentPaymentSchema = z.object({
  paymentMethod: z.enum(["cash", "card", "bank_transfer"]).default("cash"),
  amount: z.coerce.number().positive().optional()
});
