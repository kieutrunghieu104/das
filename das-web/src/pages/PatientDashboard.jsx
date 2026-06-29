import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Feedback from "../components/Feedback.jsx";
import PatientAppointmentList from "../components/patient/PatientAppointmentList.jsx";
import PatientInvoiceList from "../components/patient/PatientInvoiceList.jsx";
import PatientTreatmentRecords from "../components/patient/PatientTreatmentRecords.jsx";
import { api, getErrorMessage } from "../utils/api.js";
import { clinicDateInput, getAppointmentSlot } from "../utils/appointmentSlots.js";
import { formatMoney, todayInput } from "../utils/format.js";
import { usePublicBootstrap } from "../utils/usePublicBootstrap.js";
import BookingPage, { bookingSlotOptions, maxBookingDate, toClinicIso } from "./BookingPage.jsx";

const lockedPatientStatuses = new Set(["cancelled", "rejected", "completed", "no_show"]);
const patientFeatures = new Set(["home", "booking", "appointments", "history", "invoices", "records"]);

export default function PatientDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeFeature, setActiveFeature] = useState("home");
  const [appointments, setAppointments] = useState([]);
  const [appointmentHistory, setAppointmentHistory] = useState([]);
  const [records, setRecords] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewForms, setReviewForms] = useState({});
  const [rescheduleForms, setRescheduleForms] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const { services, dentists, rooms } = usePublicBootstrap();

  const dentistOptions = useMemo(() => {
    const roomDentists = rooms.map((room) => room.assignedDentist).filter(Boolean);
    return Array.from(new Map([...roomDentists, ...dentists].map((dentist) => [dentist._id, dentist])).values());
  }, [dentists, rooms]);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get("/patient/dashboard");
      setAppointments(res.data.appointments || []);
      setAppointmentHistory(res.data.appointmentHistory || []);
      setRecords(res.data.records || []);
      setInvoices(res.data.invoices || []);
      const loadedReviews = res.data.reviews || [];
      setReviews(loadedReviews);
      setReviewForms((current) => {
        const next = { ...current };
        loadedReviews.forEach((review) => {
          const appointmentId = review.appointment?._id || review.appointment;
          if (!appointmentId) return;
          next[appointmentId] = {
            rating: Number(review.rating || 5),
            comment: review.comment || ""
          };
        });
        return next;
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    load();
  }, [activeFeature]);

  useEffect(() => {
    const tab = new URLSearchParams(location.search).get("tab") || "home";
    const nextFeature = patientFeatures.has(tab) ? tab : "home";
    setActiveFeature(nextFeature);

    if (nextFeature === "home" && (tab === "services" || location.hash === "#services")) {
      const scrollToServices = () => {
        const target = document.getElementById("services");
        if (!target) return;

        let scrollContainer = target.parentElement;
        while (scrollContainer && scrollContainer !== document.body) {
          const overflowY = window.getComputedStyle(scrollContainer).overflowY;
          if (/(auto|scroll|overlay)/.test(overflowY) && scrollContainer.scrollHeight > scrollContainer.clientHeight) break;
          scrollContainer = scrollContainer.parentElement;
        }

        if (!scrollContainer || scrollContainer === document.body) {
          const offsetTop = target.getBoundingClientRect().top + window.scrollY - 92;
          window.scrollTo({ top: Math.max(0, offsetTop), behavior: "smooth" });
          return;
        }

        const containerTop = scrollContainer.getBoundingClientRect().top;
        const offsetTop = target.getBoundingClientRect().top - containerTop + scrollContainer.scrollTop - 92;
        scrollContainer.scrollTo({ top: Math.max(0, offsetTop), behavior: "smooth" });
      };

      const firstTimer = window.setTimeout(scrollToServices, 100);
      const secondTimer = window.setTimeout(scrollToServices, 420);
      return () => {
        window.clearTimeout(firstTimer);
        window.clearTimeout(secondTimer);
      };
    }

    if (nextFeature === "home") {
      const timer = window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
      return () => window.clearTimeout(timer);
    }
  }, [location.hash, location.search]);

  function updateReviewForm(appointmentId, values) {
    setReviewForms((current) => ({
      ...current,
      [appointmentId]: {
        rating: 5,
        comment: "",
        ...(current[appointmentId] || {}),
        ...values
      }
    }));
  }

  function openPatientFeature(featureId) {
    setActiveFeature(featureId);
    navigate(`/dashboard?tab=${featureId}`, { replace: false });
  }

  function scrollToPatientServices() {
    setActiveFeature("home");
    navigate("/dashboard?tab=home#services", { replace: false });
    window.setTimeout(() => document.getElementById("services")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  }

  function updateRescheduleForm(appointment, values) {
    setRescheduleForms((current) => ({
      ...current,
      [appointment._id]: {
        date: clinicDateInput(appointment.startAt) || todayInput(),
        time: getAppointmentSlot(appointment.startAt)?.value || bookingSlotOptions[0].value,
        dentistId: appointment.dentist?._id || dentistOptions[0]?._id || "",
        ...(current[appointment._id] || {}),
        ...values
      }
    }));
  }

  async function submitReview(event, appointmentId) {
    event.preventDefault();
    const review = reviewForms[appointmentId] || { rating: 5, comment: "" };
    if (!window.confirm("Xác nhận gửi đánh giá cho lịch hẹn này?")) return;

    try {
      await api.post("/patient/reviews", { ...review, appointmentId });
      setMessage("Đã gửi đánh giá.");
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function cancelAppointment(appointment, reason) {
    if (!canModifyAppointment(appointment)) {
      setError("Lịch hẹn này không thể thay đổi thêm.");
      return;
    }
    if (!reason?.trim()) {
      setError("Chọn hoặc nhập lý do hủy lịch.");
      return;
    }

    try {
      await api.patch(`/appointments/${appointment._id}/cancel`, { reason });
      setMessage("Đã hủy lịch hẹn.");
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function rescheduleAppointment(appointment) {
    if (!canModifyAppointment(appointment)) {
      setError("Lịch hẹn này không thể đổi lịch.");
      return false;
    }

    const form = rescheduleForms[appointment._id] || {};
    if (!form.date || !form.time || !form.dentistId) {
      setError("Chọn ngày, giờ và bác sĩ trước khi đổi lịch.");
      return false;
    }
    if (form.date > maxBookingDate()) {
      setError("Bạn chỉ được đổi lịch trước tối đa 1 tháng.");
      return false;
    }

    const wantsReceptionArrangement = form.dentistId === "reception";
    const room = wantsReceptionArrangement ? null : rooms.find((item) => item.assignedDentist?._id === form.dentistId) || rooms.find((item) => item.assignedDentist);
    if (!wantsReceptionArrangement && !room) {
      setError("Chưa có phòng khám được gán bác sĩ. Vui lòng liên hệ lễ tân.");
      return false;
    }

    const slot = bookingSlotOptions.find((option) => option.value === form.time);
    if (!window.confirm(`Xác nhận đổi lịch sang ${form.date}, ${slot?.label || form.time}?`)) return false;

    try {
      await api.patch(`/appointments/${appointment._id}/reschedule`, {
        serviceId: appointment.service?._id,
        date: form.date,
        startAt: toClinicIso(form.date, form.time),
        roomId: room?._id
      });
      setMessage("Đã đổi lịch hẹn.");
      setRescheduleForms((current) => {
        const next = { ...current };
        delete next[appointment._id];
        return next;
      });
      load();
      return true;
    } catch (err) {
      setError(getErrorMessage(err));
      return false;
    }
  }

  const reviewByAppointment = new Map(
    reviews
      .map((review) => [review.appointment?._id || review.appointment, review])
      .filter(([appointmentId]) => appointmentId)
  );

  return (
    <div className="patient-dashboard-shell">
      <Feedback error={error} message={message} onClear={() => { setError(""); setMessage(""); }} />

      <main className="patient-dashboard-content">
        {activeFeature === "home" && (
          <>
            <PatientHome onNavigate={openPatientFeature} onServices={scrollToPatientServices} />
            <PatientServices services={services} />
          </>
        )}

        {activeFeature === "booking" && <BookingPage embedded />}

        {activeFeature === "appointments" && (
          <PatientAppointmentList
            appointments={appointments}
            appointmentHistory={appointmentHistory}
            canModifyAppointment={canModifyAppointment}
            cancelAppointment={cancelAppointment}
            dentistOptions={dentistOptions}
            loading={loading}
            rescheduleAppointment={rescheduleAppointment}
            rescheduleForms={rescheduleForms}
            updateRescheduleForm={updateRescheduleForm}
          />
        )}

        {activeFeature === "history" && (
          <PatientAppointmentList
            appointments={appointments}
            appointmentHistory={appointmentHistory}
            canModifyAppointment={canModifyAppointment}
            cancelAppointment={cancelAppointment}
            dentistOptions={dentistOptions}
            historyOnly
            loading={loading}
            rescheduleAppointment={rescheduleAppointment}
            rescheduleForms={rescheduleForms}
            updateRescheduleForm={updateRescheduleForm}
          />
        )}

        {activeFeature === "invoices" && (
          <PatientInvoiceList
            invoices={invoices}
            loading={loading}
            reviewByAppointment={reviewByAppointment}
            reviewForms={reviewForms}
            submitReview={submitReview}
            updateReviewForm={updateReviewForm}
          />
        )}

        {activeFeature === "records" && <PatientTreatmentRecords loading={loading} records={records} />}
      </main>
    </div>
  );
}

function PatientHome({ onNavigate, onServices }) {
  return (
    <section className="patient-dark-hero" id="home">
      <div className="patient-dark-hero-copy">
        <h1>Chăm sóc nụ cười của bạn</h1>
        <div className="patient-home-actions">
          <button className="button primary" type="button" onClick={() => onNavigate("booking")}>
            Đặt lịch
          </button>
          <button className="button secondary" type="button" onClick={() => onNavigate("appointments")}>
            Xem lịch
          </button>
          <button className="button ghost" type="button" onClick={onServices}>
            Xem dịch vụ
          </button>
        </div>
      </div>
    </section>
  );
}

function PatientServices({ services }) {
  return (
    <section className="patient-dark-section patient-services-page" id="services">
      <div className="patient-section-heading">
        <h2>Dịch vụ SmileCare</h2>
      </div>
      <div className="patient-dark-service-grid">
        {services.map((service, index) => (
          <article className={`patient-dark-service-card service-tone-${index % 5}`} key={service._id}>
            <span className="patient-service-badge">{String(index + 1).padStart(2, "0")}</span>
            <div>
              <h3>{service.name}</h3>
              <strong>{formatMoney(Number(service.price || 0))}</strong>
              <p>{service.description || "Thông tin dịch vụ đang được cập nhật."}</p>
            </div>
          </article>
        ))}
        {!services.length && <p className="muted">Chưa có dịch vụ đang hoạt động.</p>}
      </div>
    </section>
  );
}

function canModifyAppointment(appointment) {
  return !lockedPatientStatuses.has(appointment.status) && new Date(appointment.startAt) > new Date();
}
