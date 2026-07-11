const CLINIC_TIME_ZONE = "Asia/Ho_Chi_Minh";

export const bookingSlotOptions = [
  { value: "08:00", slotId: "slot-1", slotName: "Slot 1", timeLabel: "8h-10h30", label: "Slot 1 (8h-10h30)", startMinutes: 8 * 60, endMinutes: 10 * 60 + 30 },
  { value: "10:30", slotId: "slot-2", slotName: "Slot 2", timeLabel: "10h30-12h", label: "Slot 2 (10h30-12h)", startMinutes: 10 * 60 + 30, endMinutes: 12 * 60 },
  { value: "14:00", slotId: "slot-3", slotName: "Slot 3", timeLabel: "14h-16h", label: "Slot 3 (14h-16h)", startMinutes: 14 * 60, endMinutes: 16 * 60 },
  { value: "16:00", slotId: "slot-4", slotName: "Slot 4", timeLabel: "16h-17h30", label: "Slot 4 (16h-17h30)", startMinutes: 16 * 60, endMinutes: 17 * 60 + 30 }
];

function clinicDateTimeParts(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const parts = new Intl.DateTimeFormat("vi-VN", {
    timeZone: CLINIC_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date);

  return Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
}

export function clinicDateInput(value) {
  const parts = clinicDateTimeParts(value);
  return parts ? `${parts.year}-${parts.month}-${parts.day}` : "";
}

function formatClinicDate(value) {
  const parts = clinicDateTimeParts(value);
  return parts ? `${parts.day}/${parts.month}/${parts.year}` : "-";
}

function minutesOfClinicDay(value) {
  const parts = clinicDateTimeParts(value);
  if (!parts) return 0;
  return Number(parts.hour) * 60 + Number(parts.minute);
}

export function getAppointmentSlot(value) {
  const minutes = minutesOfClinicDay(value);
  return bookingSlotOptions.find((slot) => minutes >= slot.startMinutes && minutes < slot.endMinutes) || bookingSlotOptions[0];
}

function formatSlotOnly(value) {
  const slot = getAppointmentSlot(value);
  return `${slot.slotName} (${slot.timeLabel})`;
}

export function formatSlotWithDate(value) {
  return `${formatClinicDate(value)} - ${formatSlotOnly(value)}`;
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
