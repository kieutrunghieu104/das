import { PhoneCall, X } from "lucide-react";
import EmptyState from "../EmptyState.jsx";

const genderLabels = {
  male: "Anh",
  female: "Chị",
  other: "Khác",
  unknown: "Chưa chọn"
};

export default function ConsultationRequestList({ consultations, loading, onDeleteConsultation }) {
  return (
    <section className="panel">
      <div className="section-title">
        <PhoneCall size={20} />
        <h2>Yêu cầu tư vấn</h2>
      </div>
      <div className="mini-list">
        {loading ? (
          <EmptyState title="Đang tải yêu cầu tư vấn" text="Hệ thống đang lấy dữ liệu mới nhất." />
        ) : consultations.map((item) => (
          <div className="mini-row" key={item._id}>
            <span>
              {genderLabels[item.gender] || "Chưa chọn"} {item.fullName} - {item.phone}
            </span>
            <span>Dịch vụ quan tâm: {item.service?.name || "Chưa chọn"}</span>
            <button className="icon-button danger" onClick={() => onDeleteConsultation(item._id)} title="Xóa yêu cầu tư vấn">
              <X size={17} />
            </button>
          </div>
        ))}
        {!loading && !consultations.length && <EmptyState />}
      </div>
    </section>
  );
}
