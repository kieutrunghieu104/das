import { ReceiptText, Search } from "lucide-react";
import { useMemo, useState } from "react";
import EmptyState from "../EmptyState.jsx";
import StatusBadge from "../StatusBadge.jsx";
import { formatDateTime, formatMoney } from "../../utils/format.js";

const paymentMethodLabels = {
  cash: "Tiền mặt",
  bank_transfer: "Chuyển khoản",
  card: "Thẻ"
};

export default function ReceptionCheckInAppointments({
  checkInAppointments,
  generateInvoice,
  loading,
  paymentAmounts,
  paymentMethods,
  processPayment,
  setPaymentAmounts,
  setPaymentMethods
}) {
  const [invoiceFilter, setInvoiceFilter] = useState("unpaid");
  const [invoiceSearch, setInvoiceSearch] = useState("");

  const filteredAppointments = useMemo(() => {
    const keyword = invoiceSearch.trim().toLowerCase();
    return checkInAppointments.filter((appointment) => {
      const invoiceStatus = appointment.invoice?.status || "unpaid";
      const matchesStatus = invoiceFilter === "all" || invoiceStatus === invoiceFilter;
      const matchesKeyword =
        !keyword ||
        [appointment.patient?.fullName, appointment.patient?.phone, appointment.service?.name]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(keyword);
      return matchesStatus && matchesKeyword;
    });
  }, [checkInAppointments, invoiceFilter, invoiceSearch]);

  return (
    <section className="panel reception-checkin-panel">
      <div className="section-title">
        <ReceiptText size={20} />
        <h2>Hóa đơn và thanh toán</h2>
      </div>
      <p className="muted">Các lịch đã hoàn tất sẽ xuất hiện ở đây để lễ tân tạo hóa đơn và ghi nhận thanh toán.</p>

      <div className="toolbar-row">
        <label className="field inline-field">
          <span>Trạng thái thanh toán</span>
          <select value={invoiceFilter} onChange={(event) => setInvoiceFilter(event.target.value)}>
            <option value="unpaid">Chưa trả</option>
            <option value="partial">Trả 1 phần</option>
            <option value="paid">Đã trả đủ</option>
            <option value="all">Tất cả</option>
          </select>
        </label>
        <label className="field inline-field">
          <span>Tìm bệnh nhân</span>
          <div className="input-with-icon">
            <Search size={17} />
            <input
              value={invoiceSearch}
              onChange={(event) => setInvoiceSearch(event.target.value)}
              placeholder="Tên hoặc SĐT"
            />
          </div>
        </label>
      </div>

      {loading ? (
        <EmptyState title="Đang tải hóa đơn" text="Hệ thống đang lấy dữ liệu mới nhất." />
      ) : filteredAppointments.length ? (
        <div className="appointment-list checkin-list">
          {filteredAppointments.map((appointment) => {
            const invoice = appointment.invoice;
            const total = Number(invoice?.total || invoice?.totalAmount || appointment.performedTotal || 0);
            const paidAmount = Number(invoice?.paidAmount || 0);
            const remaining = Math.max(total - paidAmount, 0);
            const items = invoice?.items?.length ? invoice.items : [...(appointment.performedServices || []), ...(appointment.extraCosts || [])];
            return (
              <article className="appointment-card reception-checkin-card" key={appointment._id}>
                <div className="appointment-card-main">
                  <div className="patient-contact-row">
                    <div>
                      <h4>{appointment.patient?.fullName || "Bệnh nhân"}</h4>
                      <p>{appointment.patient?.phone || "Chưa có SĐT"}</p>
                    </div>
                    <StatusBadge value={appointment.status} />
                  </div>
                  <div className="appointment-slot-box">
                    <strong>{appointment.service?.name || "Dịch vụ"}</strong>
                    <span>{formatDateTime(appointment.startAt)}</span>
                    <span>Bác sĩ: {appointment.dentist?.fullName || "-"}</span>
                  </div>
                  <div className="invoice-payment-summary">
                    <strong>{formatMoney(paidAmount)} / {formatMoney(total)}</strong>
                    {invoice && <StatusBadge value={invoice.status} />}
                    <div className="invoice-items-list">
                      {items.map((item, index) => (
                        <span key={`${appointment._id}-item-${index}`}>
                          {item.name}: {formatMoney(Number(item.amount || item.price || 0))}
                        </span>
                      ))}
                    </div>
                    {invoice?.payments?.length ? (
                      <div className="invoice-items-list">
                        {invoice.payments.map((payment, index) => (
                          <span key={payment._id || `${invoice._id}-payment-${index}`}>
                            Lần {index + 1}: {formatMoney(Number(payment.amount || 0))} - {paymentMethodLabels[payment.paymentMethod] || payment.paymentMethod}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="row-actions schedule-status-actions checkin-status-actions">
                  {!invoice ? (
                    <button className="button small ghost" type="button" onClick={() => generateInvoice(appointment)}>
                      Tạo hóa đơn
                    </button>
                  ) : remaining > 0 ? (
                    <>
                      <label className="payment-amount-field">
                        <span>Số tiền bệnh nhân đã thanh toán</span>
                        <input
                          type="number"
                          min="1"
                          max={remaining}
                          step="1000"
                          value={paymentAmounts[appointment._id] || ""}
                          onChange={(event) => setPaymentAmounts((current) => ({ ...current, [appointment._id]: event.target.value }))}
                          placeholder={String(remaining)}
                        />
                      </label>
                      <label className="payment-amount-field">
                        <span>Phương thức</span>
                        <select
                          value={paymentMethods[appointment._id] || "cash"}
                          onChange={(event) => setPaymentMethods((current) => ({ ...current, [appointment._id]: event.target.value }))}
                        >
                          <option value="cash">Tiền mặt</option>
                          <option value="bank_transfer">Chuyển khoản</option>
                          <option value="card">Thẻ</option>
                        </select>
                      </label>
                      <button className="button small secondary" type="button" onClick={() => processPayment(appointment)}>
                        Thanh toán
                      </button>
                    </>
                  ) : (
                    <span className="paid-complete-note">Đã thanh toán đủ</span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState title="Chưa có hóa đơn phù hợp" text="Mặc định màn này hiển thị các hóa đơn chưa trả." />
      )}
    </section>
  );
}
