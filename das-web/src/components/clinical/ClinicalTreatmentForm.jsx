import { useState } from "react";
import { ClipboardPenLine, Plus, Search, Trash2 } from "lucide-react";
import StatusBadge from "../StatusBadge.jsx";
import { formatDateOnly, todayInput } from "../../utils/format.js";

export default function ClinicalTreatmentForm({
  createForm,
  form,
  onChange,
  onCreateChange,
  onCreateRecord,
  onDeleteRecord,
  onSearch,
  onSearchPhoneChange,
  onStartCreateRecord,
  onSelectRecord,
  onSubmit,
  searchedPatient,
  searchPhone,
  searchResults = [],
  selectedRecord,
  services = [],
  treatmentVisits = [],
  user
}) {
  const isNurse = user?.role === "nurse";
  const [visitCount, setVisitCount] = useState(5);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const activeNurseVisit = treatmentVisits.find((visit) => visit.visitNumber === Number(form.visitNumber));
  const visibleVisitCount = Math.max(visitCount, treatmentVisits.length + 1, 5);
  const nextAllowedVisit = treatmentVisits.length + 1;
  const displayedSearchResults = selectedRecord
    ? searchResults.filter((record) => record._id === selectedRecord._id)
    : searchResults;

  function addVisitPage() {
    setVisitCount((current) => current + 1);
  }

  function chooseVisit(visitNumber) {
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
            <button
              className="button small primary"
              type="button"
              onClick={() => {
                onStartCreateRecord?.();
                setShowCreateForm((current) => !current);
              }}
            >
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
              {displayedSearchResults.map((record) => {
                const canDelete = canDeleteTreatmentRecord(record);
                return (
                  <div className={`mini-row ${selectedRecord?._id === record._id ? "active" : ""}`} key={record._id}>
                    <div className="treatment-record-info">
                      <strong>{record.serviceSnapshot?.name || record.appointment?.service?.name || "Hồ sơ điều trị"}</strong>
                      <span>{patientLabel(record.patient)}</span>
                      <small>Ngày điều trị: {formatDateOnly(record.treatmentDate || record.createdAt)}</small>
                    </div>
                    <div className="row-actions">
                      <StatusBadge value={record.status || "active"} />
                      <button className="button small secondary" type="button" onClick={() => onSelectRecord(record)}>
                        Cập nhật
                      </button>
                      <button
                        className="button small danger"
                        disabled={!canDelete}
                        type="button"
                        onClick={() => canDelete && onDeleteRecord(record)}
                        title={canDelete ? "Xóa hồ sơ điều trị" : "Chỉ xóa được hồ sơ chưa có thông tin điều trị"}
                      >
                        <Trash2 size={15} />
                        Xóa
                      </button>
                    </div>
                  </div>
                );
              })}
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
          </form>

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
                  <div className="treatment-record-info">
                    <strong>{record.serviceSnapshot?.name || record.appointment?.service?.name || "Hồ sơ điều trị"}</strong>
                    <span>{patientLabel(record.patient)}</span>
                    <small>Ngày điều trị: {formatDateOnly(record.treatmentDate || record.createdAt)}</small>
                  </div>
                  <div className="row-actions">
                    <StatusBadge value={record.status || "active"} />
                    <button className="button small secondary" type="button" onClick={() => onSelectRecord(record)}>
                      Xem chi tiết
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : searchedPatient ? (
            <div className="empty-state">
              <strong>Không có hồ sơ điều trị</strong>
              <span>Không tìm thấy hồ sơ điều trị phù hợp với bệnh nhân này.</span>
            </div>
          ) : null}

          {selectedRecord ? (
            <TreatmentEditor
              activeVisit={activeNurseVisit}
              addVisitPage={addVisitPage}
              form={form}
              isDentist={true}
              nextAllowedVisit={Math.max(treatmentVisits.length, 1)}
              onChange={onChange}
              onSubmit={onSubmit}
              visibleVisitCount={Math.max(treatmentVisits.length, 1)}
              chooseVisit={chooseVisit}
            />
          ) : (
            <div className="empty-state">
              <strong>Chọn hồ sơ điều trị</strong>
              <span>Tìm theo số điện thoại rồi bấm xem chi tiết ở hồ sơ cần xem.</span>
            </div>
          )}
        </div>
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
          {!isDentist && (
            <button className="add-page" onClick={addVisitPage} type="button">
              +
            </button>
          )}
        </div>
        <div className="clinical-selected-card wide">
          <strong>Lần {form.visitNumber}</strong>
          <span>{activeVisit?.updatedAt ? `Cập nhật: ${formatDateOnly(activeVisit.updatedAt)}` : "Chưa cập nhật"}</span>
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

function patientLabel(patient) {
  return [patient?.fullName || "Bệnh nhân", patient?.phone].filter(Boolean).join(" - ");
}

const treatmentContentFields = [
  "vitalSigns",
  "diagnosis",
  "medicalHistory",
  "treatmentResult",
  "treatmentNote",
  "treatmentPlan",
  "prescription",
  "aftercareInstructions",
  "estimatedCost"
];

function hasTreatmentValue(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return Number.isFinite(value) && value !== 0;
  if (typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.some(hasTreatmentValue);
  if (typeof value === "object") return Object.values(value).some(hasTreatmentValue);
  return Boolean(value);
}

function canDeleteTreatmentRecord(record) {
  if (!record) return false;
  const hasLegacyContent = treatmentContentFields.some((field) => hasTreatmentValue(record[field]));
  const hasVisitContent = (record.visits || []).some((visit) =>
    treatmentContentFields.some((field) => hasTreatmentValue(visit?.[field]))
  );
  return !hasLegacyContent && !hasVisitContent;
}
