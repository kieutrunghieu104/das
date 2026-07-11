import { KeyRound, Search } from "lucide-react";
import EmptyState from "../EmptyState.jsx";
import PasswordField from "../PasswordField.jsx";

export default function PatientAccountSearch({
  loading,
  onResetPassword,
  patientSearch,
  resetPasswords,
  selectablePatients,
  setPatientSearch,
  setResetPasswords
}) {
  return (
    <section className="panel">
      <div className="section-title">
        <KeyRound size={20} />
        <h2>Tài khoản bệnh nhân</h2>
      </div>
      <p className="muted">Tìm bệnh nhân và reset mật khẩu khi bệnh nhân cần hỗ trợ đăng nhập.</p>

      <label className="field">
        <span>Tìm tài khoản bệnh nhân</span>
        <div className="input-with-icon">
          <Search size={17} />
          <input value={patientSearch} onChange={(event) => setPatientSearch(event.target.value)} placeholder="Tên hoặc số điện thoại" />
        </div>
      </label>

      {loading ? (
        <EmptyState title="Đang tải tài khoản" text="Hệ thống đang lấy dữ liệu bệnh nhân." />
      ) : selectablePatients.length ? (
        <div className="reset-account-grid">
          {selectablePatients.map((patient) => (
            <article className="reset-account-card" key={patient._id}>
              <div>
                <strong>{patient.fullName}</strong>
                <span>{patient.phone || "Chưa có SĐT"}</span>
              </div>
              <PasswordField
                value={resetPasswords[patient._id] || ""}
                onChange={(event) => setResetPasswords((current) => ({ ...current, [patient._id]: event.target.value }))}
                placeholder="Mặc định: nhakhoa2026"
                minLength={8}
                maxLength={72}
              />
              <button className="button small primary" onClick={() => onResetPassword(patient)}>
                Reset mật khẩu
              </button>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="Không tìm thấy bệnh nhân" text="Thử tìm bằng số điện thoại hoặc họ tên khác." />
      )}
    </section>
  );
}
