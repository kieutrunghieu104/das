import { useEffect, useMemo, useState } from "react";
import { ClipboardPenLine, Plus, Search, Trash2 } from "lucide-react";
import StatusBadge from "../StatusBadge.jsx";
import { formatDateTime, todayInput } from "../../utils/format.js";

export default function ClinicalTreatmentForm({
  appointments,
  createForm,
  form,
  onChange,
  onCreateChange,
  onCreateRecord,
  onDeleteRecord,
  onSearch,
  onSearchPhoneChange,
  onSelectRecord,
  onSubmit,
  records = [],
  searchedPatient,
  searchPhone,
  searchResults = [],
  selectedAppointment,
  selectedRecord,
  services = [],
  treatmentVisits = [],
  user
}) {
  const isNurse = user?.role === "nurse";
  const isDentist = user?.role === "dentist";
  const [dentistSearch, setDentistSearch] = useState("");
  const [activeRecordIndex, setActiveRecordIndex] = useState(0);
  const [activeVisit, setActiveVisit] = useState(1);
  const [visitCount, setVisitCount] = useState(5);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const selectedPatientId = selectedAppointment?.patient?._id || selectedAppointment?.patient;
  const selectedAppointmentId = selectedAppointment?._id?.toString?.();
  const dentistRecords = useMemo(() => {
    const keyword = dentistSearch.trim().toLowerCase();
    return records
      .filter((record) => {
        const recordAppointmentId = (record.appointment?._id || record.appointment)?.toString?.();
        if (selectedAppointmentId) return recordAppointmentId === selectedAppointmentId;
        const patientId = record.patient?._id || record.patient;
        const bySelectedAppointment = selectedPatientId ? patientId?.toString?.() === selectedPatientId?.toString?.() : false;
        if (!keyword) return bySelectedAppointment;
        const name = record.patient?.fullName?.toLowerCase?.() || "";
        const phone = record.patient?.phone?.toLowerCase?.() || "";
        const matchesKeyword = name.includes(keyword) || phone.includes(keyword);
        return selectedPatientId ? matchesKeyword && bySelectedAppointment : matchesKeyword;
      })
      .sort((first, second) => new Date(second.treatmentDate || second.updatedAt || 0) - new Date(first.treatmentDate || first.updatedAt || 0));
  }, [dentistSearch, records, selectedPatientId, selectedAppointmentId]);

  const activeRecord = dentistRecords[Math.min(activeRecordIndex, Math.max(dentistRecords.length - 1, 0))];
  const dentistVisits = useMemo(() => normalizeRecordVisits(activeRecord), [activeRecord]);
  const activeDentistVisit = dentistVisits.find((visit) => visit.visitNumber === activeVisit) || dentistVisits[dentistVisits.length - 1];
  const activeNurseVisit = treatmentVisits.find((visit) => visit.visitNumber === Number(form.visitNumber));
  const visibleVisitCount = Math.max(visitCount, treatmentVisits.length + 1, 5);
  const nextAllowedVisit = treatmentVisits.length + 1;
  const displayedSearchResults = selectedRecord
    ? searchResults.filter((record) => record._id === selectedRecord._id)
    : searchResults;

  useEffect(() => {
    setActiveVisit(Number(form.visitNumber || 1));
  }, [form.visitNumber]);

  useEffect(() => {
    if (isDentist && dentistVisits.length) {
      setActiveVisit(dentistVisits[dentistVisits.length - 1].visitNumber);
    }
  }, [activeRecord?._id, dentistVisits.length, isDentist]);

  function addVisitPage() {
    setVisitCount((current) => current + 1);
  }

  function chooseVisit(visitNumber) {
    setActiveVisit(visitNumber);
    onChange("visitNumber", visitNumber);
  }

  return (
    <section className="panel clinical-treatment-panel">
      <div className="section-title">
        <ClipboardPenLine size={20} />
        <h2>Hồ sơ điều trị</h2>
      </div>

      {isNurse ? (
        <div className="stack">
          <form
            className="toolbar-row"
            onSubmit={(event) => {
              event.preventDefault();
              onSearch(searchPhone);
            }}
          >
            <label className="field inline-field">
              <span>Tìm theo SĐT</span>
              <div className="input-with-icon">
                <Search size={17} />
                <input
                  value={searchPhone}
                  onChange={(event) => onSearchPhoneChange(event.target.value)}
                  placeholder="Nhập số điện thoại bệnh nhân"
                />
              </div>
            </label>
            <button className="button small secondary" type="submit">
              Tìm hồ sơ
            </button>
            <button className="button small primary" type="button" onClick={() => setShowCreateForm((current) => !current)}>
              <Plus size={16} />
              Tạo hồ sơ điều trị
            </button>
          </form>

          {showCreateForm && (
            <form className="form-grid clinical-create-record-form" onSubmit={onCreateRecord}>
              <label className="field">
                <span>Số điện thoại</span>
                <input value={createForm.phone} onChange={(event) => onCreateChange("phone", event.target.value)} required />
              </label>
              <label className="field">
                <span>Dịch vụ</span>
                <select value={createForm.serviceId} onChange={(event) => onCreateChange("serviceId", event.target.value)} required>
                  <option value="">Chọn dịch vụ</option>
                  {services.map((service) => (
                    <option key={service._id} value={service._id}>{service.name}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Ngày</span>
                <input type="date" min={todayInput()} value={createForm.treatmentDate} onChange={(event) => onCreateChange("treatmentDate", event.target.value)} required />
              </label>
              <div className="row-actions">
                <button className="button primary" type="submit">Tạo hồ sơ</button>
              </div>
            </form>
          )}

          {searchedPatient && (
            <div className="clinical-selected-card wide">
              <strong>{patientLabel(searchedPatient)}</strong>
              <span>{searchResults.length ? `${searchResults.length} hồ sơ điều trị` : "Chưa có hồ sơ điều trị"}</span>
            </div>
          )}

          {displayedSearchResults.length ? (
            <div className="mini-list treatment-record-list">
              {displayedSearchResults.map((record) => (
                <div className={`mini-row ${selectedRecord?._id === record._id ? "active" : ""}`} key={record._id}>
                  <div>
                    <strong>{record.serviceSnapshot?.name || record.appointment?.service?.name || "Hồ sơ điều trị"}</strong>
                    <span>{patientLabel(record.patient)} - {formatDateTime(record.treatmentDate || record.createdAt)}</span>
                  </div>
                  <div className="row-actions">
                    <StatusBadge value={record.status || "active"} />
                    <button className="button small secondary" type="button" onClick={() => onSelectRecord(record)}>
                      Cập nhật
                    </button>
                    {selectedRecord?._id === record._id && (
                      <button className="button small danger" type="button" onClick={() => onDeleteRecord(record)} title="Xóa hồ sơ điều trị">
                        <Trash2 size={15} />
                        Xóa
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : searchedPatient ? (
            <div className="empty-state">
              <strong>Không có hồ sơ điều trị</strong>
              <span>Bệnh nhân này chưa có hồ sơ. Bấm tạo hồ sơ điều trị để bắt đầu lần 1.</span>
            </div>
          ) : null}

          {selectedRecord ? (
            <TreatmentEditor
              activeVisit={activeNurseVisit}
              addVisitPage={addVisitPage}
              form={form}
              isDentist={false}
              nextAllowedVisit={nextAllowedVisit}
              onChange={onChange}
              onSubmit={onSubmit}
              treatmentVisits={treatmentVisits}
              visibleVisitCount={visibleVisitCount}
              chooseVisit={chooseVisit}
            />
          ) : (
            <div className="empty-state">
              <strong>Chọn hồ sơ điều trị</strong>
              <span>Tìm theo số điện thoại rồi bấm cập nhật ở hồ sơ cần chỉnh.</span>
            </div>
          )}
        </div>
      ) : (
        <form className="stack" onSubmit={onSubmit}>
          <label className="field">
            <span>Lịch khám</span>
            <select value={form.appointmentId} onChange={(event) => onChange("appointmentId", event.target.value)}>
              <option value="">Chọn lịch khám</option>
              {appointments.map((appointment) => (
                <option key={appointment._id} value={appointment._id}>
                  {patientLabel(appointment.patient)} - {appointment.service?.name || "Dịch vụ"} - {formatDateTime(appointment.startAt)}
                </option>
              ))}
            </select>
          </label>

          {selectedAppointment && (
            <div className="clinical-selected-card">
              <strong>{patientLabel(selectedAppointment.patient)}</strong>
              <span>{selectedAppointment.service?.name} / {selectedAppointment.room?.name}</span>
              <StatusBadge value={selectedAppointment.status} />
            </div>
          )}

          {isDentist && (
            <DentistRecordBrowser
              activeDentistVisit={activeDentistVisit}
              activeRecord={activeRecord}
              activeRecordIndex={activeRecordIndex}
              activeVisit={activeVisit}
              dentistRecords={dentistRecords}
              dentistSearch={dentistSearch}
              dentistVisits={dentistVisits}
              selectedPatientId={selectedPatientId}
              setActiveRecordIndex={setActiveRecordIndex}
              setActiveVisit={setActiveVisit}
              setDentistSearch={setDentistSearch}
            />
          )}
        </form>
      )}
    </section>
  );
}

function TreatmentEditor({
  activeVisit,
  addVisitPage,
  chooseVisit,
  form,
  isDentist,
  nextAllowedVisit,
  onChange,
  onSubmit,
  visibleVisitCount
}) {
  return (
    <form className="stack" onSubmit={onSubmit}>
      <div className="form-grid">
        <div className="treatment-page-tabs wide">
          {Array.from({ length: visibleVisitCount }, (_, index) => {
            const visitNumber = index + 1;
            const disabled = visitNumber > nextAllowedVisit;
            return (
              <button
                className={Number(form.visitNumber) === visitNumber ? "active" : ""}
                disabled={disabled}
                key={visitNumber}
                onClick={() => chooseVisit(visitNumber)}
                title={disabled ? `Cần cập nhật lần ${nextAllowedVisit} trước` : undefined}
                type="button"
              >
                Lần {visitNumber}
              </button>
            );
          })}
          <button className="add-page" onClick={addVisitPage} type="button">
            +
          </button>
        </div>
        <div className="clinical-selected-card wide">
          <strong>Lần {form.visitNumber}</strong>
          <span>{activeVisit?.updatedAt ? `Cập nhật: ${formatDateTime(activeVisit.updatedAt)}` : "Chưa cập nhật"}</span>
        </div>
        <label className="field">
          <span>Ngày điều trị</span>
          <input type="date" disabled={isDentist} value={form.visitDate} onChange={(event) => onChange("visitDate", event.target.value)} />
        </label>
        <label className="field">
          <span>Huyết áp</span>
          <input disabled={isDentist} value={form.bloodPressure} onChange={(event) => onChange("bloodPressure", event.target.value)} />
        </label>
        <label className="field">
          <span>Nhịp tim</span>
          <input disabled={isDentist} value={form.heartRate} onChange={(event) => onChange("heartRate", event.target.value)} />
        </label>
        <label className="field">
          <span>SpO2</span>
          <input disabled={isDentist} value={form.spo2} onChange={(event) => onChange("spo2", event.target.value)} />
        </label>
        <label className="field">
          <span>Nhiệt độ</span>
          <input disabled={isDentist} value={form.temperature} onChange={(event) => onChange("temperature", event.target.value)} />
        </label>
        <label className="field">
          <span>Nhịp thở</span>
          <input disabled={isDentist} value={form.respiratoryRate} onChange={(event) => onChange("respiratoryRate", event.target.value)} />
        </label>
        <label className="field wide">
          <span>Tiền sử bệnh án</span>
          <textarea disabled={isDentist} value={form.medicalHistory || ""} onChange={(event) => onChange("medicalHistory", event.target.value)} rows="3" />
        </label>
        <label className="field wide">
          <span>Chẩn đoán</span>
          <textarea disabled={isDentist} value={form.diagnosis} onChange={(event) => onChange("diagnosis", event.target.value)} rows="3" />
        </label>
        <label className="field wide">
          <span>Điều trị đã thực hiện</span>
          <textarea disabled={isDentist} value={form.treatmentResult} onChange={(event) => onChange("treatmentResult", event.target.value)} rows="3" />
        </label>
        <label className="field wide">
          <span>Đơn thuốc</span>
          <textarea disabled={isDentist} value={form.prescription} onChange={(event) => onChange("prescription", event.target.value)} rows="3" />
        </label>
        <label className="field wide">
          <span>Điều trị dự kiến</span>
          <textarea disabled={isDentist} value={form.treatmentPlan} onChange={(event) => onChange("treatmentPlan", event.target.value)} rows="3" />
        </label>
        <label className="field wide">
          <span>Hướng dẫn sau điều trị</span>
          <textarea disabled={isDentist} value={form.aftercareInstructions} onChange={(event) => onChange("aftercareInstructions", event.target.value)} rows="3" />
        </label>
        <label className="field wide">
          <span>Ghi chú điều trị</span>
          <textarea disabled={isDentist} value={form.treatmentNote} onChange={(event) => onChange("treatmentNote", event.target.value)} rows="3" />
        </label>
      </div>
      {!isDentist && (
        <div className="row-actions clinical-treatment-actions">
          <button className="button primary">Lưu hồ sơ điều trị</button>
        </div>
      )}
    </form>
  );
}

function DentistRecordBrowser({
  activeDentistVisit,
  activeRecord,
  activeRecordIndex,
  activeVisit,
  dentistRecords,
  dentistSearch,
  dentistVisits,
  selectedPatientId,
  setActiveRecordIndex,
  setActiveVisit,
  setDentistSearch
}) {
  return (
    <div className="clinical-record-browser">
      <label className="field">
        <span>Tìm hồ sơ theo tên hoặc SĐT</span>
        <input
          value={dentistSearch}
          onChange={(event) => {
            setDentistSearch(event.target.value);
            setActiveRecordIndex(0);
          }}
          placeholder="Nhập tên hoặc số điện thoại bệnh nhân"
        />
      </label>
      {dentistRecords.length ? (
        <>
          {!selectedPatientId && dentistRecords.length > 1 && (
            <div className="treatment-page-tabs">
              {dentistRecords.map((record, index) => (
                <button
                  className={index === Math.min(activeRecordIndex, dentistRecords.length - 1) ? "active" : ""}
                  key={record._id || index}
                  onClick={() => {
                    setActiveRecordIndex(index);
                    setActiveVisit(1);
                  }}
                  type="button"
                >
                  {record.patient?.fullName || "Bệnh nhân"}
                </button>
              ))}
            </div>
          )}
          {dentistVisits.length ? (
            <div className="treatment-page-tabs">
              {dentistVisits.map((visit) => (
                <button
                  className={visit.visitNumber === activeVisit ? "active" : ""}
                  key={`${activeRecord?._id}-visit-${visit.visitNumber}`}
                  onClick={() => setActiveVisit(visit.visitNumber)}
                  type="button"
                >
                  Lần {visit.visitNumber}
                </button>
              ))}
            </div>
          ) : null}
          <div className="readonly-record-grid">
            <div className="clinical-selected-card wide">
              <strong>{patientLabel(activeRecord.patient)}</strong>
              <span>Cập nhật: {formatDateTime(activeDentistVisit?.updatedAt || activeRecord.updatedAt)}</span>
            </div>
            <ReadOnlyField label="Ngày điều trị" value={formatDateTime(activeDentistVisit?.visitDate || activeRecord.treatmentDate)} />
            <ReadOnlyField label="Huyết áp" value={activeDentistVisit?.vitalSigns?.bloodPressure} />
            <ReadOnlyField label="Nhịp tim" value={activeDentistVisit?.vitalSigns?.heartRate} />
            <ReadOnlyField label="SpO2" value={activeDentistVisit?.vitalSigns?.spo2} />
            <ReadOnlyField label="Nhiệt độ" value={activeDentistVisit?.vitalSigns?.temperature} />
            <ReadOnlyField label="Nhịp thở" value={activeDentistVisit?.vitalSigns?.respiratoryRate} />
            <ReadOnlyField label="Tiền sử bệnh án" value={activeDentistVisit?.medicalHistory} wide />
            <ReadOnlyField label="Chẩn đoán" value={activeDentistVisit?.diagnosis} wide />
            <ReadOnlyField label="Điều trị đã thực hiện" value={activeDentistVisit?.treatmentResult} wide />
            <ReadOnlyField label="Đơn thuốc" value={activeDentistVisit?.prescription} wide />
            <ReadOnlyField label="Điều trị dự kiến" value={activeDentistVisit?.treatmentPlan} wide />
            <ReadOnlyField label="Hướng dẫn sau điều trị" value={activeDentistVisit?.aftercareInstructions} wide />
            <ReadOnlyField label="Ghi chú điều trị" value={activeDentistVisit?.treatmentNote} wide />
          </div>
        </>
      ) : (
        <div className="empty-state">
          <strong>Không có hồ sơ điều trị</strong>
          <span>Không tìm thấy hồ sơ điều trị phù hợp với bệnh nhân hoặc từ khóa hiện tại.</span>
        </div>
      )}
    </div>
  );
}

function ReadOnlyField({ label, value, wide = false }) {
  return (
    <div className={`readonly-record-field ${wide ? "wide" : ""}`}>
      <span>{label}</span>
      <strong>{value || "Chưa cập nhật"}</strong>
    </div>
  );
}

function patientLabel(patient) {
  return [patient?.fullName || "Bệnh nhân", patient?.phone].filter(Boolean).join(" - ");
}

function normalizeRecordVisits(record) {
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
        updatedAt: record.updatedAt || record.treatmentDate,
        visitDate: record.treatmentDate || record.updatedAt
      }]
    : [];
}
