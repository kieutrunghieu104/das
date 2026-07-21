import { Star } from "lucide-react";
import { useMemo, useState } from "react";
import EmptyState from "../EmptyState.jsx";
import StatusBadge from "../StatusBadge.jsx";
import { formatDateTime } from "../../utils/format.js";

const reviewStatusFilters = [
  { value: "all", label: "Tất cả" },
  { value: "visible", label: "Đang hiển thị" },
  { value: "hidden", label: "Đã ẩn" }
];

export default function AdminReviewList({ loading, onToggleVisibility, reviews }) {
  const [statusFilter, setStatusFilter] = useState("all");
  const filteredReviews = useMemo(() => {
    if (statusFilter === "visible") return reviews.filter((review) => !review.isHidden);
    if (statusFilter === "hidden") return reviews.filter((review) => review.isHidden);
    return reviews;
  }, [reviews, statusFilter]);

  return (
    <section className="panel">
      <div className="section-title">
        <Star size={20} />
        <h2>Đánh giá & xếp hạng</h2>
      </div>
      <div className="toolbar-row admin-review-toolbar">
        <label className="field inline-field">
          <span>Trạng thái</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            {reviewStatusFilters.map((option) => (
              <option value={option.value} key={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
      </div>
      {loading ? (
        <EmptyState title="Đang tải đánh giá" text="Hệ thống đang lấy dữ liệu mới nhất." />
      ) : filteredReviews.length ? (
        <div className="review-admin-grid">
          {filteredReviews.map((review) => (
            <article className="patient-dark-review-card admin-review-card" key={review._id}>
              <div className="review-stars">
                {Array.from({ length: Number(review.rating || review.ratingService || 5) }, (_, index) => (
                  <Star fill="currentColor" size={15} key={index} />
                ))}
              </div>
              <p>{review.comment || "Không có nhận xét chi tiết."}</p>
              <div className="admin-review-meta">
                <strong>{review.patient?.fullName || "Bệnh nhân"}</strong>
                <span><b>Dịch vụ:</b> {review.service?.name || "Chưa có dịch vụ"}</span>
                <span><b>Bác sĩ:</b> {review.dentist?.fullName || "Chưa có bác sĩ"}</span>
                <span><b>Ngày đánh giá:</b> {formatDateTime(review.updatedAt)}</span>
              </div>
              <div className="row-actions">
                <StatusBadge value={review.isHidden ? "hidden" : "visible"} />
                <button
                  className={`button small ${review.isHidden ? "secondary" : "danger"}`}
                  type="button"
                  onClick={() => onToggleVisibility(review, !review.isHidden)}
                >
                  {review.isHidden ? "Hiện" : "Ẩn"}
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="Không có đánh giá phù hợp" text="Thử đổi bộ lọc trạng thái để xem các đánh giá khác." />
      )}
    </section>
  );
}
