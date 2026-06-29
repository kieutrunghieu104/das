export default function EmptyState({ title = "Chưa có dữ liệu", text = "Dữ liệu sẽ xuất hiện sau khi hệ thống được cập nhật." }) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      <span>{text}</span>
    </div>
  );
}
