export const WORKING_DAYS = [0, 1, 2, 3, 4, 5, 6];

const CLINIC_UTC_OFFSET_MINUTES = 7 * 60;

function parseDateParts(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  if (!year || !month || !day) {
    throw new Error("Date must use YYYY-MM-DD format");
  }
  return { year, month, day };
}

export function combineDateAndTime(dateString, timeString) {
  const { year, month, day } = parseDateParts(dateString);
  const [hour, minute] = timeString.split(":").map(Number);
  return clinicDateTimeToUtcDate(year, month, day, hour, minute);
}

export function startOfLocalDay(dateString) {
  const { year, month, day } = parseDateParts(dateString);
  return clinicDateTimeToUtcDate(year, month, day, 0, 0);
}

export function endOfLocalDay(dateString) {
  const { year, month, day } = parseDateParts(dateString);
  return new Date(clinicDateTimeToUtcDate(year, month, day, 0, 0).getTime() + 24 * 60 * 60 * 1000 - 1);
}

function clinicDateTimeToUtcDate(year, month, day, hour, minute) {
  return new Date(Date.UTC(year, month - 1, day, hour, minute) - CLINIC_UTC_OFFSET_MINUTES * 60_000);
}

function toClinicShiftedDate(date) {
  return new Date(date.getTime() + CLINIC_UTC_OFFSET_MINUTES * 60_000);
}

export function isWorkingDate(dateString) {
  const { year, month, day } = parseDateParts(dateString);
  const dayOfWeek = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return WORKING_DAYS.includes(dayOfWeek);
}

export function toDateInputValue(date) {
  const shifted = toClinicShiftedDate(date);
  const year = shifted.getUTCFullYear();
  const month = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const day = String(shifted.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
