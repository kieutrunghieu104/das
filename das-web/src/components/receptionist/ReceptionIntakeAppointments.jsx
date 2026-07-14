import { ClipboardList } from "lucide-react";
import EmptyState from "../EmptyState.jsx";
import StatusBadge from "../StatusBadge.jsx";
import { filterOpenSlotsForDate, formatDateTime, formatSlotWithDate, getAppointmentSlot, todayInput } from "../../utils/format.js";
import { maxBookingDate } from "../../pages/BookingPage.jsx";
import ReceptionAppointmentFilters from "./ReceptionAppointmentFilters.jsx";

export default function ReceptionIntakeAppointments({
  allSlotOptions = [],
  appointmentSearch,
  appointments,
  date,
  loading,
  onRejectAppointment,
  onToggleSlot,
  manualSchedules,
  rooms,
  scheduleReceptionAppointment,
  setAppointmentSearch,
  setDate,
  slots = [],
  slotClosures = [],
  slotOptions,
  updateManualSchedule
}) {
  return (
    <section className="panel">
      <div className="section-title">
        <ClipboardList size={20} />
        <h2>Lịch hẹn chờ xác nhận</h2>
      </div>

      <ReceptionAppointmentFilters
        date={date}
        setDate={setDate}
        appointmentSearch={appointmentSearch}
        setAppointmentSearch={setAppointmentSearch}
        showDate
      />

      <div className="mini-list">
        {allSlotOptions.map((slot) => (
          <div className="mini-row" key={slot._id || slot.slotId}>
            <span>{slot.label}</span>
            <div className="row-actions">
              <StatusBadge value={slot.isClosed ? "closed" : "active"} />
              <button className="button small secondary" type="button" onClick={() => onToggleSlot(slot)}>
                {slot.isClosed ? "Mở slot" : "Đóng slot"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <EmptyState title="Đang tải lịch hẹn" text="Hệ thống đang lấy dữ liệu mới nhất." />
      ) : appointments.length ? (
        <div className="appointment-list">
          {appointments.map((appointment) => {
            const manualForm = manualSchedules[appointment._id] || {
              date: appointment.startAt ? new Date(appointment.startAt).toISOString().slice(0, 10) : todayInput(),
              time: appointment.startAt ? getAppointmentSlot(appointment.startAt, slotOptions).value : slotOptions[0]?.value || "",
              roomId: appointment.room?._id || rooms[0]?._id || ""
            };
            const rowSlotOptions = filterOpenSlotsForDate(slots, slotClosures, manualForm.date, { fallback: false });
            const manualTime = rowSlotOptions.some((slot) => slot.value === manualForm.time) ? manualForm.time : rowSlotOptions[0]?.value || "";
            return (
              <article className="appointment-card reception-appointment-card pending-intake" key={appointment._id}>
                <div className="appointment-card-main">
                  <div className="patient-contact-row">
                    <div>
                      <h4>{appointment.patient?.fullName || "Bệnh nhân"}</h4>
                      <p>{appointment.patient?.phone || "Chưa có SĐT"}</p>
                    </div>
                    <StatusBadge value={appointment.status} />
                  </div>
                  <div className="appointment-slot-box">
                    <strong>{appointment.service?.name || "Dịch vụ nha khoa"}</strong>
                    <span>Slot bệnh nhân chọn: {formatSlotWithDate(appointment.startAt, appointment.slot?.startTime ? appointment.slot : slotOptions)}</span>
                    <span>Thời gian bệnh nhân gửi: {formatDateTime(appointment.patientRequestedAt || appointment.createdAt)}</span>
                    <span>Bác sĩ: {appointment.dentist?.fullName || "Lễ tân sắp xếp"}</span>
                    <span>Kênh: {appointment.channel === "online" ? "Online" : "Tại quầy"}</span>
                  </div>
                  {appointment.patientNote && <span className="mini">Ghi chú bệnh nhân: {appointment.patientNote}</span>}
                </div>
                <div className="appointment-card-actions">
                  <div className="row-actions appointment-reschedule-tools manual-schedule-tools">
                    <input
                      type="date"
                      min={todayInput()}
                      max={maxBookingDate()}
                      value={manualForm.date}
                      onChange={(event) => {
                        const nextDate = event.target.value;
                        const nextSlotOptions = filterOpenSlotsForDate(slots, slotClosures, nextDate, { fallback: false });
                        updateManualSchedule(appointment, { date: nextDate, time: nextSlotOptions[0]?.value || "" });
                      }}
                    />
                    <select value={manualTime} onChange={(event) => updateManualSchedule(appointment, { time: event.target.value })}>
                      {rowSlotOptions.length ? (
                        rowSlotOptions.map((slot) => (
                          <option value={slot.value} key={slot.value}>
                            {slot.label}
                          </option>
                        ))
                      ) : (
                        <option value="">Chưa có slot đang mở</option>
                      )}
                    </select>
                    <select
                      aria-label="Bác sĩ"
                      value={manualForm.roomId}
                      onChange={(event) => updateManualSchedule(appointment, { roomId: event.target.value })}
                    >
                      {rooms.filter((room) => room.assignedDentist?._id).map((room) => (
                        <option value={room._id} key={room._id}>
                          {room.assignedDentist.fullName}
                        </option>
                      ))}
                    </select>
                    <button className="button small danger" type="button" onClick={() => onRejectAppointment(appointment)}>
                      Từ chối
                    </button>
                    <button className="button small primary" type="button" onClick={() => scheduleReceptionAppointment(appointment)}>
                      Xác nhận
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState title="Không có lịch hẹn" text="Lịch hẹn mới sẽ xuất hiện tại đây khi có dữ liệu trong hệ thống." />
      )}
    </section>
  );
}
