import StatusBadge from "../StatusBadge.jsx";
import { formatDateTime, formatMoney } from "../../utils/format.js";
import ReviewForm from "./ReviewForm.jsx";

const paymentMethodLabels = {
  cash: "Tiền mặt",
  bank_transfer: "Chuyển khoản",
  card: "Thẻ"
};

const paymentPlanLabels = {
  one_time: "Trả một lần",
  monthly: "Trả theo tháng"
};

export default function InvoiceCard({
  invoice,
  review,
  reviewForm,
  submitReview,
  updateReviewForm
}) {
  const total = Number(invoice.total || 0);
  const paidAmount = Number(invoice.paidAmount || 0);
  const discountPercent = Number(invoice.discountPercent || 0);
  const discountAmount = Number(invoice.discountAmount || 0);
  const items = (invoice.items || []).length
    ? invoice.items
    : [{ name: invoice.appointment?.service?.name || "Dịch vụ nha khoa", amount: total }];
  const appointmentId = invoice.appointment?._id;
  const canReview = appointmentId && invoice.appointment?.status === "completed";
  const currentReviewForm = reviewForm || {
    rating: Number(review?.rating || 5),
    comment: review?.comment || ""
  };

  return (
    <div className="record-card" key={invoice._id}>
      <strong>{invoice.appointment?.service?.name || "Hóa đơn dịch vụ"}</strong>
      <p>Đã thanh toán: {formatMoney(paidAmount)} / Tổng: {formatMoney(total)}</p>
      <span className="mini">Thời gian tạo hóa đơn: {formatDateTime(invoice.invoiceDate || invoice.createdAt)}</span>
      <span className="mini">
        Giảm giá: {discountPercent}%{discountAmount > 0 ? ` (-${formatMoney(discountAmount)})` : ""}
      </span>
      <span className="mini">
        Hình thức: {paymentPlanLabels[invoice.paymentPlan] || paymentPlanLabels.one_time}
        {invoice.paymentPlan === "monthly" ? ` (${invoice.installmentMonths} tháng, mỗi lần ${formatMoney(invoice.installmentAmount)})` : ""}
      </span>
      <div className="invoice-items-list">
        {items.map((item, index) => (
          <span key={`${invoice._id}-item-${index}`}>
            {item.name}: {formatMoney(Number(item.amount || item.price || 0))}
          </span>
        ))}
      </div>
      <div className="invoice-items-list">
        {(invoice.payments || []).map((payment, index) => (
          <span key={payment._id || `${invoice._id}-payment-${index}`}>
            Lần {payment.installmentNumber || index + 1}: {formatMoney(Number(payment.amount || 0))} - {paymentMethodLabels[payment.paymentMethod] || payment.paymentMethod} - {formatDateTime(payment.paymentDate || payment.createdAt)}
          </span>
        ))}
      </div>
      <StatusBadge value={invoice.status} />
      {canReview && (
        <div className="invoice-review-section">
          <strong>{review ? "Đánh giá của bạn" : "Gửi đánh giá"}</strong>
          <ReviewForm
            form={currentReviewForm}
            onChange={(next) => updateReviewForm(appointmentId, next)}
            onSubmit={(event) => submitReview(event, appointmentId)}
            submitLabel={review ? "Cập nhật đánh giá" : "Gửi đánh giá"}
          />
        </div>
      )}
    </div>
  );
}
