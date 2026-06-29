import nodemailer from "nodemailer";
import { env } from "../config/environment.js";

function hasSmtpConfig() {
  return Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);
}

export async function sendPasswordResetOtp({ to, fullName, otp, ttlMinutes }) {
  if (!hasSmtpConfig()) {
    return { sent: false };
  }

  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS
    }
  });

  await transporter.sendMail({
    from: env.SMTP_FROM || env.SMTP_USER,
    to,
    subject: "Mã OTP đặt lại mật khẩu SmileCare",
    text: [
      `Xin chào ${fullName || "bạn"},`,
      "",
      `Mã OTP đặt lại mật khẩu SmileCare của bạn là: ${otp}`,
      `Mã có hiệu lực trong ${ttlMinutes} phút.`,
      "",
      "Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này."
    ].join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
        <p>Xin chào ${fullName || "bạn"},</p>
        <p>Mã OTP đặt lại mật khẩu SmileCare của bạn là:</p>
        <p style="font-size:28px;font-weight:700;letter-spacing:4px">${otp}</p>
        <p>Mã có hiệu lực trong ${ttlMinutes} phút.</p>
        <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
      </div>
    `
  });

  return { sent: true };
}
