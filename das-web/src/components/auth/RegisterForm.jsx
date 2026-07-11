import { Home, LockKeyhole, Mail, Phone, UserRound } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../redux/AuthContext.jsx";
import PasswordField from "../PasswordField.jsx";
import { getErrorMessage } from "../../utils/api.js";
import { firstError, requireValue, validateEmail, validatePassword, validatePhone } from "../../utils/validation.js";

const genderOptions = [
  { value: "unknown", label: "Chưa chọn" },
  { value: "male", label: "Nam" },
  { value: "female", label: "Nữ" },
  { value: "other", label: "Khác" }
];

export default function RegisterForm() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    phone: "",
    gender: "unknown",
    address: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    const validationError = firstError(
      validatePhone(form.phone),
      form.email ? validateEmail(form.email) : "",
      requireValue(form.gender, "Giới tính"),
      validatePassword(form.password),
      form.confirmPassword === form.password ? "" : "Mật khẩu nhập lại không khớp."
    );
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const res = await register(form);
      setMessage(res.message || "Đăng ký thành công. Vui lòng đăng nhập.");
      setTimeout(() => navigate("/login"), 700);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <p className="eyebrow">Tạo tài khoản</p>
      <h2>Tạo tài khoản bệnh nhân</h2>

      <form className="stack" onSubmit={handleSubmit}>
        <label className="field">
          <span>Số điện thoại</span>
          <div className="input-icon">
            <Phone size={18} />
            <input type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} required maxLength={13} />
          </div>
        </label>

        <label className="field">
          <span>Email</span>
          <div className="input-icon">
            <Mail size={18} />
            <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} maxLength={120} />
          </div>
        </label>

        <label className="field">
          <span>Giới tính</span>
          <div className="input-icon">
            <UserRound size={18} />
            <select value={form.gender} onChange={(e) => update("gender", e.target.value)} required>
              {genderOptions.map((option) => (
                <option value={option.value} key={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </label>

        <label className="field">
          <span>Địa chỉ</span>
          <div className="input-icon">
            <Home size={18} />
            <input value={form.address} onChange={(e) => update("address", e.target.value)} maxLength={255} />
          </div>
        </label>

        <label className="field">
          <span>Mật khẩu</span>
          <div className="input-icon">
            <LockKeyhole size={18} />
            <PasswordField value={form.password} onChange={(e) => update("password", e.target.value)} required minLength={8} maxLength={72} />
          </div>
        </label>

        <label className="field">
          <span>Nhập lại mật khẩu</span>
          <div className="input-icon">
            <LockKeyhole size={18} />
            <PasswordField
              value={form.confirmPassword}
              onChange={(e) => update("confirmPassword", e.target.value)}
              required
              minLength={8}
              maxLength={72}
            />
          </div>
        </label>

        {error && <div className="alert error">{error}</div>}
        {message && <div className="alert success">{message}</div>}

        <button className="button primary full" disabled={loading}>
          {loading ? "Đang xử lý..." : "Tạo tài khoản"}
        </button>
      </form>

      <p className="muted">
        Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
      </p>
    </>
  );
}
