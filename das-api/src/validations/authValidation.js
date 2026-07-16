import { z } from "zod";
import { emailSchema, nameSchema, optionalEmailSchema, passwordSchema, phoneSchema } from "../utils/validation.js";

export const registerSchema = z
  .object({
    fullName: nameSchema.optional(),
    email: optionalEmailSchema,
    phone: phoneSchema,
    gender: z.enum(["male", "female", "other", "unknown"]).default("unknown"),
    address: z.string().trim().max(255).optional().or(z.literal("")),
    password: passwordSchema,
    confirmPassword: z.string().min(1)
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu nhập lại không khớp.",
    path: ["confirmPassword"]
  });

export const loginSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1)
});

export const forgotPasswordSchema = z.object({
  email: emailSchema
});

export const resetPasswordSchema = z.object({
  email: emailSchema,
  verificationCode: z.string().trim().min(4).max(12),
  newPassword: passwordSchema
});

const avatarSchema = z
  .string()
  .trim()
  .max(750000)
  .refine((value) => !value || value.startsWith("data:image/") || /^https?:\/\//i.test(value), {
    message: "Avatar phải là URL ảnh hoặc ảnh tải lên hợp lệ."
  })
  .optional()
  .or(z.literal(""));

export const updateProfileSchema = z.object({
  fullName: nameSchema.optional(),
  email: optionalEmailSchema,
  phone: phoneSchema.optional(),
  gender: z.enum(["male", "female", "other", "unknown"]).optional(),
  address: z.string().trim().max(255).optional().or(z.literal("")),
  avatarUrl: avatarSchema,
  bio: z.string().trim().max(1000).optional()
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: passwordSchema
});
