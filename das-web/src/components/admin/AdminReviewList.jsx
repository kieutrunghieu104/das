import { Star } from "lucide-react";
import EmptyState from "../EmptyState.jsx";
import StatusBadge from "../StatusBadge.jsx";

export default function AdminReviewList({ loading, onToggleVisibility, reviews }) {
  return (
    <section className="panel">
      <div className="section-title">
        <Star size={20} />
        <h2>Đánh giá & xếp hạng</h2>
      </div>
      {loading ? (
        <EmptyState title="Đang tải đánh giá" text="Hệ thống đang lấy dữ liệu mới nhất." />
      ) : reviews.length ? (
        <div className="review-admin-grid">
          {reviews.map((review) => (
            <article className="patient-dark-review-card admin-review-card" key={review._id}>
              <div className="review-stars">
                {Array.from({ length: Number(review.rating || review.ratingService || 5) }, (_, index) => (
                  <Star fill="currentColor" size={15} key={index} />
                ))}
              </div>
              <p>{review.comment || "Không có nhận xét chi tiết."}</p>
              <div>
                <strong>{review.patient?.fullName || "Bệnh nhân"}</strong>
                <span>{review.service?.name || "Dịch vụ"} / {review.dentist?.fullName || "Bác sĩ"}</span>
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
        <EmptyState title="Chưa có đánh giá" text="Đánh giá của bệnh nhân sẽ hiển thị tại đây." />
      )}
    </section>
  );
}
