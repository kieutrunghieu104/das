import { BarChart3, ReceiptText, UsersRound } from "lucide-react";
import { formatDateTime, formatMoney } from "../../utils/format.js";
import AdminMetric from "./AdminMetric.jsx";

export default function AdminReportPanel({
  onLoadPatientStatistics,
  onLoadRevenueReport,
  onReportFiltersChange,
  patientStatistics,
  reportFilters,
  revenueReport,
  stats
}) {
  function loadAll() {
    onLoadRevenueReport();
    onLoadPatientStatistics();
  }

  return (
    <>
      <section className="metrics-grid">
        <AdminMetric icon={BarChart3} label="Doanh thu" value={formatMoney(stats?.revenue || 0)} />
        <AdminMetric icon={UsersRound} label="Bệnh nhân mới" value={patientStatistics?.newPatients ?? stats?.newPatientCount ?? 0} />
        <AdminMetric icon={UsersRound} label="Bệnh nhân quay lại" value={patientStatistics?.returningPatients ?? stats?.returningPatientCount ?? 0} />
      </section>

      <section className="panel">
        <div className="section-title">
          <BarChart3 size={20} />
          <h2>Thống kê</h2>
        </div>
        <div className="form-grid">
          <label className="field">
            <span>Từ ngày</span>
            <input type="date" value={reportFilters.startDate} onChange={(event) => onReportFiltersChange({ startDate: event.target.value })} />
          </label>
          <label className="field">
            <span>Đến ngày</span>
            <input type="date" value={reportFilters.endDate} onChange={(event) => onReportFiltersChange({ endDate: event.target.value })} />
          </label>
          <button className="button primary" type="button" onClick={loadAll}>
            Xem thống kê
          </button>
        </div>
      </section>

      {patientStatistics && (
        <section className="panel">
          <div className="section-title">
            <UsersRound size={20} />
            <h2>Thống kê bệnh nhân</h2>
          </div>
          <div className="mini-list">
            <div className="mini-row">
              <span>Bệnh nhân mới</span>
              <strong>{patientStatistics.newPatients}</strong>
            </div>
            <div className="mini-row">
              <span>Bệnh nhân quay lại</span>
              <strong>{patientStatistics.returningPatients}</strong>
            </div>
            {(patientStatistics.appointmentCounts || []).map((item) => (
              <div className="mini-row" key={item._id || "unknown"}>
                <span>Lịch hẹn {item._id || "khác"}</span>
                <strong>{item.count}</strong>
              </div>
            ))}
          </div>
        </section>
      )}

      {revenueReport && (
        <section className="panel">
          <div className="section-title">
            <ReceiptText size={20} />
            <h2>Hóa đơn trong kỳ</h2>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Thời điểm</th>
                  <th>Trạng thái</th>
                  <th>Số tiền</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ...(revenueReport.paidInvoices || []),
                  ...(revenueReport.partialInvoices || []),
                  ...(revenueReport.unpaidInvoices || [])
                ].map((invoice) => (
                  <tr key={invoice._id}>
                    <td>{formatDateTime(invoice.paidAt || invoice.invoiceDate || invoice.createdAt)}</td>
                    <td>{invoice.status === "paid" ? "Đã thanh toán" : invoice.status === "partial" ? "Đang trả theo tháng" : "Chưa thanh toán"}</td>
                    <td>{formatMoney(invoice.total || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
