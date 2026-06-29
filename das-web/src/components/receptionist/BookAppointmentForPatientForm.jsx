import { CalendarPlus } from "lucide-react";
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
    <section className="panel">
      <div className="section-title">
        <CalendarPlus size={20} />
        <h2>Đặt lịch hộ bệnh nhân</h2>
      </div>
      <form className="stack" onSubmit={onSubmit}>
        <div className="segmented-control">
          <label>
            <input type="radio" name="accountMode" value="existing" checked={accountMode === "existing"} onChange={(event) => onAccountModeChange(event.target.value)} />
            <span>Đã có tài khoản</span>
          </label>
          <label>
            <input type="radio" name="accountMode" value="new" checked={accountMode === "new"} onChange={(event) => onAccountModeChange(event.target.value)} />
            <span>Chưa có tài khoản</span>
          </label>
        </div>

        {accountMode === "existing" ? (
          <>
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
          </>
        ) : (
          <div className="form-grid">
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
            <label className="checkbox-field account-create-checkbox">
              <input
                type="checkbox"
                checked={newPatient.createAccount}
                onChange={(event) => onNewPatientChange({ createAccount: event.target.checked })}
              />
              <span>Tạo tài khoản mới cho bệnh nhân từ thông tin trên</span>
            </label>
          </div>
        )}

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
        <label className="field">
          <span>Ghi chú</span>
          <input value={booking.note} onChange={(event) => onBookingChange({ note: event.target.value })} maxLength={1000} />
        </label>
        <button className="button primary booking-submit-final">Đặt lịch hộ</button>
      </form>
    </section>
  );
}
