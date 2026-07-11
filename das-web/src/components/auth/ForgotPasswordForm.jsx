import { LockKeyhole, Mail, Phone } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { api, getErrorMessage } from "../../utils/api.js";
import { firstError, validateEmail, validatePassword } from "../../utils/validation.js";
import { usePublicBootstrap } from "../../utils/usePublicBootstrap.js";
import PasswordField from "../PasswordField.jsx";

export default function ForgotPasswordForm() {
  const { clinic, loading: clinicLoading } = usePublicBootstrap();
  const receptionistPhone = clinic.receptionist?.phone || clinic.receptionistPhone || "";
  const [form, setForm] = useState({ email: "", verificationCode: "", newPassword: "" });
  const [step, setStep] = useState("request");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function requestOtp(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    const validationError = validateEmail(form.email);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/forgot-password", { email: form.email });
      setMessage(res.data.message || "Nếu email tồn tại, hệ thống sẽ gửi mã OTP đặt lại mật khẩu.");
      setStep("reset");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    const validationError = firstError(
      validateEmail(form.email),
      form.verificationCode.trim() ? "" : "Mã OTP là bắt buộc.",
      validatePassword(form.newPassword)
    );
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/reset-password", {
        email: form.email,
        verificationCode: form.verificationCode,
        newPassword: form.newPassword
      });
      setMessage(res.data.message || "Đã đặt lại mật khẩu.");
      setForm({ email: "", verificationCode: "", newPassword: "" });
      setStep("request");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <p className="eyebrow">Quên mật khẩu</p>
      <h2>Nhận OTP qua email</h2>

      <div className="forgot-password-contact">
        <div className="alert info">
          Nhập email đã cập nhật trong tài khoản để nhận mã OTP. Nếu bạn chưa cập nhật email, vui lòng liên hệ lễ tân để nhận mật khẩu mới.
        </div>
        {clinicLoading ? (
          <div className="alert info">Đang tải số điện thoại lễ tân...</div>
        ) : receptionistPhone ? (
          <a className="receptionist-contact-link" href={`tel:${receptionistPhone}`}>
            <Phone size={22} />
            <span>
              Liên hệ lễ tân
              <strong>{receptionistPhone}</strong>
            </span>
          </a>
        ) : (
          <div className="alert error">Chưa có số điện thoại lễ tân trong hệ thống.</div>
        )}
      </div>

      {step === "request" ? (
        <form className="stack" onSubmit={requestOtp}>
          <label className="field">
            <span>Email</span>
            <div className="input-icon">
              <Mail size={18} />
              <input type="email" value={form.email} onChange={(event) => update("email", event.target.value)} required />
            </div>
          </label>
          {error && <div className="alert error">{error}</div>}
          {message && <div className="alert success">{message}</div>}
          <button className="button primary full" disabled={loading}>
            {loading ? "Đang gửi..." : "Gửi mã OTP"}
          </button>
        </form>
      ) : (
        <form className="stack" onSubmit={resetPassword}>
          <label className="field">
            <span>Email</span>
            <div className="input-icon">
              <Mail size={18} />
              <input type="email" value={form.email} onChange={(event) => update("email", event.target.value)} required />
            </div>
          </label>
          <label className="field">
            <span>Mã OTP</span>
            <input value={form.verificationCode} onChange={(event) => update("verificationCode", event.target.value)} required maxLength={12} />
          </label>
          <label className="field">
            <span>Mật khẩu mới</span>
            <div className="input-icon">
              <LockKeyhole size={18} />
              <PasswordField value={form.newPassword} onChange={(event) => update("newPassword", event.target.value)} required minLength={8} maxLength={72} />
            </div>
          </label>
          {error && <div className="alert error">{error}</div>}
          {message && <div className="alert success">{message}</div>}
          <button className="button primary full" disabled={loading}>
            {loading ? "Đang đặt lại..." : "Đặt lại mật khẩu"}
          </button>
          <button className="button ghost full" type="button" onClick={() => setStep("request")}>
            Gửi lại OTP
          </button>
        </form>
      )}

      <p className="muted">
        Đã nhớ mật khẩu? <Link to="/login">Đăng nhập</Link>
      </p>
    </>
  );
}
