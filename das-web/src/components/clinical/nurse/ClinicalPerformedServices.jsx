import { ReceiptText } from "lucide-react";
import { useMemo } from "react";
import EmptyState from "../../EmptyState.jsx";
import StatusBadge from "../../StatusBadge.jsx";
import { formatDateTime, formatMoney } from "../../../utils/format.js";

export default function ClinicalPerformedServices({
  appointments,
  form,
  onAddExtraCost,
  onChange,
  onExtraCostChange,
  onRemoveExtraCost,
  onSubmit,
  onToggleService,
  selectedAppointment,
  services
}) {
  const selectedServices = form.services || {};
  const extraCosts = form.extraCosts || [];
  const total = useMemo(() => {
    const serviceTotal = Object.values(selectedServices).reduce((sum, item) => {
      return item.selected ? sum + Number(item.amount || 0) : sum;
    }, 0);
    const extraTotal = extraCosts.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    return serviceTotal + extraTotal;
  }, [extraCosts, selectedServices]);

  return (
    <section className="panel clinical-treatment-panel">
      <div className="section-title">
        <ReceiptText size={20} />
        <h2>Dịch vụ đã thực hiện</h2>
      </div>
      <form className="stack" onSubmit={onSubmit}>
        <label className="field">
          <span>Lịch khám</span>
          <select value={form.appointmentId} onChange={(event) => onChange("appointmentId", event.target.value)}>
            <option value="">Chọn lịch khám</option>
            {appointments.map((appointment) => (
              <option key={appointment._id} value={appointment._id}>
                {[appointment.patient?.fullName || "Bệnh nhân", appointment.patient?.phone].filter(Boolean).join(" - ")} - {appointment.service?.name || "Dịch vụ"} - {formatDateTime(appointment.startAt)}
              </option>
            ))}
          </select>
        </label>

        {selectedAppointment ? (
          <div className="clinical-selected-card">
            <strong>{[selectedAppointment.patient?.fullName || "Bệnh nhân", selectedAppointment.patient?.phone].filter(Boolean).join(" - ")}</strong>
            <span>{selectedAppointment.service?.name} / {selectedAppointment.room?.name}</span>
            <StatusBadge value={selectedAppointment.status} />
          </div>
        ) : (
          <EmptyState title="Chọn lịch khám" text="Dịch vụ đã thực hiện chỉ hiển thị sau khi y tá chọn một lịch khám cụ thể." />
        )}

        {selectedAppointment && services.length ? (
          <div className="mini-list performed-service-list">
            {services.map((service) => {
              const selected = selectedServices[service._id]?.selected || false;
              const defaultAmount = Number(service.price || 0);
              return (
                <div className="mini-row performed-service-row" key={service._id}>
                  <label className="checkbox-line">
                    <input
                      checked={selected}
                      onChange={(event) => onToggleService(service, event.target.checked)}
                      type="checkbox"
                    />
                    <span>{service.name}</span>
                  </label>
                  <input
                    disabled={!selected}
                    min="0"
                    step="1000"
                    type="number"
                    value={selectedServices[service._id]?.amount ?? (Number.isFinite(defaultAmount) ? defaultAmount : 0)}
                    onChange={(event) => onToggleService(service, true, event.target.value)}
                  />
                </div>
              );
            })}
          </div>
        ) : selectedAppointment ? (
          <EmptyState title="Chưa có dịch vụ" text="Admin cần tạo dịch vụ trước khi y tá xác nhận chi phí." />
        ) : null}

        {selectedAppointment && (
          <div className="stack">
            {extraCosts.map((item, index) => (
              <div className="form-grid" key={`extra-${index}`}>
                <label className="field">
                  <span>Chi phí khác</span>
                  <input value={item.name} onChange={(event) => onExtraCostChange(index, "name", event.target.value)} />
                </label>
                <label className="field">
                  <span>Số tiền</span>
                  <input
                    min="0"
                    step="1000"
                    type="number"
                    value={item.amount}
                    onChange={(event) => onExtraCostChange(index, "amount", event.target.value)}
                  />
                </label>
                <button className="button small danger" type="button" onClick={() => onRemoveExtraCost(index)}>
                  Xóa
                </button>
              </div>
            ))}
            <button className="button small ghost" type="button" onClick={onAddExtraCost}>
              Thêm chi phí khác
            </button>
          </div>
        )}

        {selectedAppointment && (
          <div className="clinical-selected-card">
            <strong>Tổng tiền: {formatMoney(total)}</strong>
          </div>
        )}

        {selectedAppointment && (
          <div className="row-actions clinical-treatment-actions">
            <button className="button primary">Xác nhận hoàn tất</button>
          </div>
        )}
      </form>
    </section>
  );
}
