import { Trash2, X } from "lucide-react";

export default function NotificationPanel({ notifications, onClose, onDelete, onDeleteAll, onMarkRead, popoverRef, userInitial }) {
  return (
    <div className="notification-popover" ref={popoverRef}>
      <div className="notification-popover-head">
        <div>
          <p className="eyebrow">Hoạt động mới</p>
          <strong>Thông báo hệ thống</strong>
        </div>
        <button className="icon-button" onClick={onClose} title="Đóng" type="button">
          <X size={18} />
        </button>
      </div>
      <div className="notification-popover-list">
        {notifications.length ? (
          notifications.map((item) => (
            <div className={`notification-card ${item.isRead ? "read" : "unread"}`} key={item._id}>
              <button className="notification-card-main" onClick={() => onMarkRead(item)} type="button">
                <span className="notification-avatar">{userInitial}</span>
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.message}</small>
                  <em>{new Date(item.createdAt).toLocaleString("vi-VN")}</em>
                </span>
              </button>
              <button className="icon-button danger" onClick={() => onDelete(item)} title="Xóa thông báo" type="button">
                <Trash2 size={16} />
              </button>
            </div>
          ))
        ) : (
          <div className="notification-empty">Chưa có thông báo mới.</div>
        )}
      </div>
      {notifications.length > 0 && (
        <div className="notification-actions bottom">
          <button className="button small ghost" onClick={onDeleteAll} type="button">
            <Trash2 size={15} />
            Xóa tất cả
          </button>
        </div>
      )}
    </div>
  );
}
