import { CalendarSearch } from "lucide-react";

export default function AppointmentBookingForm({
  bootstrapLoading,
  date,
  dentistId,
  dentistOptions,
  embedded,
  maxDate,
  minDate,
  note,
  onChange,
  onSubmit,
  serviceId,
  services,
  slotOptions,
  submitting,
  time,
  user
}) {
  return (
    <section className="panel patient-booking-panel">
      <div className="booking-form-heading">
        <CalendarSearch size={24} />
        <div>
          <h2>Đặt lịch khám</h2>
          <p>Miễn phí chụp phim, tư vấn và thăm khám khi khách hàng đặt lịch hẹn trước.</p>
        </div>
      </div>

      <form className="booking-form-modern" onSubmit={onSubmit}>
        <label className="field">
          <span>Họ và tên</span>
          <input value={user?.fullName || ""} disabled />
        </label>

        <label className="field">
          <span>Số điện thoại</span>
          <input value={user?.phone || ""} disabled />
        </label>

        <label className="field">
          <span>Dịch vụ quan tâm</span>
          <select value={serviceId} onChange={(event) => onChange({ serviceId: event.target.value })} disabled={bootstrapLoading} required>
            {services.map((service) => (
              <option value={service._id} key={service._id}>
                {service.name}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Bác sĩ</span>
          <select value={dentistId} onChange={(event) => onChange({ dentistId: event.target.value })} disabled={bootstrapLoading}>
            <option value="random">Để lễ tân sắp xếp</option>
            {dentistOptions.map((dentist) => (
              <option value={dentist._id} key={dentist._id}>
                {dentist.fullName}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Ngày khám</span>
          <input type="date" value={date} min={minDate} max={maxDate} onChange={(event) => onChange({ date: event.target.value })} required />
        </label>

        <fieldset className="booking-time-field">
          <legend>Khung giờ khám</legend>
          <div className="booking-time-options">
            {slotOptions.length ? (
              slotOptions.map((option) => (
                <label key={option.value}>
                  <input
                    type="radio"
                    name={`booking-time${embedded ? "-embedded" : ""}`}
                    value={option.value}
                    checked={time === option.value}
                    onChange={(event) => onChange({ time: event.target.value })}
                  />
                  <span>{option.label}</span>
                </label>
              ))
            ) : (
              <span className="muted">Chưa có khung giờ đang mở</span>
            )}
          </div>
        </fieldset>

        <label className="field wide">
          <span>Ghi chú</span>
          <input
            value={note}
            onChange={(event) => onChange({ note: event.target.value })}
            placeholder="Triệu chứng hoặc yêu cầu thêm"
            maxLength={1000}
          />
        </label>

        <button className="button primary booking-submit-final" disabled={submitting || bootstrapLoading || !slotOptions.length}>
          {submitting ? "Đang gửi..." : "Đặt lịch"}
        </button>
      </form>
    </section>
  );
}
