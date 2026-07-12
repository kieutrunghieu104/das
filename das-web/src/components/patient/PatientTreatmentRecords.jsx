import { FileText } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import EmptyState from "../EmptyState.jsx";
import { formatDateTime } from "../../utils/format.js";

export default function PatientTreatmentRecords({ loading, records }) {
  const [recordId, setRecordId] = useState("");
  const selectedRecord = useMemo(() => records.find((record) => record._id === recordId) || records[0], [recordId, records]);
  const visits = useMemo(() => normalizeVisits(selectedRecord), [selectedRecord]);
  const latestVisitNumber = visits.length ? visits[visits.length - 1].visitNumber : 1;
  const [activeVisit, setActiveVisit] = useState(latestVisitNumber);
  const visibleVisit = visits.find((visit) => visit.visitNumber === activeVisit) || visits[visits.length - 1];

  useEffect(() => {
    setActiveVisit(latestVisitNumber);
  }, [latestVisitNumber, selectedRecord?._id]);

  function chooseRecord(nextRecordId) {
    const nextRecord = records.find((record) => record._id === nextRecordId);
    const nextVisits = normalizeVisits(nextRecord);
    setRecordId(nextRecordId);
    setActiveVisit(nextVisits.length ? nextVisits[nextVisits.length - 1].visitNumber : 1);
  }

  return (
    <section className="panel clinical-treatment-panel" id="records">
      <div className="section-title">
        <FileText size={20} />
        <h2>Hồ sơ điều trị</h2>
      </div>
      {loading ? (
        <EmptyState title="Đang tải hồ sơ" text="Hệ thống đang lấy dữ liệu mới nhất." />
      ) : records.length ? (
        <div className="clinical-record-browser">
          <label className="field">
            <span>Hồ sơ</span>
            <select value={selectedRecord?._id || ""} onChange={(event) => chooseRecord(event.target.value)}>
              {records.map((record) => (
                <option key={record._id} value={record._id}>
                  {recordServiceName(record)} - {formatDateOnly(record.createdAt || record.treatmentDate)}
                </option>
              ))}
            </select>
          </label>
          {visits.length ? (
            <>
              <div className="treatment-page-tabs">
                {visits.map((visit) => (
                  <button
                    className={visit.visitNumber === activeVisit ? "active" : ""}
                    key={`${selectedRecord?._id}-visit-${visit.visitNumber}`}
                    onClick={() => setActiveVisit(visit.visitNumber)}
                    type="button"
                  >
                    Lần {visit.visitNumber}
                  </button>
                ))}
              </div>
              <div className="readonly-record-grid">
                <div className="clinical-selected-card patient-record-meta-card wide">
                  <span>Ngày tạo: {formatDateOnly(selectedRecord.createdAt || selectedRecord.treatmentDate)}</span>
                  <span>Ngày cập nhật: {formatDateTime(visibleVisit?.updatedAt || selectedRecord.updatedAt)}</span>
                </div>
                <ReadOnlyField label="Huyết áp" value={visibleVisit?.vitalSigns?.bloodPressure} />
                <ReadOnlyField label="Nhịp tim" value={visibleVisit?.vitalSigns?.heartRate} />
                <ReadOnlyField label="SpO2" value={visibleVisit?.vitalSigns?.spo2} />
                <ReadOnlyField label="Nhiệt độ" value={visibleVisit?.vitalSigns?.temperature} />
                <ReadOnlyField label="Nhịp thở" value={visibleVisit?.vitalSigns?.respiratoryRate} />
                <ReadOnlyField label="Chẩn đoán" value={visibleVisit?.diagnosis} wide />
                <ReadOnlyField label="Tiền sử bệnh án" value={visibleVisit?.medicalHistory} wide />
                <ReadOnlyField label="Điều trị đã thực hiện" value={visibleVisit?.treatmentResult} wide />
                <ReadOnlyField label="Đơn thuốc" value={visibleVisit?.prescription} wide />
                <ReadOnlyField label="Điều trị dự kiến" value={visibleVisit?.treatmentPlan} wide />
                <ReadOnlyField label="Hướng dẫn sau điều trị" value={visibleVisit?.aftercareInstructions} wide />
                <ReadOnlyField label="Ghi chú điều trị" value={visibleVisit?.treatmentNote} wide />
              </div>
            </>
          ) : (
            <EmptyState title="Chưa có lần điều trị" text="Hồ sơ này chưa có nội dung lần điều trị." />
          )}
        </div>
      ) : (
        <EmptyState title="Chưa có hồ sơ điều trị" text="Hồ sơ sẽ hiển thị sau khi y tá tạo và cập nhật điều trị." />
      )}
    </section>
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

function recordServiceName(record) {
  return record?.serviceSnapshot?.name || record?.initialInfo?.serviceName || record?.appointment?.service?.name || "Dịch vụ";
}

function formatDateOnly(value) {
  if (!value) return "-";
  return formatDateTime(value).split(" ")[0] || "-";
}

function normalizeVisits(record) {
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
        updatedAt: record.updatedAt || record.treatmentDate
      }]
    : [];
}
