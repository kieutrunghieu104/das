export const roleLabels = {
  user: "Người dùng",
  clinical_staff: "Nhân sự lâm sàng",
  patient: "Bệnh nhân",
  receptionist: "Lễ tân",
  dentist: "Bác sĩ",
  nurse: "Y tá",
  admin: "Quản trị viên"
};

const chainLabels = {
  User: "Người dùng",
  "Clinical Staff": "Nhân sự lâm sàng",
  Patient: "Bệnh nhân",
  Receptionist: "Lễ tân",
  Dentist: "Bác sĩ",
  Nurse: "Y tá",
  Admin: "Quản trị viên",
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

export function formatInheritanceChain(chain, fallbackRole) {
  if (Array.isArray(chain) && chain.length) {
    return chain.map((item) => chainLabels[item] || item).join(" > ");
  }

  return chainLabels[fallbackRole] || fallbackRole || "-";
}
