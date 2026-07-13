import { todayInput } from "../../utils/format.js";
import { maxBookingDate } from "../../pages/BookingPage.jsx";

export default function RescheduleAppointmentModal({
  dentistOptions,
  form,
  onCancel,
  onChange,
  onSubmit,
  slotOptions
}) {
  return (
    <div className="patient-reschedule-box">
      <input
        type="date"
        min={todayInput()}
        max={maxBookingDate()}
        value={form.date}
        onChange={(event) => onChange({ date: event.target.value })}
      />
      <select value={form.dentistId} onChange={(event) => onChange({ dentistId: event.target.value })}>
        <option value="reception">Lễ tân sắp xếp</option>
        {dentistOptions.map((dentist) => (
          <option key={dentist._id} value={dentist._id}>
            {dentist.fullName}
          </option>
        ))}
      </select>
      <select value={form.time} onChange={(event) => onChange({ time: event.target.value })}>
        {slotOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <button className="button small primary" type="button" onClick={onSubmit}>
        Xác nhận đổi
      </button>
      <button className="button small ghost" type="button" onClick={onCancel}>
        Đóng
      </button>
    </div>
  );
}
