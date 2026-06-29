import mongoose from "mongoose";
import { z } from "zod";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const phonePattern = /^(?:0|\+84)\d{8,10}$/;
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

function emptyToUndefined(value) {
  return value === "" || value === null ? undefined : value;
}

function parseDateInput(value) {
  if (!datePattern.test(value)) return null;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }

  date.setHours(0, 0, 0, 0);
  return date;
}

function todayStart() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

export const objectIdSchema = z
  .string()
  .trim()
  .refine((value) => mongoose.Types.ObjectId.isValid(value), "Mã dữ liệu không hợp lệ.");

export const optionalObjectIdSchema = z.preprocess(emptyToUndefined, objectIdSchema.optional());

export const nameSchema = z.string().trim().min(2, "Họ tên cần ít nhất 2 ký tự.").max(120, "Họ tên quá dài.");

export const emailSchema = z.string().trim().toLowerCase().email("Email không hợp lệ.");

export const optionalEmailSchema = z.preprocess(emptyToUndefined, emailSchema.optional());

export const phoneSchema = z
  .string()
  .trim()
  .regex(phonePattern, "Số điện thoại phải bắt đầu bằng 0 hoặc +84 và có 9-11 chữ số.");

export const optionalPhoneSchema = z.preprocess(emptyToUndefined, phoneSchema.optional());

export const passwordSchema = z
  .string()
  .min(8, "Mật khẩu cần ít nhất 8 ký tự.")
  .max(72, "Mật khẩu tối đa 72 ký tự.")
  .regex(/[A-Za-z]/, "Mật khẩu cần có chữ cái.")
  .regex(/\d/, "Mật khẩu cần có chữ số.");

export const dateInputSchema = z
  .string()
  .trim()
  .regex(datePattern, "Ngày phải có định dạng YYYY-MM-DD.")
  .refine((value) => Boolean(parseDateInput(value)), "Ngày không hợp lệ.");

export const futureDateInputSchema = dateInputSchema
  .refine((value) => parseDateInput(value) >= todayStart(), "Ngày không được ở quá khứ.");

export const optionalFutureDateInputSchema = z.preprocess(emptyToUndefined, futureDateInputSchema.optional());

export const isoDateTimeSchema = z.string().datetime("Thời gian không hợp lệ.");

export const optionalIsoDateTimeSchema = z.preprocess(emptyToUndefined, isoDateTimeSchema.optional());

export const optionalTimeSchema = z.preprocess(
  emptyToUndefined,
  z.string().trim().regex(timePattern, "Giờ phải có định dạng HH:mm.").optional()
);

export const noteSchema = z.preprocess(
  emptyToUndefined,
  z.string().trim().max(1000, "Ghi chú tối đa 1000 ký tự.").optional()
);

export const shortTextSchema = z.string().trim().min(2, "Nội dung cần ít nhất 2 ký tự.").max(160);

export const optionalShortTextSchema = z.preprocess(
  emptyToUndefined,
  z.string().trim().max(160, "Nội dung tối đa 160 ký tự.").optional()
);
