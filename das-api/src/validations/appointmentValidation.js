import { z } from "zod";
import {
  futureDateInputSchema,
  nameSchema,
  noteSchema,
  objectIdSchema,
  optionalEmailSchema,
  optionalIsoDateTimeSchema,
  optionalObjectIdSchema,
  phoneSchema
} from "../utils/validation.js";

export const createAppointmentSchema = z.object({
  patientId: optionalObjectIdSchema,
  guestPatient: z
    .object({
      fullName: nameSchema,
      phone: phoneSchema,
      email: optionalEmailSchema,
      gender: z.enum(["male", "female", "other", "unknown"]).default("unknown")
    })
    .optional(),
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
  paymentPlan: z.enum(["one_time", "monthly"]).default("one_time"),
  installmentMonths: z.coerce
    .number()
    .int()
    .refine((value) => [3, 6, 9].includes(value), {
      message: "Chọn kỳ hạn trả theo tháng 3, 6 hoặc 9 tháng."
    })
    .optional(),
  items: z
    .array(z.object({
      name: z.string().trim().min(1).max(160),
      amount: z.coerce.number().min(0)
    }))
    .optional()
});

export const appointmentPaymentSchema = z.object({
  paymentMethod: z.enum(["cash", "card", "bank_transfer"]).default("cash")
});
