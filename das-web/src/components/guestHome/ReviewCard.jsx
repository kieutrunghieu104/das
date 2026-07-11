import { Star } from "lucide-react";

export default function ReviewCard({ review }) {
  return (
    <article key={review._id}>
      <div className="smile-stars" aria-label={`${review.rating} sao`}>
        {Array.from({ length: review.rating }).map((_, index) => (
          <Star size={16} fill="currentColor" key={index} />
        ))}
      </div>
      <p>"{review.text}"</p>
      <div>
        <span>{review.name[0]}</span>
        <strong>{review.name}</strong>
        <small>{review.service}</small>
      </div>
    </article>
  );
}
