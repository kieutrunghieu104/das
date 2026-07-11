export const roleLabels = {
  user: "Người dùng",
  clinical_staff: "Nhân sự lâm sàng",
  patient: "Bệnh nhân",
  receptionist: "Lễ tân",
  dentist: "Bác sĩ",
  nurse: "Y tá",
  admin: "Quản trị viên"
};

export function canUsePatientBooking(role) {
  return role === "patient";
}

export function canUsePublicLookup(role) {
  return !role;
}

export function isClinicalRole(role) {
  return role === "dentist" || role === "nurse";
}
