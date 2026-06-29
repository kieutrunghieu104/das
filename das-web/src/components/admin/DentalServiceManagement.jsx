import { Settings2 } from "lucide-react";
import EmptyState from "../EmptyState.jsx";

export default function DentalServiceManagement({
  editingService,
  loading,
  onCancelEditService,
  onCreateService,
  onDeleteService,
  onEditingServiceChange,
  onEditService,
  onServiceFormChange,
  onUpdateService,
  serviceForm,
  services
}) {
  return (
    <>
      <section className="panel">
        <div className="section-title">
          <Settings2 size={20} />
          <h2>Thêm dịch vụ nha khoa</h2>
        </div>
        <form className="stack" onSubmit={onCreateService}>
          <label className="field">
            <span>Tên dịch vụ</span>
            <input value={serviceForm.name} onChange={(event) => onServiceFormChange({ name: event.target.value })} required />
          </label>
          <label className="field">
            <span>Mô tả</span>
            <textarea value={serviceForm.description} onChange={(event) => onServiceFormChange({ description: event.target.value })} rows="3" />
          </label>
          <label className="field">
            <span>Giá tiền</span>
            <input
              placeholder="Ví dụ: 200000 hoặc 200000-500000"
              value={serviceForm.price}
              onChange={(event) => onServiceFormChange({ price: event.target.value })}
              required
            />
          </label>
          <button className="button primary">Thêm dịch vụ</button>
        </form>
      </section>

      <section className="panel">
        <div className="section-title">
          <Settings2 size={20} />
          <h2>Dịch vụ</h2>
        </div>
        {loading ? (
          <EmptyState title="Đang tải dịch vụ" text="Hệ thống đang lấy dữ liệu mới nhất." />
        ) : (
          <div className="mini-list">
            {services.map((service) => (
              <div className="mini-row service-admin-row" key={service._id}>
                <span>{service.name}</span>
                <span>{service.description || "Chưa có mô tả"}</span>
                <strong>{service.price || "0"}</strong>
                <div className="row-actions">
                  <button className="button small secondary" type="button" onClick={() => onEditService(service)}>
                    Cập nhật
                  </button>
                  <button className="button small danger" type="button" onClick={() => onDeleteService(service)}>
                    Xóa
                  </button>
                </div>
              </div>
            ))}
            {!services.length && <EmptyState />}
          </div>
        )}
      </section>

      {editingService && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" onMouseDown={(event) => event.currentTarget === event.target && onCancelEditService()}>
          <form className="account-modal panel" onSubmit={onUpdateService}>
            <div className="section-title">
              <Settings2 size={20} />
              <h2>Cập nhật dịch vụ</h2>
            </div>
            <label className="field">
              <span>Tên dịch vụ</span>
              <input value={editingService.name} onChange={(event) => onEditingServiceChange({ name: event.target.value })} required />
            </label>
            <label className="field">
              <span>Mô tả</span>
              <textarea value={editingService.description || ""} onChange={(event) => onEditingServiceChange({ description: event.target.value })} rows="3" />
            </label>
            <label className="field">
              <span>Giá tiền</span>
              <input value={editingService.price || ""} onChange={(event) => onEditingServiceChange({ price: event.target.value })} required />
            </label>
            <div className="row-actions">
              <button className="button primary">Lưu cập nhật</button>
              <button className="button ghost" type="button" onClick={onCancelEditService}>
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
