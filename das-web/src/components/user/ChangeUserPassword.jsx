import { LockKeyhole } from "lucide-react";
import PasswordField from "../PasswordField.jsx";

export default function ChangeUserPassword({ form, onCancel, onChange, onSubmit }) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" onMouseDown={(event) => event.currentTarget === event.target && onCancel()}>
      <form className="account-modal panel" onSubmit={onSubmit}>
        <div className="section-title">
          <LockKeyhole size={20} />
          <h2>Đổi mật khẩu</h2>
        </div>
        <label className="field">
          <span>Mật khẩu hiện tại</span>
          <PasswordField
            value={form.currentPassword}
            onChange={(event) => onChange({ ...form, currentPassword: event.target.value })}
            required
          />
        </label>
        <label className="field">
          <span>Mật khẩu mới</span>
          <PasswordField
            value={form.newPassword}
            onChange={(event) => onChange({ ...form, newPassword: event.target.value })}
            required
            minLength={8}
            maxLength={72}
          />
        </label>
        <div className="row-actions">
          <button type="button" className="button ghost" onClick={onCancel}>
            Hủy
          </button>
          <button className="button primary">Đổi mật khẩu</button>
        </div>
      </form>
    </div>
  );
}
