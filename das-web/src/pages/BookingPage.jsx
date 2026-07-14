import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Feedback from "../components/Feedback.jsx";
import AppointmentBookingForm from "../components/patient/AppointmentBookingForm.jsx";
import { useAuth } from "../redux/AuthContext.jsx";
import { usePublicBootstrap } from "../utils/usePublicBootstrap.js";
import { api, getErrorMessage } from "../utils/api.js";
import { filterOpenSlotsForDate, todayInput } from "../utils/format.js";
import { canUsePatientBooking } from "../utils/roles.js";
import { firstError, requireValue, validateDate, validateNote } from "../utils/validation.js";

export function toClinicIso(date, time) {
  return new Date(`${date}T${time}:00+07:00`).toISOString();
}

export function maxBookingDate() {
  const today = new Date();
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0);
  const maxDate = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    Math.min(today.getDate(), nextMonth.getDate())
  );
  const year = maxDate.getFullYear();
  const month = String(maxDate.getMonth() + 1).padStart(2, "0");
  const day = String(maxDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function BookingPage({ embedded = false }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const minDate = useMemo(() => todayInput(), []);
  const maxDate = useMemo(() => maxBookingDate(), []);
  const { services, dentists, rooms, slots, slotClosures, loading: bootstrapLoading } = usePublicBootstrap();
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState(minDate);
  const [dentistId, setDentistId] = useState("random");
  const [time, setTime] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const slotOptions = useMemo(
    () => filterOpenSlotsForDate(slots, slotClosures, date, { fallback: false }),
    [date, slotClosures, slots]
  );

  const dentistOptions = useMemo(() => {
    const roomDentists = rooms.map((room) => room.assignedDentist).filter(Boolean);
    const allDentists = [...roomDentists, ...dentists];
    return Array.from(new Map(allDentists.map((dentist) => [dentist._id, dentist])).values());
  }, [dentists, rooms]);

  useEffect(() => {
    setServiceId((current) => current || services[0]?._id || "");
  }, [services]);

  useEffect(() => {
    setDentistId((current) => current || "random");
  }, [dentistOptions]);

  useEffect(() => {
    setTime((current) => (slotOptions.some((slot) => slot.value === current) ? current : slotOptions[0]?.value || ""));
  }, [slotOptions]);

  function validateBookingInputs() {
    return firstError(
      requireValue(serviceId, "Dịch vụ"),
      dentistId === "random" ? "" : requireValue(dentistId, "Bác sĩ"),
      validateDate(date),
      date <= maxDate ? "" : "Bạn chỉ được đặt lịch trước tối đa 1 tháng.",
      requireValue(time, "Slot khám"),
      validateNote(note)
    );
  }

  async function book(event) {
    event.preventDefault();

    if (!user) {
      navigate("/login");
      return;
    }

    if (!canUsePatientBooking(user.role)) {
      setError("Chỉ tài khoản bệnh nhân được đặt lịch tại màn hình này.");
      return;
    }

    const validationError = validateBookingInputs();
    if (validationError) {
      setError(validationError);
      return;
    }

    const wantsRandomDentist = dentistId === "random";
    const room = wantsRandomDentist ? null : rooms.find((item) => item.assignedDentist?._id === dentistId);
    if (!wantsRandomDentist && !room) {
      setError("Chưa có phòng khám được gán bác sĩ. Vui lòng liên hệ lễ tân.");
      return;
    }

    const selectedSlot = slotOptions.find((option) => option.value === time);
    if (!window.confirm(`Xác nhận đặt lịch ca ${selectedSlot?.label || time}?`)) return;

    setError("");
    setMessage("");
    setSubmitting(true);

    try {
      await api.post("/appointments", {
        serviceId,
        date,
        startAt: toClinicIso(date, time),
        roomId: room?._id,
        dentistPreference: wantsRandomDentist ? "random" : "selected",
        note
      });
      setMessage("Đã gửi yêu cầu đặt lịch. Lễ tân sẽ tiếp nhận và cập nhật trạng thái cho bạn.");
      setNote("");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  const updateForm = (next) => {
    if (Object.prototype.hasOwnProperty.call(next, "serviceId")) setServiceId(next.serviceId);
    if (Object.prototype.hasOwnProperty.call(next, "date")) setDate(next.date);
    if (Object.prototype.hasOwnProperty.call(next, "dentistId")) setDentistId(next.dentistId);
    if (Object.prototype.hasOwnProperty.call(next, "time")) setTime(next.time);
    if (Object.prototype.hasOwnProperty.call(next, "note")) setNote(next.note);
  };

  return (
    <div className={embedded ? "booking-page embedded-booking" : "page-grid booking-page"}>
      <Feedback error={error} message={message} onClear={() => { setError(""); setMessage(""); }} />
      <AppointmentBookingForm
        bootstrapLoading={bootstrapLoading}
        date={date}
        dentistId={dentistId}
        dentistOptions={dentistOptions}
        embedded={embedded}
        maxDate={maxDate}
        minDate={minDate}
        note={note}
        onChange={updateForm}
        onSubmit={book}
        serviceId={serviceId}
        services={services}
        slotOptions={slotOptions}
        submitting={submitting}
        time={time}
        user={user}
      />
    </div>
  );
}
