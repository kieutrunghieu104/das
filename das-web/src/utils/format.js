const CLINIC_TIME_ZONE = "Asia/Ho_Chi_Minh";

function clinicDateTimeParts(value) {
  if (!value) return null;
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

function dateOnlyText(value) {
  if (typeof value !== "string") return "";
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : "";
}

export function formatDateTime(value) {
  if (!value) return "-";
  const dateOnly = dateOnlyText(value);
  if (dateOnly) return dateOnly;
  const parts = clinicDateTimeParts(value);
  if (!parts) return "-";
  return `${parts.day}/${parts.month}/${parts.year} ${parts.hour}:${parts.minute}`;
}

export function formatDateOnly(value) {
  if (!value) return "-";
  const dateOnly = dateOnlyText(value);
  if (dateOnly) return dateOnly;
  const parts = clinicDateTimeParts(value);
  if (!parts) return "-";
  return `${parts.day}/${parts.month}/${parts.year}`;
}

export function formatTime(value) {
  if (!value) return "-";
  const parts = clinicDateTimeParts(value);
  if (!parts) return "-";
  return `${parts.hour}:${parts.minute}`;
}

export function clinicDateInput(value) {
  const parts = clinicDateTimeParts(value);
  return parts ? `${parts.year}-${parts.month}-${parts.day}` : "";
}

function timeTextFromMinutes(minutes) {
  const hour = String(Math.floor(minutes / 60)).padStart(2, "0");
  const minute = String(minutes % 60).padStart(2, "0");
  return `${hour}:${minute}`;
}

function minutesFromTime(timeText) {
  const [hour, minute] = String(timeText || "").split(":").map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return 0;
  return hour * 60 + minute;
}

function timeFromValue(value) {
  if (typeof value === "string" && /^\d{2}:\d{2}$/.test(value)) return value;
  return formatTime(value);
}

export const bookingSlotOptions = [
  { value: "08:00", slotId: "slot-0800", slotName: "Slot 1", startMinutes: 8 * 60, endMinutes: 10 * 60 + 30 },
  { value: "10:30", slotId: "slot-1030", slotName: "Slot 2", startMinutes: 10 * 60 + 30, endMinutes: 12 * 60 },
  { value: "14:00", slotId: "slot-1400", slotName: "Slot 3", startMinutes: 14 * 60, endMinutes: 16 * 60 },
  { value: "16:00", slotId: "slot-1600", slotName: "Slot 4", startMinutes: 16 * 60, endMinutes: 17 * 60 + 30 }
].map((slot) => {
  const startText = timeTextFromMinutes(slot.startMinutes);
  const endText = timeTextFromMinutes(slot.endMinutes);
  return {
    ...slot,
    timeLabel: `${startText} - ${endText}`,
    label: `${slot.slotName} (${startText} - ${endText})`
  };
});

export function normalizeAppointmentSlots(slots = [], options = {}) {
  const { fallback = true } = options;
  const normalized = slots
    .filter(Boolean)
    .map((slot, index) => {
      const startTime = slot.startTime || slot.value;
      const endTime = slot.endTime || timeTextFromMinutes(slot.endMinutes || minutesFromTime(startTime));
      const startMinutes = minutesFromTime(startTime);
      const endMinutes = minutesFromTime(endTime);
      const slotName = slot.slotName || slot.name || `Slot ${index + 1}`;
      return {
        ...slot,
        value: startTime,
        slotId: String(slot._id || slot.slotId || `slot-${String(startTime).replace(":", "")}`),
        slotName,
        startMinutes,
        endMinutes,
        timeLabel: `${startTime} - ${endTime}`,
        label: `${slotName} (${startTime} - ${endTime})`
      };
    })
    .sort((first, second) => (first.order ?? first.startMinutes) - (second.order ?? second.startMinutes));

  return normalized.length ? normalized : fallback ? bookingSlotOptions : [];
}

function slotIdentity(value) {
  return String(value?._id || value?.slotId || value || "");
}

export function filterOpenSlotsForDate(slots = [], slotClosures = [], date, options = {}) {
  const normalizedSlots = normalizeAppointmentSlots(slots, options);
  if (!date) return normalizedSlots;

  const closedSlotIds = new Set(
    slotClosures
      .filter((item) => item?.isClosed !== false && item.date === date)
      .map((item) => slotIdentity(item.slot))
      .filter(Boolean)
  );

  return normalizedSlots.filter((slot) => !closedSlotIds.has(slotIdentity(slot)));
}

export function getAppointmentSlot(value, slotOptions = bookingSlotOptions) {
  const options = normalizeAppointmentSlots(slotOptions);
  const time = timeFromValue(value);
  const [hour, minute] = time.split(":").map(Number);
  const minutes = hour * 60 + minute;
  return options.find((slot) => slot.value === time) ||
    options.find((slot) => minutes >= slot.startMinutes && minutes < slot.endMinutes) || {
    value: time,
    slotId: `slot-${time.replace(":", "")}`,
    slotName: time,
    timeLabel: time,
    label: time
  };
}

export function formatSlotWithDate(value, slotOrOptions = bookingSlotOptions) {
  const directSlot = Array.isArray(slotOrOptions) ? null : slotOrOptions?.startTime ? normalizeAppointmentSlots([slotOrOptions])[0] : null;
  const slot = directSlot || getAppointmentSlot(value, Array.isArray(slotOrOptions) ? slotOrOptions : bookingSlotOptions);
  return `${formatDateOnly(value)} - ${slot.label}`;
}

export function compareAppointmentsNewestFirst(a, b) {
  const aTime = new Date(a.createdAt || a.updatedAt || a.startAt || 0).getTime();
  const bTime = new Date(b.createdAt || b.updatedAt || b.startAt || 0).getTime();
  return bTime - aTime;
}

export function compareQueueWithinSlot(a, b) {
  const aChecked = Boolean(a.checkedInAt || a.checkInTime);
  const bChecked = Boolean(b.checkedInAt || b.checkInTime);
  if (aChecked !== bChecked) return aChecked ? -1 : 1;

  if (aChecked && bChecked) {
    const aCheckInTime = new Date(a.checkInTime || a.checkedInAt).getTime();
    const bCheckInTime = new Date(b.checkInTime || b.checkedInAt).getTime();
    return aCheckInTime - bCheckInTime;
  }

  const aCreatedTime = new Date(a.createdAt || a.updatedAt || a.startAt || 0).getTime();
  const bCreatedTime = new Date(b.createdAt || b.updatedAt || b.startAt || 0).getTime();
  return bCreatedTime - aCreatedTime;
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
