import { CalendarPlus, CheckCircle2, UserCheck, UserPlus } from "lucide-react";
import { todayInput } from "../../utils/format.js";
import { bookingSlotOptions, maxBookingDate } from "../../pages/BookingPage.jsx";

export default function BookAppointmentForPatientForm({
  accountMode,
  booking,
  date,
  genderOptions,
  newPatient,
  onAccountModeChange,
  onBookingChange,
  onDateChange,
  onNewPatientChange,
  onSubmit,
  patientSearch,
  selectablePatients,
  services,
  setPatientSearch
}) {
  return (
    <section className="panel receptionist-booking-panel">
      <div className="section-title receptionist-booking-title">
        <CalendarPlus size={20} />
        <div>
          <h2>Đặt lịch hộ bệnh nhân</h2>
          <p>Nhập thông tin bệnh nhân, chọn dịch vụ và slot để tạo lịch chờ xác nhận.</p>
        </div>
      </div>
      <form className="stack receptionist-booking-form" onSubmit={onSubmit}>
        <div className="reception-booking-mode" role="radiogroup" aria-label="Chọn loại bệnh nhân">
          <label className={`booking-mode-card ${accountMode === "existing" ? "active" : ""}`}>
            <input type="radio" name="accountMode" value="existing" checked={accountMode === "existing"} onChange={(event) => onAccountModeChange(event.target.value)} />
            <span className="booking-mode-icon"><UserCheck size={20} /></span>
            <span>
              <strong>Đã có tài khoản</strong>
              <small>Tìm bệnh nhân trong hệ thống</small>
            </span>
          </label>
          <label className={`booking-mode-card ${accountMode === "new" ? "active" : ""}`}>
            <input type="radio" name="accountMode" value="new" checked={accountMode === "new"} onChange={(event) => onAccountModeChange(event.target.value)} />
            <span className="booking-mode-icon"><UserPlus size={20} /></span>
            <span>
              <strong>Chưa có tài khoản</strong>
              <small>Tạo hồ sơ nhanh khi đặt lịch</small>
            </span>
          </label>
        </div>

        {accountMode === "existing" ? (
          <div className="form-grid reception-patient-grid">
            <label className="field">
              <span>Tìm tài khoản bệnh nhân</span>
              <input value={patientSearch} onChange={(event) => setPatientSearch(event.target.value)} placeholder="Tên hoặc số điện thoại" />
            </label>
            <label className="field">
              <span>Bệnh nhân</span>
              <select value={booking.patientId} onChange={(event) => onBookingChange({ patientId: event.target.value })} required>
                {selectablePatients.map((patient) => (
                  <option key={patient._id} value={patient._id}>
                    {patient.fullName} - {patient.phone}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : (
          <div className="form-grid reception-patient-grid">
            <label className="field">
              <span>Họ tên</span>
              <input value={newPatient.fullName} onChange={(event) => onNewPatientChange({ fullName: event.target.value })} required />
            </label>
            <label className="field">
              <span>Số điện thoại</span>
              <input type="tel" value={newPatient.phone} onChange={(event) => onNewPatientChange({ phone: event.target.value })} required />
            </label>
            <label className="field">
              <span>Email</span>
              <input type="email" value={newPatient.email || ""} onChange={(event) => onNewPatientChange({ email: event.target.value })} />
            </label>
            <label className="field">
              <span>Giới tính</span>
              <select value={newPatient.gender} onChange={(event) => onNewPatientChange({ gender: event.target.value })}>
                {genderOptions.map((option) => (
                  <option value={option.value} key={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="account-create-option">
              <input
                type="checkbox"
                checked={newPatient.createAccount}
                onChange={(event) => onNewPatientChange({ createAccount: event.target.checked })}
              />
              <span className="account-create-box"><CheckCircle2 size={18} /></span>
              <span>
                <strong>Tạo tài khoản mới</strong>
                <small>Tài khoản dùng số điện thoại của bệnh nhân, mật khẩu mặc định theo hệ thống.</small>
              </span>
            </label>
          </div>
        )}

        <div className="form-grid reception-booking-details">
          <label className="field">
            <span>Dịch vụ</span>
            <select value={booking.serviceId} onChange={(event) => onBookingChange({ serviceId: event.target.value })} required>
              {services.map((service) => (
                <option key={service._id} value={service._id}>
                  {service.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Ngày</span>
            <input
              type="date"
              value={date}
              min={todayInput()}
              max={maxBookingDate()}
              onChange={(event) => onDateChange(event.target.value)}
              required
            />
          </label>
          <label className="field">
            <span>Slot khám</span>
            <select value={booking.time} onChange={(event) => onBookingChange({ time: event.target.value })} required>
              {bookingSlotOptions.map((option) => (
                <option value={option.value} key={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field reception-booking-note">
            <span>Ghi chú</span>
            <input value={booking.note} onChange={(event) => onBookingChange({ note: event.target.value })} maxLength={1000} />
          </label>
        </div>

        <button className="button primary booking-submit-final">Đặt lịch hộ</button>
      </form>
    </section>
  );
}
