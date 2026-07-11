import { ReceiptText } from "lucide-react";
import EmptyState from "../EmptyState.jsx";
import InvoiceCard from "./InvoiceCard.jsx";

export default function PatientInvoiceList({
  invoices,
  loading,
  reviewByAppointment,
  reviewForms,
  submitReview,
  updateReviewForm
}) {
  return (
    <section className="panel" id="invoices">
      <div className="section-title">
        <ReceiptText size={20} />
        <h2>Hóa đơn của tôi</h2>
      </div>
      {loading ? (
        <EmptyState title="Đang tải hóa đơn" text="Hệ thống đang lấy dữ liệu mới nhất." />
      ) : invoices.length ? (
        <div className="mini-list">
          {invoices.map((invoice) => (
            <InvoiceCard
              invoice={invoice}
              key={invoice._id}
              review={reviewByAppointment.get(invoice.appointment?._id)}
              reviewForm={reviewForms[invoice.appointment?._id]}
              submitReview={submitReview}
              updateReviewForm={updateReviewForm}
            />
          ))}
        </div>
      ) : (
        <EmptyState title="Chưa có hóa đơn" text="Hóa đơn sẽ xuất hiện sau khi lịch khám được tiếp nhận." />
      )}
    </section>
  );
}
