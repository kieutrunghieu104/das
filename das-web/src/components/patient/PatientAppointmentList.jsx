import { CalendarClock } from "lucide-react";
import { useMemo, useState } from "react";
import EmptyState from "../EmptyState.jsx";
import PatientAppointmentCard from "./PatientAppointmentCard.jsx";
import { clinicDateInput, compareAppointmentsNewestFirst } from "../../utils/format.js";

export default function PatientAppointmentList({
  appointments,
  appointmentHistory = [],
  canModifyAppointment,
  cancelAppointment,
  dentistOptions,
  historyOnly = false,
  loading,
  rescheduleAppointment,
  rescheduleForms,
  updateRescheduleForm
}) {
  const [filterDate, setFilterDate] = useState("");
  const source = historyOnly ? appointmentHistory : appointments;
  const visibleAppointments = useMemo(() => {
    return source
      .filter((appointment) => !filterDate || clinicDateInput(appointment.startAt) === filterDate)
      .sort(compareAppointmentsNewestFirst);
  }, [source, filterDate]);

  return (
    <section className="panel" id="appointments">
      <div className="section-title">
        <CalendarClock size={20} />
        <h2>{historyOnly ? "Lịch sử lịch hẹn" : "Lịch hẹn của tôi"}</h2>
      </div>
      <div className="toolbar-row patient-appointment-toolbar">
        <label className="field inline-field">
          <span>Lọc theo ngày</span>
          <input type="date" value={filterDate} onChange={(event) => setFilterDate(event.target.value)} />
        </label>
        {filterDate && (
          <button className="button small ghost" type="button" onClick={() => setFilterDate("")}>
            Tất cả ngày
          </button>
        )}
      </div>
      {loading ? (
        <EmptyState title="Đang tải lịch hẹn" text="Hệ thống đang lấy dữ liệu mới nhất." />
      ) : visibleAppointments.length ? (
        <div className="appointment-list">
          {visibleAppointments.map((appointment) => (
            <PatientAppointmentCard
              appointment={appointment}
              canModifyAppointment={canModifyAppointment}
              cancelAppointment={cancelAppointment}
              dentistOptions={dentistOptions}
              key={appointment._id}
              rescheduleAppointment={rescheduleAppointment}
              rescheduleForm={rescheduleForms[appointment._id]}
              updateRescheduleForm={updateRescheduleForm}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title={historyOnly ? "Chưa có lịch sử lịch hẹn" : "Chưa có lịch hẹn"}
          text={filterDate ? "Không có lịch hẹn trong ngày đang lọc." : historyOnly ? "Các lịch đã hoàn tất, bị từ chối, hủy hoặc vắng mặt sẽ hiển thị tại đây." : "Bạn có thể đặt lịch mới tại màn Đặt lịch."}
        />
      )}
    </section>
  );
}
