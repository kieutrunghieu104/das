import { CalendarDays } from "lucide-react";
import EmptyState from "../EmptyState.jsx";
import StatusBadge from "../StatusBadge.jsx";
import { roleLabels } from "../../utils/roles.js";

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString("vi-VN") : "-";
}

function formatTimeSlotName(value) {
  if (!value) return "Khung giờ";
  return value.replace(/slot/i, "Khung").replace(/_/g, " ");
}

export default function StaffScheduleManagement({
  assignableUsers,
  onCreateSchedule,
  onScheduleFormChange,
  onUpdateScheduleStatus,
  rooms,
  scheduleForm,
  schedules,
  schedulesLoaded,
  timeSlots
}) {
  return (
    <>
      <section className="panel">
        <div className="section-title">
          <CalendarDays size={20} />
          <h2>Quản lý lịch nhân sự</h2>
        </div>
        <form className="form-grid" onSubmit={onCreateSchedule}>
          <label className="field">
            <span>Nhân sự</span>
            <select value={scheduleForm.userId} onChange={(event) => onScheduleFormChange({ userId: event.target.value })}>
              <option value="">Chọn nhân sự</option>
              {assignableUsers.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.fullName} - {roleLabels[user.role] || user.role}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Phòng</span>
            <select value={scheduleForm.roomId} onChange={(event) => onScheduleFormChange({ roomId: event.target.value })}>
              <option value="">Không gán phòng</option>
              {rooms.map((room) => (
                <option key={room._id} value={room._id}>
                  {room.name} - {room.status}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Ngày làm</span>
            <input type="date" value={scheduleForm.workDate} onChange={(event) => onScheduleFormChange({ workDate: event.target.value })} />
          </label>
          <label className="field">
            <span>Ca làm</span>
            <select
              value={scheduleForm.timeSlotId}
              onChange={(event) => {
                const slot = timeSlots.find((item) => item._id === event.target.value);
                onScheduleFormChange({
                  timeSlotId: event.target.value,
                  startTime: slot?.startTime || scheduleForm.startTime,
                  endTime: slot?.endTime || scheduleForm.endTime
                });
              }}
            >
              <option value="">Chọn ca</option>
              {timeSlots.map((slot) => (
                <option key={slot._id} value={slot._id}>
                  {formatTimeSlotName(slot.slotName)} ({slot.startTime} - {slot.endTime})
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Bắt đầu</span>
            <input type="time" value={scheduleForm.startTime} onChange={(event) => onScheduleFormChange({ startTime: event.target.value })} />
          </label>
          <label className="field">
            <span>Kết thúc</span>
            <input type="time" value={scheduleForm.endTime} onChange={(event) => onScheduleFormChange({ endTime: event.target.value })} />
          </label>
          <button className="button primary">Tạo lịch</button>
        </form>
      </section>

      <section className="panel">
        <div className="section-title">
          <CalendarDays size={20} />
          <h2>Lịch làm việc</h2>
        </div>
        {!schedulesLoaded ? (
          <EmptyState title="Đang tải lịch nhân sự" text="Hệ thống đang lấy dữ liệu mới nhất." />
        ) : schedules.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Ngày</th>
                  <th>Nhân sự</th>
                  <th>Vai trò</th>
                  <th>Ca</th>
                  <th>Phòng</th>
                  <th>Trạng thái</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((schedule) => (
                  <tr key={schedule._id}>
                    <td>{formatDate(schedule.workDate)}</td>
                    <td>{schedule.user?.fullName || "-"}</td>
                    <td>{roleLabels[schedule.user?.role] || schedule.user?.role || "-"}</td>
                    <td>
                      {schedule.startTime} - {schedule.endTime}
                    </td>
                    <td>{schedule.room?.name || "-"}</td>
                    <td>
                      <StatusBadge value={schedule.status} />
                    </td>
                    <td>
                      <div className="row-actions">
                        <button className="button small" onClick={() => onUpdateScheduleStatus(schedule._id, "completed")}>
                          Hoàn tất
                        </button>
                        <button className="button small ghost" onClick={() => onUpdateScheduleStatus(schedule._id, "off")}>
                          Nghỉ
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState />
        )}
      </section>
    </>
  );
}
