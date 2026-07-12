import { Save, Settings } from "lucide-react";

const genderOptions = [
  { value: "unknown", label: "Chưa chọn" },
  { value: "male", label: "Nam" },
  { value: "female", label: "Nữ" },
  { value: "other", label: "Khac" }
];

export default function EditUserProfile({ form, onCancel, onChange, onSubmit, userRole }) {
  const isPatient = userRole === "patient";

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" onMouseDown={(event) => event.currentTarget === event.target && onCancel()}>
      <form className="account-modal panel" onSubmit={onSubmit}>
        <div className="section-title">
          <Settings size={20} />
          <h2>Thông tin cá nhân</h2>
        </div>
        <label className="field">
          <span>Họ tên</span>
          <input value={form.fullName} onChange={(event) => onChange({ ...form, fullName: event.target.value })} required />
        </label>
        <label className="field">
          <span>Số điện thoại</span>
          <input type="tel" value={form.phone} onChange={(event) => onChange({ ...form, phone: event.target.value })} required />
        </label>
        <label className="field">
          <span>Email</span>
          <input type="email" value={form.email || ""} onChange={(event) => onChange({ ...form, email: event.target.value })} />
        </label>
        <div className="form-grid account-form-grid">
          {isPatient && (
            <label className="field">
              <span>Giới tính</span>
              <select value={form.gender} onChange={(event) => onChange({ ...form, gender: event.target.value })}>
                {genderOptions.map((option) => (
                  <option value={option.value} key={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="field">
            <span>Địa chỉ</span>
            <input value={form.address} onChange={(event) => onChange({ ...form, address: event.target.value })} maxLength={255} />
          </label>
        </div>
        <label className="field">
          <span>Ghi chú hồ sơ</span>
          <textarea value={form.bio} onChange={(event) => onChange({ ...form, bio: event.target.value })} rows="3" maxLength={1000} />
        </label>
        <div className="row-actions">
          <button type="button" className="button ghost" onClick={onCancel}>
            Hủy
          </button>
          <button className="button primary">
            <Save size={17} />
            Lưu
          </button>
        </div>
      </form>
    </div>
  );
}
