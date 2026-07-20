import { ReceiptText, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import EmptyState from "../EmptyState.jsx";
import StatusBadge from "../StatusBadge.jsx";
import { formatDateTime, formatMoney } from "../../utils/format.js";

const paymentMethodLabels = {
  cash: "Tiền mặt",
  bank_transfer: "Chuyển khoản",
  card: "Thẻ"
};

const paymentPlanLabels = {
  one_time: "Trả một lần",
  monthly: "Trả theo tháng"
};

const installmentOptions = [3, 6, 9];
const discountOptions = [0, 5, 10, 20, 30];

function getInvoicePlan(invoicePlans, appointmentId) {
  return invoicePlans[appointmentId] || { paymentPlan: "one_time", installmentMonths: 3, discountPercent: 0 };
}

function calculateInstallmentAmount(total, installmentMonths) {
  return Math.ceil(Number(total || 0) / Math.max(Number(installmentMonths || 1), 1));
}

function calculateDiscountedTotal(total, discountPercent) {
  const subtotal = Number(total || 0);
  const discount = Math.round(subtotal * Number(discountPercent || 0) / 100);
  return Math.max(subtotal - discount, 0);
}

function getNextPaymentInfo(invoice, total, paidAmount) {
  const remaining = Math.max(total - paidAmount, 0);
  const paymentPlan = invoice?.paymentPlan === "monthly" ? "monthly" : "one_time";
  const installmentMonths = paymentPlan === "monthly" ? Number(invoice?.installmentMonths || 1) : 1;
  const installmentNumber = (invoice?.payments || []).length + 1;
  const installmentAmount = Number(invoice?.installmentAmount || calculateInstallmentAmount(total, installmentMonths));
  const isFinalPayment =
    paymentPlan !== "monthly" ||
    installmentNumber >= installmentMonths ||
    remaining <= installmentAmount;

  return {
    installmentNumber,
    amount: remaining <= 0 ? 0 : isFinalPayment ? remaining : Math.min(installmentAmount, remaining)
  };
}

export default function ReceptionCheckInAppointments({
  checkInAppointments,
  generateInvoice,
  invoicePlans = {},
  loading,
  onDeleteEmptyInvoice,
  paymentMethods,
  processPayment,
  setPaymentMethods,
  updateInvoicePlan
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
            <option value="partial">Đang trả theo tháng</option>
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
            const invoicePlan = getInvoicePlan(invoicePlans, appointment._id);
            const rawTotal = Number(invoice?.subtotal || appointment.performedTotal || invoice?.total || 0);
            const total = Number(invoice?.total || calculateDiscountedTotal(rawTotal, invoicePlan.discountPercent));
            const paidAmount = Number(invoice?.paidAmount || 0);
            const remaining = Math.max(total - paidAmount, 0);
            const items = invoice?.items?.length ? invoice.items : [...(appointment.performedServices || []), ...(appointment.extraCosts || [])];
            const plannedInstallmentAmount = calculateInstallmentAmount(total, invoicePlan.installmentMonths);
            const nextPayment = getNextPaymentInfo(invoice, total, paidAmount);
            const hasServiceItems = (appointment.performedServices || []).length > 0 || (appointment.extraCosts || []).length > 0;
            const canDeleteEmptyInvoice = !invoice && total <= 0 && !hasServiceItems;
            return (
              <article className="appointment-card reception-checkin-card" key={appointment._id}>
                {canDeleteEmptyInvoice && (
                  <button
                    className="button small danger empty-invoice-delete"
                    onClick={() => onDeleteEmptyInvoice(appointment)}
                    title="Xóa dòng chưa có dịch vụ phát sinh"
                    type="button"
                  >
                    <Trash2 size={15} />
                    Xóa
                  </button>
                )}
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
                    <span>Tạo hóa đơn: {invoice ? formatDateTime(invoice.invoiceDate || invoice.createdAt) : "Chưa tạo hóa đơn"}</span>
                    <span>Bác sĩ: {appointment.dentist?.fullName || "-"}</span>
                  </div>
                  <div className="invoice-payment-summary">
                    <strong>{formatMoney(paidAmount)} / {formatMoney(total)}</strong>
                    {invoice && <StatusBadge value={invoice.status} />}
                    {invoice?.discountPercent > 0 && (
                      <span className="payment-plan-note">
                        Giảm giá: {invoice.discountPercent}% (-{formatMoney(invoice.discountAmount)})
                      </span>
                    )}
                    {invoice && (
                      <span className="payment-plan-note">
                        Hình thức: {paymentPlanLabels[invoice.paymentPlan] || paymentPlanLabels.one_time}
                        {invoice.paymentPlan === "monthly" ? ` (${invoice.installmentMonths} tháng, mỗi lần ${formatMoney(invoice.installmentAmount)})` : ""}
                      </span>
                    )}
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
                            Lần {payment.installmentNumber || index + 1}: {formatMoney(Number(payment.amount || 0))} - {paymentMethodLabels[payment.paymentMethod] || payment.paymentMethod} - {formatDateTime(payment.paymentDate || payment.createdAt)}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="row-actions schedule-status-actions checkin-status-actions">
                  {!invoice ? (
                    <>
                      <label className="payment-amount-field">
                        <span>Hình thức thanh toán</span>
                        <select
                          value={invoicePlan.paymentPlan}
                          onChange={(event) => updateInvoicePlan(appointment._id, { paymentPlan: event.target.value })}
                        >
                          <option value="one_time">Trả một lần hết</option>
                          <option value="monthly">Trả theo tháng</option>
                        </select>
                      </label>
                      {invoicePlan.paymentPlan === "monthly" && (
                        <label className="payment-amount-field">
                          <span>Kỳ hạn</span>
                          <select
                            value={invoicePlan.installmentMonths}
                            onChange={(event) => updateInvoicePlan(appointment._id, { installmentMonths: Number(event.target.value) })}
                          >
                            {installmentOptions.map((month) => (
                              <option key={month} value={month}>{month} tháng</option>
                            ))}
                          </select>
                        </label>
                      )}
                      {invoicePlan.paymentPlan === "monthly" && (
                        <span className="payment-plan-preview">Mỗi tháng: {formatMoney(plannedInstallmentAmount)}</span>
                      )}
                      <label className="payment-amount-field">
                        <span>Giảm giá</span>
                        <select
                          value={invoicePlan.discountPercent}
                          onChange={(event) => updateInvoicePlan(appointment._id, { discountPercent: Number(event.target.value) })}
                        >
                          {discountOptions.map((percent) => (
                            <option key={percent} value={percent}>{percent}%</option>
                          ))}
                        </select>
                      </label>
                      <button className="button small ghost" type="button" disabled={total <= 0} onClick={() => generateInvoice(appointment)}>
                        Tạo hóa đơn
                      </button>
                      {total <= 0 && <span className="paid-complete-note">Chưa có dịch vụ phát sinh</span>}
                    </>
                  ) : remaining > 0 ? (
                    <>
                      <span className="payment-plan-preview">
                        Thu lần {nextPayment.installmentNumber}: {formatMoney(nextPayment.amount)}
                      </span>
                      <label className="payment-amount-field">
                        <span>Phương thức</span>
                        <select
                          value={paymentMethods[appointment._id] || "cash"}
                          onChange={(event) => setPaymentMethods((current) => ({ ...current, [appointment._id]: event.target.value }))}
                        >
                          <option value="cash">Tiền mặt</option>
                          <option value="bank_transfer">Chuyển khoản</option>
                        </select>
                      </label>
                      <button className="button small secondary" type="button" onClick={() => processPayment(appointment)}>
                        Ghi nhận thanh toán
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
