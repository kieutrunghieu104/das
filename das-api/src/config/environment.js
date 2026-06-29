import "dotenv/config";

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT || 4100),
  MONGODB_URI: process.env.MONGODB_URI || "mongodb+srv://tunggg:ibSVlJRBTvY6EspR@cluster0.7wmobmh.mongodb.net/das?retryWrites=true&w=majority&appName=Cluster0",
  JWT_SECRET: process.env.JWT_SECRET || "replace-with-a-long-random-secret",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || "http://localhost:5174",
  SMTP_HOST: process.env.SMTP_HOST || "",
  SMTP_PORT: Number(process.env.SMTP_PORT || 587),
  SMTP_USER: process.env.SMTP_USER || "",
  SMTP_PASS: process.env.SMTP_PASS || "",
  SMTP_FROM: process.env.SMTP_FROM || process.env.SMTP_USER || "",
  SMTP_SECURE: String(process.env.SMTP_SECURE || "false").toLowerCase() === "true",
  PASSWORD_RESET_OTP_TTL_MINUTES: Number(process.env.PASSWORD_RESET_OTP_TTL_MINUTES || 10),
  MAIL_DEV_RETURN_OTP: String(process.env.MAIL_DEV_RETURN_OTP || "false").toLowerCase() === "true"
};
