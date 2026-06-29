import { LockKeyhole, Phone } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../redux/AuthContext.jsx";
import PasswordField from "../PasswordField.jsx";
import { getErrorMessage } from "../../utils/api.js";
import { firstError, validatePhone } from "../../utils/validation.js";

export default function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ phone: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const validationError = firstError(validatePhone(form.phone), form.password ? "" : "Mật khẩu là bắt buộc.");
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      await login(form.phone, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <p className="eyebrow">Đăng nhập</p>
      <h2>Đăng nhập SmileCare</h2>

      <form className="stack" onSubmit={handleSubmit}>
        <label className="field">
          <span>Số điện thoại</span>
          <div className="input-icon">
            <Phone size={18} />
            <input type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} required maxLength={13} />
          </div>
        </label>

        <label className="field">
          <span>Mật khẩu</span>
          <div className="input-icon">
            <LockKeyhole size={18} />
            <PasswordField value={form.password} onChange={(e) => update("password", e.target.value)} required minLength={8} maxLength={72} />
          </div>
        </label>

        {error && <div className="alert error">{error}</div>}

        <button className="button primary full" disabled={loading}>
          {loading ? "Đang xử lý..." : "Đăng nhập"}
        </button>
        <Link className="button ghost full" to="/forgot-password">
          Quên mật khẩu
        </Link>
      </form>

      <p className="muted">
        Chưa có tài khoản? <Link to="/register">Tạo tài khoản</Link>
      </p>
    </>
  );
}
