import { Search } from "lucide-react";

export default function ReceptionAppointmentFilters({
  appointmentSearch,
  date,
  setAppointmentSearch,
  setDate,
  showDate = true
}) {
  return (
    <div className="toolbar-row">
      {showDate && (
        <label className="field inline-field">
          <span>Ngày</span>
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </label>
      )}
      <label className="field inline-field grow-field">
        <span>Tìm nhanh</span>
        <div className="input-with-icon">
          <Search size={17} />
          <input
            value={appointmentSearch}
            onChange={(event) => setAppointmentSearch(event.target.value)}
            placeholder="Tên, SĐT, dịch vụ hoặc bác sĩ"
          />
        </div>
      </label>
    </div>
  );
}
