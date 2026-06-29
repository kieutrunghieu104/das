import { Camera, ChevronRight, LockKeyhole, UserPen } from "lucide-react";
import { roleLabels } from "../../utils/roles.js";
import LogoutButton from "./LogoutButton.jsx";

export default function ProfileDropdown({
  accountPopoverRef,
  fileInputRef,
  onChangePassword,
  onEditProfile,
  onLogout,
  onUploadAvatar,
  user,
  userInitial
}) {
  return (
    <div className="account-popover" ref={accountPopoverRef}>
      <div className="account-profile-card">
        <span className="account-avatar">
          {user.avatarUrl ? <img src={user.avatarUrl} alt={user.fullName || "Avatar"} /> : userInitial}
        </span>
        <strong>{user.fullName}</strong>
        <small>{roleLabels[user.role] || user.role}</small>
      </div>
      <button onClick={onEditProfile} type="button">
        <UserPen size={19} />
        <span>Thay đổi thông tin cá nhân</span>
        <ChevronRight size={18} />
      </button>
      <button onClick={() => fileInputRef.current?.click()} type="button">
        <Camera size={19} />
        <span>Đổi avatar từ thư viện</span>
        <ChevronRight size={18} />
      </button>
      <button onClick={onChangePassword} type="button">
        <LockKeyhole size={19} />
        <span>Đổi mật khẩu</span>
        <ChevronRight size={18} />
      </button>
      <LogoutButton onLogout={onLogout} />
      <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={onUploadAvatar} />
    </div>
  );
}
