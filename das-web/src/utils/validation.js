const phonePattern = /^(?:0|\+84)\d{8,10}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseDateInput(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return null;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }

  date.setHours(0, 0, 0, 0);
  return date;
}

function todayStart() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

export function validateName(value, label = "Họ tên") {
  const normalized = value.trim();
  if (normalized.length < 2) return `${label} cần ít nhất 2 ký tự.`;
  if (normalized.length > 120) return `${label} tối đa 120 ký tự.`;
  return "";
}

export function validateEmail(value) {
  if (!emailPattern.test(value.trim())) return "Email không hợp lệ.";
  return "";
}

export function validatePhone(value) {
  if (!phonePattern.test(value.trim())) {
    return "Số điện thoại phải bắt đầu bằng 0 hoặc +84 và có 9-11 chữ số.";
  }
  return "";
}

export function validatePassword(value) {
  if (value.length < 8) return "Mật khẩu cần ít nhất 8 ký tự.";
  if (value.length > 72) return "Mật khẩu tối đa 72 ký tự.";
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) return "Mật khẩu cần có cả chữ cái và chữ số.";
  return "";
}

export function validateDate(value) {
  const date = parseDateInput(value);
  if (!date) return "Ngày không hợp lệ.";
  if (date < todayStart()) return "Ngày không được ở quá khứ.";
  return "";
}

export function validateNote(value, max = 1000) {
  if ((value || "").trim().length > max) return `Ghi chú tối đa ${max} ký tự.`;
  return "";
}

export function requireValue(value, label) {
  return value ? "" : `${label} là bắt buộc.`;
}

export function firstError(...checks) {
  return checks.find(Boolean) || "";
}
