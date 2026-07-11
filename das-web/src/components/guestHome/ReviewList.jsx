import { Star } from "lucide-react";
import EmptyState from "../EmptyState.jsx";
import ReviewCard from "./ReviewCard.jsx";

export default function ReviewList({ reviews }) {
  return (
    <section className="smile-section smile-testimonials">
      <div className="smile-section-heading centered">
        <span className="smile-pill compact gold">
          <Star size={15} />
          Khách hàng nói gì
        </span>
        <h2>Đánh Giá Từ Khách Hàng SmileCare</h2>
      </div>
      {reviews.length ? (
        <div className="smile-testimonial-grid">
          {reviews.map((item) => (
            <ReviewCard review={item} key={item._id} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Chưa có đánh giá"
          text="Đánh giá của khách hàng sẽ hiển thị tại đây sau khi bệnh nhân gửi từ hệ thống."
        />
      )}
    </section>
  );
}
