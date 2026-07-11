import { Bell, Camera, LockKeyhole, Save, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import EmptyState from "../components/EmptyState.jsx";
import Feedback from "../components/Feedback.jsx";
import { useAuth } from "../redux/AuthContext.jsx";
import { api, getErrorMessage } from "../utils/api.js";
import { firstError, validateName, validatePassword, validatePhone } from "../utils/validation.js";

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    fullName: user?.fullName || "",
    phone: user?.phone || "",
    avatarUrl: user?.avatarUrl || "",
    bio: user?.bio || ""
  });
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "" });
  const [notifications, setNotifications] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/auth/notifications")
      .then((res) => setNotifications(res.data.notifications))
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  function updateProfile(field, value) {
    setProfile((current) => ({ ...current, [field]: value }));
  }

  async function saveProfile(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    const validationError = firstError(validateName(profile.fullName), validatePhone(profile.phone));
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!window.confirm("Xác nhận cập nhật hồ sơ?")) return;

    try {
      const res = await api.patch("/auth/me", profile);
      localStorage.setItem("das_user", JSON.stringify(res.data.user));
      setMessage("Đã cập nhật hồ sơ. Tải lại trang để đồng bộ thông tin trên thanh tiêu đề.");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function changePassword(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    const validationError = firstError(
      passwords.currentPassword ? "" : "Mật khẩu hiện tại là bắt buộc.",
      validatePassword(passwords.newPassword)
    );
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!window.confirm("Xác nhận đổi mật khẩu?")) return;

    try {
      await api.patch("/auth/change-password", passwords);
      setPasswords({ currentPassword: "", newPassword: "" });
      setMessage("Đã đổi mật khẩu.");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <div className="page-grid">
      <Feedback error={error} message={message} />

      <section className="panel">
        <div className="section-title">
          <UserRound size={20} />
          <h2>Hồ sơ cá nhân</h2>
        </div>
        <div className="profile-avatar-preview">
          {profile.avatarUrl ? <img src={profile.avatarUrl} alt={profile.fullName || "Avatar"} /> : <UserRound size={34} />}
          <span>{profile.fullName || user?.fullName}</span>
        </div>
        <form className="form-grid" onSubmit={saveProfile}>
          <label className="field">
            <span>Họ tên</span>
            <input value={profile.fullName} onChange={(e) => updateProfile("fullName", e.target.value)} required maxLength={120} />
          </label>
          <label className="field">
            <span>Số điện thoại</span>
            <input type="tel" value={profile.phone} onChange={(e) => updateProfile("phone", e.target.value)} required maxLength={13} />
          </label>
          <label className="field wide">
            <span>Avatar URL</span>
            <div className="input-icon">
              <Camera size={18} />
              <input value={profile.avatarUrl} onChange={(e) => updateProfile("avatarUrl", e.target.value)} placeholder="https://..." />
            </div>
          </label>
          <label className="field wide">
            <span>Ghi chú hồ sơ</span>
            <textarea value={profile.bio} onChange={(e) => updateProfile("bio", e.target.value)} rows="3" maxLength={1000} />
          </label>
          <button className="button primary">
            <Save size={17} />
            Lưu hồ sơ
          </button>
        </form>
      </section>

      <section className="panel">
        <div className="section-title">
          <LockKeyhole size={20} />
          <h2>Đổi mật khẩu</h2>
        </div>
        <form className="form-grid" onSubmit={changePassword}>
          <label className="field">
            <span>Mật khẩu hiện tại</span>
            <input
              type="password"
              value={passwords.currentPassword}
              onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
              required
            />
          </label>
          <label className="field">
            <span>Mật khẩu mới</span>
            <input
              type="password"
              value={passwords.newPassword}
              onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
              required
              minLength={8}
              maxLength={72}
            />
          </label>
          <button className="button secondary">Đổi mật khẩu</button>
        </form>
      </section>

      <section className="panel">
        <div className="section-title">
          <Bell size={20} />
          <h2>Thông báo</h2>
        </div>
        {notifications.length ? (
          <div className="mini-list">
            {notifications.map((notification) => (
              <div className="mini-row" key={notification._id}>
                <span>
                  <strong>{notification.title}</strong> - {notification.message}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </section>
    </div>
  );
}
