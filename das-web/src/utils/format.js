const CLINIC_TIME_ZONE = "Asia/Ho_Chi_Minh";

function clinicDateTimeParts(value) {
  const parts = new Intl.DateTimeFormat("vi-VN", {
    timeZone: CLINIC_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(new Date(value));

  return Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
}

export function formatDateTime(value) {
  if (!value) return "-";
  const parts = clinicDateTimeParts(value);
  return `${parts.day}/${parts.month}/${parts.year} ${parts.hour}:${parts.minute}`;
}

export function formatDateOnly(value) {
  if (!value) return "-";
  const parts = clinicDateTimeParts(value);
  return `${parts.day}/${parts.month}/${parts.year}`;
}

export function formatTime(value) {
  if (!value) return "-";
  const parts = clinicDateTimeParts(value);
  return `${parts.hour}:${parts.minute}`;
}

export function formatMoney(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0
  }).format(value || 0);
}

function formatPricePart(value) {
  const text = String(value ?? "").trim();
  const digits = text.replace(/[^\d]/g, "");
  return digits ? formatMoney(Number(digits)) : text;
}

export function formatPriceText(value) {
  const text = String(value ?? "").trim();
  if (!text) return "";

  const rangeParts = text
    .replace(/[–—~]/g, "-")
    .split(/\s*(?:-|đến|tới|to)\s*/i)
    .filter(Boolean);
  if (rangeParts.length > 1) {
    return rangeParts.map(formatPricePart).join(" - ");
  }

  if (/^\d+(?:\s+\d+)+$/.test(text)) {
    return text.split(/\s+/).map(formatPricePart).join(" - ");
  }

  const plainMoneyText = /^[\d\s.,]+(?:đ|vnd)?$/i.test(text);
  return plainMoneyText ? formatPricePart(text) : text;
}

export function todayInput() {
  const now = new Date();
  const parts = clinicDateTimeParts(now);
  return `${parts.year}-${parts.month}-${parts.day}`;
}
