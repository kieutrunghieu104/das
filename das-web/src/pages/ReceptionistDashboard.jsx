import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Feedback from "../components/Feedback.jsx";
import BookAppointmentForPatientForm from "../components/receptionist/BookAppointmentForPatientForm.jsx";
import ConsultationRequestList from "../components/receptionist/ConsultationRequestList.jsx";
import PatientAccountSearch from "../components/receptionist/PatientAccountSearch.jsx";
import ReceptionCheckInAppointments from "../components/receptionist/ReceptionCheckInAppointments.jsx";
import ReceptionClinicalQueue from "../components/receptionist/ReceptionClinicalQueue.jsx";
import ReceptionIntakeAppointments from "../components/receptionist/ReceptionIntakeAppointments.jsx";
import { api, getErrorMessage } from "../utils/api.js";
import { bookingSlotOptions, clinicDateInput, compareQueueWithinSlot, getAppointmentSlot } from "../utils/appointmentSlots.js";
import { todayInput } from "../utils/format.js";
import { firstError, requireValue, validateDate, validateName, validateNote, validatePhone } from "../utils/validation.js";
import { maxBookingDate, toClinicIso } from "./BookingPage.jsx";

const intakeStatuses = new Set(["pending"]);
const clinicalQueueStatuses = new Set(["scheduled", "confirmed", "checked_in", "in_treatment"]);
const paymentStatuses = new Set(["completed"]);

const genderOptions = [
  { value: "unknown", label: "Chưa chọn" },
  { value: "male", label: "Nam" },
  { value: "female", label: "Nữ" },
  { value: "other", label: "Khác" }
];

export default function ReceptionistDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeFeature, setActiveFeature] = useState("appointments");
  const [date, setDate] = useState(todayInput());
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [services, setServices] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [appointmentSearch, setAppointmentSearch] = useState("");
  const [patientSearch, setPatientSearch] = useState("");
  const [accountMode, setAccountMode] = useState("existing");
  const [newPatient, setNewPatient] = useState({ fullName: "", email: "", phone: "", gender: "unknown", createAccount: false });
  const [booking, setBooking] = useState({ patientId: "", serviceId: "", time: "08:00", note: "" });
  const [resetPasswords, setResetPasswords] = useState({});
  const [manualSchedules, setManualSchedules] = useState({});
  const [paymentAmounts, setPaymentAmounts] = useState({});
  const [paymentMethods, setPaymentMethods] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load({ silent = false } = {}) {
    if (!silent) setLoading(true);
    try {
      const res = await api.get("/reception/dashboard");

      setAppointments(res.data.appointments);
      setPatients(res.data.patients);
      setServices(res.data.services);
      setConsultations(res.data.consultations);
      setRooms(res.data.rooms);
      setBooking((current) => ({
        ...current,
        patientId: current.patientId || res.data.patients[0]?._id || "",
        serviceId: current.serviceId || res.data.services[0]?._id || ""
      }));
      window.dispatchEvent(new Event("das:refresh-badges"));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [date]);

  useEffect(() => {
    load({ silent: true });
  }, [activeFeature]);

  useEffect(() => {
    const tab = new URLSearchParams(location.search).get("tab");
    if (["appointments", "schedule", "payments", "booking", "accounts", "consultations"].includes(tab)) {
      setActiveFeature(tab);
    }
  }, [location.search]);

  useEffect(() => {
    const refresh = setInterval(() => load({ silent: true }), 60000);
    return () => {
      clearInterval(refresh);
    };
  }, [date]);

  useEffect(() => {
    if (activeFeature !== "accounts") return undefined;
    const keyword = patientSearch.trim();
    const timer = setTimeout(async () => {
      try {
        const res = await api.get("/reception/patients", { params: keyword ? { q: keyword } : {} });
        setPatients(res.data.patients || []);
      } catch (err) {
        setError(getErrorMessage(err));
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [activeFeature, patientSearch]);

  async function createBooking(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    const commonError = firstError(
      requireValue(booking.serviceId, "Dịch vụ"),
      validateDate(date),
      requireValue(booking.time, "Slot khám"),
      validateNote(booking.note)
    );
    const patientError =
      accountMode === "existing"
        ? requireValue(booking.patientId, "Bệnh nhân")
        : firstError(validateName(newPatient.fullName), validatePhone(newPatient.phone), requireValue(newPatient.gender, "Giới tính"));
    const validationError = firstError(commonError, patientError);

    if (validationError) {
      setError(validationError);
      return;
    }
    if (date > maxBookingDate()) {
      setError("Lễ tân chỉ được đặt lịch trước tối đa 1 tháng.");
      return;
    }

    if (!window.confirm("Xác nhận đặt lịch hộ bệnh nhân?")) return;

    try {
      let patientId = booking.patientId;

      if (accountMode === "new") {
        const res = await api.post("/reception/patients", newPatient);
        patientId = res.data.patient._id;
        setNewPatient({ fullName: "", email: "", phone: "", gender: "unknown", createAccount: false });
      }

      await api.post("/appointments", {
        patientId,
        serviceId: booking.serviceId,
        date,
        startAt: toClinicIso(date, booking.time),
        channel: "offline",
        dentistPreference: "random",
        note: booking.note
      });
      setMessage("Đã tạo lịch hẹn chờ xác nhận và xếp giờ.");
      setActiveFeature("appointments");
      navigate("/dashboard?tab=appointments", { replace: true });
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function rejectAppointment(appointment) {
    if (!window.confirm("Xác nhận từ chối lịch hẹn này?")) return;

    try {
      await api.patch(`/appointments/${appointment._id}/status`, {
        status: "rejected",
        note: "Lễ tân từ chối lịch hẹn."
      });
      setMessage("Đã từ chối lịch hẹn.");
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function checkInClinicalAppointment(appointment) {
    if (isLockedScheduleAppointment(appointment)) {
      setError("Lịch này đã hủy hoặc bị từ chối nên không thể thay đổi trạng thái.");
      return;
    }

    if (!window.confirm("Xác nhận bệnh nhân đã có mặt tại quầy?")) return;

    try {
      await api.patch(`/appointments/${appointment._id}/check-in`, { paid: false });
      setMessage("Đã check-in bệnh nhân. Lịch khám đã chuyển cho y tá và bác sĩ theo slot.");
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function markNoShow(appointment) {
    if (!window.confirm("Xác nhận đánh dấu vắng mặt?")) return;

    try {
      await api.patch(`/appointments/${appointment._id}/no-show`, { note: "Lễ tân đánh dấu bệnh nhân vắng mặt." });
      setMessage("Đã đánh dấu bệnh nhân vắng mặt.");
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function generateInvoice(appointment) {
    const performedItems = [
      ...(appointment.performedServices || []),
      ...(appointment.extraCosts || [])
    ].map((item) => ({
      name: item.name || "Dịch vụ nha khoa",
      amount: Number(item.amount || 0)
    }));
    const performedTotal = performedItems.reduce((sum, item) => sum + item.amount, 0);
    const amount = performedTotal;
    if (amount <= 0) {
      setError("Chờ y tá xác nhận dịch vụ đã thực hiện trước khi tạo hóa đơn.");
      return;
    }
    if (!window.confirm(`Tạo hóa đơn ${amount.toLocaleString("vi-VN")} VND cho lịch hẹn này?`)) return;

    try {
      await api.post(`/appointments/${appointment._id}/invoice`, {
        amount,
        items: performedItems.length ? performedItems : undefined
      });
      setMessage("Đã tạo hóa đơn và gửi tới bệnh nhân.");
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function processPayment(appointment) {
    const amount = Number(paymentAmounts[appointment._id] || 0);
    if (amount <= 0) {
      setError("Nhập số tiền bệnh nhân thanh toán.");
      return;
    }
    if (!window.confirm("Xác nhận đã thu tiền cho lịch hẹn này?")) return;

    try {
      await api.patch(`/appointments/${appointment._id}/payment`, { paymentMethod: paymentMethods[appointment._id] || "cash", amount });
      setMessage("Đã ghi nhận thanh toán.");
      setPaymentAmounts((current) => ({ ...current, [appointment._id]: "" }));
      setPaymentMethods((current) => ({ ...current, [appointment._id]: "cash" }));
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function scheduleReceptionAppointment(appointment) {
    const form = manualSchedules[appointment._id] || defaultManualSchedule(appointment, rooms);
    if (!form.date || !form.time || !form.roomId) {
      setError("Chọn ngày, giờ và bác sĩ/phòng trước khi xác nhận lịch hẹn.");
      return;
    }

    const room = rooms.find((item) => item._id === form.roomId);
    if (!room?.assignedDentist?._id) {
      setError("Phòng khám này chưa có bác sĩ phụ trách.");
      return;
    }

    if (!window.confirm(`Xác nhận lịch ${form.date} ${form.time} với ${room.assignedDentist.fullName}?`)) return;

    try {
      await api.patch(`/appointments/${appointment._id}/reception-schedule`, {
        serviceId: appointment.service?._id,
        date: form.date,
        startAt: toClinicIso(form.date, form.time),
        roomId: room._id,
        note: "Lễ tân đã xác nhận ngày, giờ và bác sĩ khám."
      });
      setMessage("Đã xếp lịch hẹn và gửi thông tin cho bệnh nhân.");
      setManualSchedules((current) => {
        const next = { ...current };
        delete next[appointment._id];
        return next;
      });
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function updateConsultation(id, status) {
    if (!window.confirm("Xác nhận cập nhật yêu cầu tư vấn?")) return;

    try {
      await api.patch(`/reception/consultations/${id}`, { status });
      setMessage("Đã cập nhật yêu cầu tư vấn.");
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function deleteConsultation(id) {
    if (!window.confirm("Xóa yêu cầu tư vấn này khỏi hệ thống?")) return;

    try {
      await api.delete(`/reception/consultations/${id}`);
      setMessage("Đã xóa yêu cầu tư vấn.");
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  function updateManualSchedule(appointment, nextValues) {
    setManualSchedules((current) => ({
      ...current,
      [appointment._id]: {
        ...defaultManualSchedule(appointment, rooms),
        ...(current[appointment._id] || {}),
        ...nextValues
      }
    }));
  }

  async function resetPatientPassword(patient) {
    const password = resetPasswords[patient._id] || "nhakhoa2026";
    if (!window.confirm(`Xác nhận reset mật khẩu cho ${patient.fullName}?`)) return;

    try {
      const res = await api.patch(`/reception/patients/${patient._id}/reset-password`, { password });
      setMessage(`Đã reset mật khẩu cho ${res.data.patient.fullName}. Mật khẩu tạm: ${res.data.temporaryPassword}`);
      setResetPasswords((current) => ({ ...current, [patient._id]: "" }));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  const filteredBaseAppointments = appointments.filter((appointment) => matchesAppointmentFilters(appointment, appointmentSearch));
  const dateFilteredAppointments = filteredBaseAppointments.filter((appointment) => !date || clinicDateInput(appointment.startAt) === date);
  const intakeAppointments = filteredBaseAppointments.filter((appointment) => intakeStatuses.has(appointment.status));
  const clinicalQueueAppointments = dateFilteredAppointments.filter((appointment) => clinicalQueueStatuses.has(appointment.status));
  const paymentAppointments = filteredBaseAppointments.filter((appointment) => paymentStatuses.has(appointment.status));
  const patientKeyword = patientSearch.trim().toLowerCase();
  const selectablePatients = patients.filter((patient) => {
    if (!patientKeyword) return true;
    return [patient.fullName, patient.phone].filter(Boolean).join(" ").toLowerCase().includes(patientKeyword);
  });

  const dentistColumns = useMemo(() => {
    const roomDentists = rooms
      .filter((room) => room.assignedDentist?._id)
      .map((room) => ({
        ...room.assignedDentist,
        roomId: room._id,
        roomName: room.name
      }));
    const appointmentDentists = clinicalQueueAppointments
      .filter((appointment) => appointment.dentist?._id)
      .map((appointment) => ({
        ...appointment.dentist,
        roomId: appointment.room?._id,
        roomName: appointment.room?.name
      }));

    return Array.from(
      new Map(
        [...roomDentists, ...appointmentDentists]
          .filter((dentist) => dentist?._id)
          .map((dentist) => [dentist._id, dentist])
      ).values()
    ).slice(0, 3);
  }, [clinicalQueueAppointments, rooms]);

  const queueSlots = useMemo(() => {
    return bookingSlotOptions.map((slot) => ({
      slot,
      dentistQueues: dentistColumns.map((dentist) => ({
        dentist,
        appointments: clinicalQueueAppointments
          .filter(
            (appointment) =>
              appointment.dentist?._id === dentist._id &&
              getAppointmentSlot(appointment.startAt).slotId === slot.slotId
          )
          .sort(compareQueueWithinSlot)
      }))
    }));
  }, [clinicalQueueAppointments, dentistColumns]);

  return (
    <div className="page-grid">
      <Feedback error={error} message={message} onClear={() => { setError(""); setMessage(""); }} />

      {activeFeature === "appointments" && (
        <ReceptionIntakeAppointments
          appointmentSearch={appointmentSearch}
          appointments={intakeAppointments}
          date={date}
          loading={loading}
          onRejectAppointment={rejectAppointment}
          manualSchedules={manualSchedules}
          rooms={rooms}
          scheduleReceptionAppointment={scheduleReceptionAppointment}
          setAppointmentSearch={setAppointmentSearch}
          setDate={setDate}
          updateManualSchedule={updateManualSchedule}
        />
      )}

      {activeFeature === "payments" && (
        <ReceptionCheckInAppointments
          appointmentSearch={appointmentSearch}
          checkInAppointments={paymentAppointments}
          date={date}
          generateInvoice={generateInvoice}
          loading={loading}
          processPayment={processPayment}
          paymentAmounts={paymentAmounts}
          paymentMethods={paymentMethods}
          setAppointmentSearch={setAppointmentSearch}
          setDate={setDate}
          setPaymentAmounts={setPaymentAmounts}
          setPaymentMethods={setPaymentMethods}
        />
      )}

      {activeFeature === "schedule" && (
        <ReceptionClinicalQueue
          appointmentSearch={appointmentSearch}
          date={date}
          dentistColumns={dentistColumns}
          isLockedScheduleAppointment={isLockedScheduleAppointment}
          loading={loading}
          onCheckInAppointment={checkInClinicalAppointment}
          onMarkNoShow={markNoShow}
          queueSlots={queueSlots}
          rooms={rooms}
          setAppointmentSearch={setAppointmentSearch}
          setDate={setDate}
        />
      )}

      {activeFeature === "booking" && (
        <BookAppointmentForPatientForm
          accountMode={accountMode}
          booking={booking}
          date={date}
          genderOptions={genderOptions}
          newPatient={newPatient}
          onAccountModeChange={setAccountMode}
          onBookingChange={(next) => setBooking((current) => ({ ...current, ...next }))}
          onDateChange={setDate}
          onNewPatientChange={(next) => setNewPatient((current) => ({ ...current, ...next }))}
          onSubmit={createBooking}
          patientSearch={patientSearch}
          selectablePatients={selectablePatients}
          services={services}
          setPatientSearch={setPatientSearch}
        />
      )}

      {activeFeature === "accounts" && (
        <PatientAccountSearch
          loading={loading}
          onResetPassword={resetPatientPassword}
          patientSearch={patientSearch}
          resetPasswords={resetPasswords}
          selectablePatients={patientKeyword ? selectablePatients : []}
          setPatientSearch={setPatientSearch}
          setResetPasswords={setResetPasswords}
        />
      )}

      {activeFeature === "consultations" && (
        <ConsultationRequestList
          consultations={consultations}
          loading={loading}
          onDeleteConsultation={deleteConsultation}
          onUpdateConsultation={updateConsultation}
        />
      )}
    </div>
  );
}

function matchesAppointmentFilters(appointment, appointmentSearch) {
  const keyword = appointmentSearch.trim().toLowerCase();
  const searchableText = [
    appointment.patient?.fullName,
    appointment.patient?.phone,
    appointment.service?.name,
    appointment.dentist?.fullName
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return !keyword || searchableText.includes(keyword);
}

function isLockedScheduleAppointment(appointment) {
  return ["cancelled", "rejected"].includes(appointment.status);
}

function defaultManualSchedule(appointment, rooms) {
  const startAt = appointment.startAt ? new Date(appointment.startAt) : new Date();
  const date = Number.isNaN(startAt.getTime()) ? todayInput() : startAt.toISOString().slice(0, 10);
  const hours = Number.isNaN(startAt.getTime()) ? "08" : String(startAt.getHours()).padStart(2, "0");
  const minutes = Number.isNaN(startAt.getTime()) ? "00" : String(startAt.getMinutes()).padStart(2, "0");
  return {
    date,
    time: `${hours}:${minutes}`,
    roomId: appointment.room?._id || rooms[0]?._id || ""
  };
}

