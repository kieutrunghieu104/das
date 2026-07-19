import { CalendarPlus, PhoneCall } from "lucide-react";
import EmptyState from "../EmptyState.jsx";
import StatusBadge from "../StatusBadge.jsx";
import { formatDateTime } from "../../utils/format.js";

const genderLabels = {
  male: "Anh",
  female: "Chị",
  other: "Khác",
  unknown: "Chưa chọn"
};

export default function ConsultationRequestList({
  consultations,
  loading,
  onBookConsultation,
  onStatusFilterChange,
  onUpdateConsultationStatus,
  statusFilter = "waiting"
}) {
  return (
    <section className="panel">
      <div className="section-title">
        <PhoneCall size={20} />
        <h2>Yêu cầu tư vấn</h2>
      </div>

      <div className="toolbar-row">
        <label className="field inline-field">
          <span>Trạng thái</span>
          <select value={statusFilter} onChange={(event) => onStatusFilterChange?.(event.target.value)}>
            <option value="all">Tất cả</option>
            <option value="waiting">Chờ tư vấn</option>
            <option value="contacted">Đã tư vấn</option>
          </select>
        </label>
      </div>

      <div className="mini-list consultation-list">
        {loading ? (
          <EmptyState title="Đang tải yêu cầu tư vấn" text="Hệ thống đang lấy dữ liệu mới nhất." />
        ) : consultations.map((item) => (
          <div className="mini-row consultation-row" key={item._id}>
            <div className="consultation-info">
              <strong>{genderLabels[item.gender] || "Chưa chọn"} {item.fullName} - {item.phone}</strong>
              <span>Dịch vụ quan tâm: {item.service?.name || "Chưa chọn"}</span>
              <span>Thời gian đặt tư vấn: {formatDateTime(item.createdAt)}</span>
            </div>
            <div className="row-actions consultation-actions">
              <StatusBadge value={item.status || "waiting"} />
              <select
                aria-label="Cập nhật trạng thái tư vấn"
                value={item.status || "waiting"}
                onChange={(event) => onUpdateConsultationStatus?.(item, event.target.value)}
              >
                <option value="waiting">Chờ tư vấn</option>
                <option value="contacted">Đã tư vấn</option>
              </select>
              {(item.status || "waiting") === "waiting" && (
                <button className="button small primary" type="button" onClick={() => onBookConsultation?.(item)}>
                  <CalendarPlus size={16} />
                  Đặt lịch
                </button>
              )}
            </div>
          </div>
        ))}
        {!loading && !consultations.length && <EmptyState title="Không có yêu cầu tư vấn" text="Không có dữ liệu phù hợp với bộ lọc hiện tại." />}
      </div>
    </section>
  );
}
