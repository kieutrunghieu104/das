import { Fragment } from "react";
import { Stethoscope } from "lucide-react";
import EmptyState from "../EmptyState.jsx";
import StatusBadge from "../StatusBadge.jsx";
import { formatDateTime } from "../../utils/format.js";

export default function ClinicalWorkSchedule({
  appointments,
  canEditAppointment,
  clinicalColumns,
  clinicalRows,
  date,
  isLockedAppointment,
  loading,
  onDateChange,
  onSelectPerformedServices,
  onSelectTreatment,
  onSetRoomStatus,
  onUpdateStatus,
  rooms,
  user
}) {
  const visibleRooms = rooms || [];

  return (
    <section className="panel reception-schedule-panel clinical-schedule-panel">
      <div className="section-title">
        <Stethoscope size={20} />
        <h2>Lịch khám trong ngày</h2>
      </div>
      <div className="clinical-schedule-toolbar">
        <div className="clinical-room-strip">
          {visibleRooms.length ? (
            visibleRooms.map((room) => (
              <div className="room-chip clinical-room-status-chip" key={room._id}>
                <span>{room.name} / {room.assignedDentist?.fullName || "Chưa gán bác sĩ"}</span>
                <StatusBadge value={room.status} />
                {user?.role === "nurse" && (
                  <span className="room-chip-actions">
                    <button
                      className="button tiny secondary"
                      type="button"
                      onClick={() => onSetRoomStatus(room._id, room.status === "available" ? "unavailable" : "available")}
                    >
                      {room.status === "available" ? "Chưa sẵn sàng" : "Sẵn sàng"}
                    </button>
                  </span>
                )}
              </div>
            ))
          ) : (
            <span className="room-chip muted">Chưa có phòng được phân công</span>
          )}
        </div>
        <label className="field inline-field">
          <span>Ngày</span>
          <input type="date" value={date} onChange={(event) => onDateChange(event.target.value)} />
        </label>
      </div>

      {loading ? (
        <EmptyState title="Đang tải lịch khám" text="Hệ thống đang lấy dữ liệu mới nhất." />
      ) : appointments.length && clinicalColumns.length ? (
        <div className="reception-schedule-table-wrapper">
          <div
            className="reception-schedule-grid clinical-schedule-grid"
            style={{ gridTemplateColumns: `130px repeat(${clinicalColumns.length}, minmax(250px, 1fr))` }}
          >
            <div className="schedule-head schedule-index-head">Slot</div>
            {clinicalColumns.map((column) => (
              <div className="schedule-head" key={column._id}>
                <strong>{column.fullName}</strong>
                <span>{column.roomName || "Đang trực"}</span>
              </div>
            ))}
            {clinicalRows.map((row) => (
              <Fragment key={row.slotId}>
                <div className="schedule-time-cell">
                  <strong>{row.slotName}</strong>
                  <span>{row.timeLabel}</span>
                </div>
                {row.cells.map((cellAppointments, columnIndex) => (
                  <div className="schedule-cell" key={`${row.slotId}-${clinicalColumns[columnIndex]._id}`}>
                    {cellAppointments.length ? (
                      cellAppointments.map((appointment) => (
                        <article className={`schedule-cell-card ${isLockedAppointment(appointment) ? "locked" : ""}`} key={appointment._id}>
                          <div>
                            <strong>{appointment.patient?.fullName || "Bệnh nhân"}</strong>
                            <span>{appointment.service?.name || "Dịch vụ"} / {appointment.room?.name || "Phòng khám"}</span>
                            <small>Giờ khám: {formatDateTime(appointment.startAt)}</small>
                          </div>
                          <StatusBadge value={appointment.status} />
                          <div className="row-actions schedule-status-actions">
                            {canEditAppointment(user, appointment) && (
                              <>
                                {user?.role === "nurse" && appointment.status === "checked_in" && (
                                  <button className="button small secondary" type="button" onClick={() => onUpdateStatus(appointment, "in_treatment")}>
                                    Đang khám
                                  </button>
                                )}
                                {user?.role === "nurse" && appointment.status === "in_treatment" && (
                                  <button className="button small primary" type="button" onClick={() => onUpdateStatus(appointment, "completed")}>
                                    Hoàn tất
                                  </button>
                                )}
                                <button className="button small" type="button" onClick={() => onSelectTreatment(appointment)}>
                                  {user?.role === "dentist" ? "Xem hồ sơ điều trị" : "Hồ sơ điều trị"}
                                </button>
                                {user?.role === "nurse" && (
                                  <button className="button small secondary" type="button" onClick={() => onSelectPerformedServices(appointment)}>
                                    Dịch vụ đã làm
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </article>
                      ))
                    ) : (
                      <div className="schedule-empty-cell">Chưa có bệnh nhân</div>
                    )}
                  </div>
                ))}
              </Fragment>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState title="Chưa có lịch khám" text="Lịch được check-in hoặc xếp trong ngày sẽ hiển thị tại đây." />
      )}
    </section>
  );
}

