import { LogOut } from "lucide-react";

export default function LogoutButton({ onLogout }) {
  return (
    <button onClick={onLogout} type="button">
      <LogOut size={19} />
      <span>Đăng xuất</span>
    </button>
  );
}
