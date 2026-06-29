import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export default function PasswordField({ value, onChange, ...props }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="password-field">
      <input
        {...props}
        type={visible ? "text" : "password"}
        value={value}
        onChange={onChange}
      />
      <button
        aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
        className="password-toggle"
        onClick={() => setVisible((current) => !current)}
        type="button"
      >
        {visible ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </div>
  );
}
