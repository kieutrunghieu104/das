import { ClipboardPenLine, ReceiptText, Stethoscope } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ClinicalTreatmentForm from "../components/clinical/ClinicalTreatmentForm.jsx";
import ClinicalWorkSchedule from "../components/clinical/ClinicalWorkSchedule.jsx";
import ClinicalPerformedServices from "../components/clinical/nurse/ClinicalPerformedServices.jsx";
import Feedback from "../components/Feedback.jsx";
import { useAuth } from "../redux/AuthContext.jsx";
import { bookingSlotOptions, compareQueueWithinSlot, getAppointmentSlot } from "../utils/appointmentSlots.js";
import { api, getErrorMessage } from "../utils/api.js";
import { todayInput } from "../utils/format.js";

function getClinicalFeatures(role) {
  return [
    { id: "schedule", label: "Lịch khám", icon: Stethoscope },
    { id: "treatment", label: "Hồ sơ điều trị", icon: ClipboardPenLine },
    ...(role === "nurse" ? [{ id: "performedServices", label: "Dịch vụ đã làm", icon: ReceiptText }] : [])
  ];
}

const defaultRecordForm = {
  appointmentId: "",
  visitNumber: 1,
  bloodPressure: "",
  heartRate: "",
  spo2: "",
  temperature: "",
  respiratoryRate: "",
  diagnosis: "",
  medicalHistory: "",
  treatmentResult: "",
  treatmentNote: "",
  treatmentPlan: "",
  prescription: "",
  aftercareInstructions: "",
  estimatedCost: ""
};

const defaultPerformedServicesForm = {
  appointmentId: "",
  services: {},
  extraCosts: []
};

export default function ClinicalDashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const clinicalFeatures = useMemo(() => getClinicalFeatures(user?.role), [user?.role]);
  const [activeFeature, setActiveFeature] = useState("schedule");
  const [date, setDate] = useState(todayInput());
  const [appointments, setAppointments] = useState([]);
  const [records, setRecords] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [services, setServices] = useState([]);
  const [staffSchedules, setStaffSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recordForm, setRecordForm] = useState(defaultRecordForm);
  const [performedServicesForm, setPerformedServicesForm] = useState(defaultPerformedServicesForm);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await api.get("/clinical/dashboard", { params: { date } });
      const nextAppointments = res.data.appointments || [];
      const nextRooms = res.data.rooms || [];
      const nextServices = res.data.services || [];

      setAppointments(nextAppointments);
      setRecords(res.data.records || []);
      setRooms(nextRooms);
      setServices(nextServices);
      setStaffSchedules(res.data.staffSchedules || []);
      setRecordForm((current) => ({
        ...current,
        appointmentId: nextAppointments.some((appointment) => appointment._id === current.appointmentId)
          ? current.appointmentId
          : ""
      }));
      setPerformedServicesForm((current) => ({
        ...current,
        appointmentId: nextAppointments.some((appointment) => appointment._id === current.appointmentId)
          ? current.appointmentId
          : ""
      }));
      window.dispatchEvent(new Event("das:refresh-badges"));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [date]);

  useEffect(() => {
    load();
  }, [activeFeature]);

  useEffect(() => {
    const tab = new URLSearchParams(location.search).get("tab");
    if (tab && clinicalFeatures.some((item) => item.id === tab)) {
      setActiveFeature(tab);
    } else if (!clinicalFeatures.some((item) => item.id === activeFeature)) {
      setActiveFeature("schedule");
    }
  }, [activeFeature, clinicalFeatures, location.search]);

  const clinicalColumns = useMemo(() => buildClinicalColumns(appointments, rooms), [appointments, rooms]);
  const clinicalRows = useMemo(() => buildClinicalRows(appointments, clinicalColumns), [appointments, clinicalColumns]);
  const selectedAppointment = appointments.find((appointment) => appointment._id === recordForm.appointmentId);
  const selectedTreatmentRecords = useMemo(() => getPatientTreatmentRecords(records, selectedAppointment), [records, selectedAppointment]);
  const selectedTreatmentRecord = selectedTreatmentRecords[0] || null;
  const selectedTreatmentVisits = useMemo(() => normalizeTreatmentVisits(selectedTreatmentRecord), [selectedTreatmentRecord]);
  const selectedPerformedAppointment = appointments.find((appointment) => appointment._id === performedServicesForm.appointmentId);

  function updateRecord(field, value) {
    if (field === "appointmentId") {
      const appointment = appointments.find((item) => item._id === value);
      if (appointment) {
        selectTreatmentAppointment(appointment);
        return;
      }
    }
    if (field === "visitNumber") {
      selectTreatmentVisit(Number(value));
      return;
    }
    setRecordForm((current) => ({ ...current, [field]: value }));
  }

  function updatePerformedServices(field, value) {
    if (field === "appointmentId") {
      const appointment = appointments.find((item) => item._id === value);
      if (appointment) {
        setPerformedServicesFromAppointment(appointment);
        return;
      }
    }
    setPerformedServicesForm((current) => ({ ...current, [field]: value }));
  }

  function openFeature(featureId) {
    setActiveFeature(featureId);
    navigate(`/dashboard?tab=${featureId}`, { replace: true });
  }

  function selectTreatmentAppointment(appointment) {
    const matchingRecords = getPatientTreatmentRecords(records, appointment);
    const latestRecord = matchingRecords[0] || null;
    const visits = normalizeTreatmentVisits(latestRecord);
    const visitNumber = visits.length ? visits[visits.length - 1].visitNumber : 1;
    setRecordForm((current) => ({
      ...current,
      appointmentId: appointment._id,
      ...recordValuesFromVisit(visits.find((visit) => visit.visitNumber === visitNumber), visitNumber)
    }));
    if (user?.role === "dentist" && !matchingRecords.length) {
      setMessage("");
      setError("Không có hồ sơ điều trị của bệnh nhân này.");
    } else {
      setError("");
    }
    openFeature("treatment");
  }

  function selectTreatmentVisit(visitNumber) {
    if (!selectedAppointment) return;
    const visits = selectedTreatmentVisits;
    if (visitNumber > visits.length + 1) {
      setError(`Cần cập nhật lần ${visits.length + 1} trước khi cập nhật lần ${visitNumber}.`);
      return;
    }
    setError("");
    setRecordForm((current) => ({
      ...current,
      ...recordValuesFromVisit(visits.find((visit) => visit.visitNumber === visitNumber), visitNumber)
    }));
  }

  function selectPerformedServicesAppointment(appointment) {
    setPerformedServicesFromAppointment(appointment);
    openFeature("performedServices");
  }

  function setPerformedServicesFromAppointment(appointment) {
    const serviceState = {};
    (appointment.performedServices || []).forEach((item) => {
      const serviceId = item.service?._id || item.service;
      if (serviceId) {
        serviceState[serviceId] = {
          selected: true,
          name: item.name,
          amount: item.amount
        };
      }
    });
    setPerformedServicesForm({
      appointmentId: appointment._id,
      services: serviceState,
      extraCosts: appointment.extraCosts || []
    });
  }

  function togglePerformedService(service, selected, amount = null) {
    setPerformedServicesForm((current) => ({
      ...current,
      services: {
        ...current.services,
        [service._id]: {
          selected,
          name: service.name,
          amount: amount ?? current.services[service._id]?.amount ?? service.price ?? 0
        }
      }
    }));
  }

  function addExtraCost() {
    setPerformedServicesForm((current) => ({
      ...current,
      extraCosts: [...current.extraCosts, { name: "", amount: "" }]
    }));
  }

  function updateExtraCost(index, field, value) {
    setPerformedServicesForm((current) => ({
      ...current,
      extraCosts: current.extraCosts.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item))
    }));
  }

  function removeExtraCost(index) {
    setPerformedServicesForm((current) => ({
      ...current,
      extraCosts: current.extraCosts.filter((_, itemIndex) => itemIndex !== index)
    }));
  }

  async function submitRecord(event) {
    event.preventDefault();
    if (!recordForm.appointmentId) {
      setError("Chọn lịch khám trước khi lưu điều trị.");
      return;
    }

    try {
      setError("");
      setMessage("");
      const payload = user?.role === "nurse"
        ? {
            vitalSigns: {
              bloodPressure: recordForm.bloodPressure,
              heartRate: recordForm.heartRate,
              spo2: recordForm.spo2,
              temperature: recordForm.temperature,
              respiratoryRate: recordForm.respiratoryRate
            },
            treatmentNote: recordForm.treatmentNote,
            visitNumber: recordForm.visitNumber,
            diagnosis: recordForm.diagnosis,
            medicalHistory: recordForm.medicalHistory,
            treatmentResult: recordForm.treatmentResult,
            treatmentPlan: recordForm.treatmentPlan,
            prescription: recordForm.prescription,
            aftercareInstructions: recordForm.aftercareInstructions
          }
        : {
            diagnosis: recordForm.diagnosis,
            medicalHistory: recordForm.medicalHistory,
            visitNumber: recordForm.visitNumber,
            treatmentResult: recordForm.treatmentResult,
            treatmentNote: recordForm.treatmentNote,
            treatmentPlan: recordForm.treatmentPlan,
            prescription: recordForm.prescription,
            aftercareInstructions: recordForm.aftercareInstructions,
            estimatedCost: Number(recordForm.estimatedCost || 0)
          };
      await api.put(`/clinical/appointments/${recordForm.appointmentId}/treatment-record`, payload);
      setMessage(user?.role === "nurse" ? "Đã lưu thông tin chung." : "Đã lưu thông tin điều trị.");
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function submitPerformedServices(event) {
    event.preventDefault();
    if (!performedServicesForm.appointmentId) {
      setError("Chọn lịch khám trước khi xác nhận dịch vụ.");
      return;
    }

    const selectedServices = Object.entries(performedServicesForm.services)
      .filter(([, item]) => item.selected)
      .map(([serviceId, item]) => ({
        serviceId,
        name: item.name,
        amount: Number(item.amount || 0)
      }));
    const extraCosts = performedServicesForm.extraCosts
      .filter((item) => item.name || Number(item.amount || 0) > 0)
      .map((item) => ({
        name: item.name || "Chi phí khác",
        amount: Number(item.amount || 0)
      }));

    if (!selectedServices.length && !extraCosts.length) {
      setError("Chọn ít nhất một dịch vụ hoặc chi phí khác.");
      return;
    }

    try {
      setError("");
      setMessage("");
      await api.put(`/clinical/appointments/${performedServicesForm.appointmentId}/performed-services`, {
        services: selectedServices.length ? selectedServices : extraCosts,
        extraCosts: selectedServices.length ? extraCosts : []
      });
      const appointment = appointments.find((item) => item._id === performedServicesForm.appointmentId);
      if (appointment && ["checked_in", "in_treatment"].includes(appointment.status)) {
        await api.patch(`/appointments/${performedServicesForm.appointmentId}/status`, {
          status: "completed",
          note: "Y tá đã hoàn tất lịch khám và xác nhận dịch vụ đã thực hiện."
        });
      }
      setMessage("Đã hoàn tất lịch khám và gửi dịch vụ đã thực hiện về phần hóa đơn của lễ tân.");
      openFeature("schedule");
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function setRoomStatus(roomId, status) {
    try {
      setError("");
      setMessage("");
      await api.patch(`/clinical/rooms/${roomId}/status`, { status });
      setMessage("Đã cập nhật trạng thái phòng khám.");
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function updateClinicalAppointmentStatus(appointment, status) {
    if (status === "completed") {
      selectPerformedServicesAppointment(appointment);
      setMessage("Kiểm tra dịch vụ đã thực hiện và xác nhận tổng tiền để hoàn tất lịch khám.");
      return;
    }

    if (!window.confirm(status === "in_treatment" ? "Chuyển bệnh nhân sang trạng thái đang khám?" : "Xác nhận hoàn tất lịch khám?")) return;

    try {
      setError("");
      setMessage("");
      await api.patch(`/appointments/${appointment._id}/status`, {
        status,
        note: "Y tá cập nhật trạng thái lịch khám."
      });
      setMessage(status === "in_treatment" ? "Đã chuyển lịch sang đang khám." : "Đã hoàn tất lịch khám.");
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <div className="page-grid clinical-dashboard">
      <Feedback error={error} message={message} />

      {activeFeature === "schedule" && (
        <ClinicalWorkSchedule
          appointments={appointments}
          canEditAppointment={canEditAppointment}
          clinicalColumns={clinicalColumns}
          clinicalRows={clinicalRows}
          date={date}
          isLockedAppointment={isLockedAppointment}
          loading={loading}
          onDateChange={setDate}
          onUpdateStatus={updateClinicalAppointmentStatus}
          onSetRoomStatus={setRoomStatus}
          onSelectTreatment={selectTreatmentAppointment}
          onSelectPerformedServices={selectPerformedServicesAppointment}
          rooms={rooms}
          staffSchedules={staffSchedules}
          user={user}
        />
      )}

      {activeFeature === "treatment" && (
        <ClinicalTreatmentForm
          appointments={appointments}
          form={recordForm}
          onChange={updateRecord}
          onSubmit={submitRecord}
          records={records}
          selectedAppointment={selectedAppointment}
          treatmentVisits={selectedTreatmentVisits}
          user={user}
        />
      )}

      {activeFeature === "performedServices" && user?.role === "nurse" && (
        <ClinicalPerformedServices
          appointments={appointments}
          form={performedServicesForm}
          onAddExtraCost={addExtraCost}
          onChange={updatePerformedServices}
          onExtraCostChange={updateExtraCost}
          onRemoveExtraCost={removeExtraCost}
          onSubmit={submitPerformedServices}
          onToggleService={togglePerformedService}
          selectedAppointment={selectedPerformedAppointment}
          services={services}
        />
      )}
    </div>
  );
}

function getPatientTreatmentRecords(records, appointment) {
  if (!appointment) return [];
  const appointmentId = appointment._id?.toString?.();
  const exactRecords = records.filter((record) => {
    const recordAppointmentId = (record.appointment?._id || record.appointment)?.toString?.();
    return recordAppointmentId && appointmentId && recordAppointmentId === appointmentId;
  });
  return exactRecords.sort((first, second) => new Date(second.updatedAt || second.treatmentDate || 0) - new Date(first.updatedAt || first.treatmentDate || 0));
}

function normalizeTreatmentVisits(record) {
  if (!record) return [];
  const visits = Array.isArray(record.visits) ? record.visits.filter(Boolean) : [];
  if (visits.length) {
    return visits
      .map((visit, index) => ({ ...visit, visitNumber: Number(visit.visitNumber || index + 1) }))
      .sort((first, second) => first.visitNumber - second.visitNumber);
  }

  const hasLegacyData = [
    record.vitalSigns,
    record.diagnosis,
    record.medicalHistory,
    record.treatmentResult,
    record.treatmentNote,
    record.treatmentPlan,
    record.prescription,
    record.aftercareInstructions
  ].some(Boolean);
  return hasLegacyData
    ? [{
        visitNumber: 1,
        vitalSigns: record.vitalSigns || {},
        diagnosis: record.diagnosis || "",
        medicalHistory: record.medicalHistory || "",
        treatmentResult: record.treatmentResult || "",
        treatmentNote: record.treatmentNote || "",
        treatmentPlan: record.treatmentPlan || "",
        prescription: record.prescription || "",
        aftercareInstructions: record.aftercareInstructions || "",
        estimatedCost: record.estimatedCost || "",
        updatedAt: record.updatedAt || record.treatmentDate
      }]
    : [];
}

function recordValuesFromVisit(visit, visitNumber) {
  return {
    visitNumber,
    bloodPressure: visit?.vitalSigns?.bloodPressure || "",
    heartRate: visit?.vitalSigns?.heartRate || "",
    spo2: visit?.vitalSigns?.spo2 || "",
    temperature: visit?.vitalSigns?.temperature || "",
    respiratoryRate: visit?.vitalSigns?.respiratoryRate || "",
    diagnosis: visit?.diagnosis || "",
    medicalHistory: visit?.medicalHistory || "",
    treatmentResult: visit?.treatmentResult || "",
    treatmentNote: visit?.treatmentNote || "",
    treatmentPlan: visit?.treatmentPlan || "",
    prescription: visit?.prescription || "",
    aftercareInstructions: visit?.aftercareInstructions || "",
    estimatedCost: visit?.estimatedCost || ""
  };
}

function buildClinicalColumns(appointments, rooms) {
  const columns = new Map();
  rooms.forEach((room) => {
    if (room.assignedDentist?._id && !columns.has(room.assignedDentist._id)) {
      columns.set(room.assignedDentist._id, {
        _id: room.assignedDentist._id,
        fullName: room.assignedDentist.fullName,
        roomName: room.name
      });
    }
  });
  appointments.forEach((appointment) => {
    if (appointment.dentist?._id && !columns.has(appointment.dentist._id)) {
      columns.set(appointment.dentist._id, {
        _id: appointment.dentist._id,
        fullName: appointment.dentist.fullName,
        roomName: appointment.room?.name
      });
    }
  });

  return Array.from(columns.values());
}

function buildClinicalRows(appointments, columns) {
  return bookingSlotOptions.map((slot) => ({
    slotId: slot.slotId,
    slotName: slot.slotName,
    timeLabel: slot.timeLabel,
    cells: columns.map((column) =>
      appointments
        .filter((appointment) => appointment.dentist?._id === column._id && getAppointmentSlot(appointment.startAt).slotId === slot.slotId)
        .sort(compareQueueWithinSlot)
    )
  }));
}

function canEditAppointment(user, appointment) {
  return user?.role === "admin" || appointment.nurse?._id === user?._id || appointment.dentist?._id === user?._id;
}

function isLockedAppointment(appointment) {
  return ["cancelled", "no_show", "rejected"].includes(appointment.status);
}
