import { useState } from "react";
import StatusBadge from "../StatusBadge.jsx";
import { bookingSlotOptions, clinicDateInput, formatDateTime, formatSlotWithDate, getAppointmentSlot, todayInput } from "../../utils/format.js";
import RescheduleAppointmentModal from "./RescheduleAppointmentModal.jsx";

const cancelReasons = [
  "Bận việc cá nhân",
  "Muốn đổi sang thời gian khác",
  "Đã hết triệu chứng",
  "Đặt nhầm lịch",
  "Lý do khác"
];

const arrangedStatuses = new Set(["scheduled", "confirmed", "checked_in", "in_treatment", "completed"]);

export default function PatientAppointmentCard({
  appointment,
  canModifyAppointment,
  cancelAppointment,
  dentistOptions,
  rescheduleAppointment,
  rescheduleForm,
  updateRescheduleForm
}) {
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState(cancelReasons[0]);
  const [customCancelReason, setCustomCancelReason] = useState("");
  const canModify = canModifyAppointment(appointment);
  const currentRescheduleForm = rescheduleForm || {
    date: clinicDateInput(appointment.startAt) || todayInput(),
    time: getAppointmentSlot(appointment.startAt)?.value || bookingSlotOptions[0].value,
    dentistId: appointment.dentist?._id || dentistOptions[0]?._id || ""
  };
  const scheduleText = arrangedStatuses.has(appointment.status)
    ? `Giờ đến: ${formatDateTime(appointment.checkInTime || appointment.startAt)}`
    : `Slot đã đặt: ${formatSlotWithDate(appointment.startAt)}`;

  function openRescheduleForm() {
    updateRescheduleForm(appointment, {});
    setCancelOpen(false);
    setRescheduleOpen(true);
  }

  async function submitReschedule() {
    const success = await rescheduleAppointment(appointment);
    if (success) setRescheduleOpen(false);
  }

  async function submitCancel() {
    const reason = cancelReason === "Lý do khác" ? customCancelReason : cancelReason;
    await cancelAppointment(appointment, reason);
    setCancelOpen(false);
  }

  return (
    <article className="appointment-card patient-appointment-card" key={appointment._id}>
      <div>
        <h4>{appointment.service?.name}</h4>
        <p>{scheduleText}</p>
        <div className="patient-appointment-meta">
          <span className="mini">Bác sĩ: {appointment.dentist?.fullName || "Lễ tân sắp xếp"}</span>
          {appointment.patientNote && <span className="mini">Ghi chú: {appointment.patientNote}</span>}
        </div>
        {canModify ? (
          <div className="patient-appointment-actions">
            <button
              className="button small danger"
              onClick={() => {
                setCancelOpen((value) => !value);
                setRescheduleOpen(false);
              }}
            >
              Hủy lịch
            </button>
            {!rescheduleOpen && (
              <button className="button small" type="button" onClick={openRescheduleForm}>
                Đổi lịch
              </button>
            )}
            {rescheduleOpen && (
              <RescheduleAppointmentModal
                dentistOptions={dentistOptions}
                form={currentRescheduleForm}
                onCancel={() => setRescheduleOpen(false)}
                onChange={(next) => updateRescheduleForm(appointment, next)}
                onSubmit={submitReschedule}
              />
            )}
            {cancelOpen && (
              <div className="patient-reschedule-box">
                <select value={cancelReason} onChange={(event) => setCancelReason(event.target.value)}>
                  {cancelReasons.map((reason) => (
                    <option key={reason} value={reason}>{reason}</option>
                  ))}
                </select>
                {cancelReason === "Lý do khác" && (
                  <input
                    value={customCancelReason}
                    onChange={(event) => setCustomCancelReason(event.target.value)}
                    placeholder="Nhập lý do hủy"
                    maxLength={1000}
                  />
                )}
                <button className="button small danger" type="button" onClick={submitCancel}>
                  Xác nhận hủy
                </button>
                <button className="button small ghost" type="button" onClick={() => setCancelOpen(false)}>
                  Đóng
                </button>
              </div>
            )}
          </div>
        ) : (
          <span className="locked-note">Lịch này không thể thay đổi thêm.</span>
        )}
      </div>
      <StatusBadge value={appointment.status} />
    </article>
  );
}
