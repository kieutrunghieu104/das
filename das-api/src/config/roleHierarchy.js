export const ROLE_HIERARCHY = {
  user: {
    label: "Người dùng",
    parent: null,
    abstract: true,
    description: "Tài khoản nền dùng cho đăng nhập, phân quyền, hồ sơ, thông báo và bảo mật."
  },
  clinical_staff: {
    label: "Nhân sự lâm sàng",
    parent: "user",
    abstract: true,
    description: "Nhóm vai trò lâm sàng gồm nha sĩ và y tá, có lịch làm việc và hồ sơ điều trị."
  },
  patient: {
    label: "Bệnh nhân",
    parent: "user",
    abstract: false,
    profileCollection: "patients",
    description: "Bệnh nhân đặt lịch online, xem lịch sử khám, hủy/dời lịch và đánh giá dịch vụ."
  },
  receptionist: {
    label: "Lễ tân",
    parent: "user",
    abstract: false,
    profileCollection: "receptionists",
    description: "Lễ tân xác nhận hoặc từ chối lịch hẹn, check-in bệnh nhân và xử lý no-show."
  },
  dentist: {
    label: "Bác sĩ",
    parent: "clinical_staff",
    abstract: false,
    profileCollection: "dentists",
    description: "Nha sĩ quản lý lịch làm việc, xem bệnh nhân và ghi kết quả khám điều trị."
  },
  nurse: {
    label: "Y tá",
    parent: "clinical_staff",
    abstract: false,
    profileCollection: "nurses",
    description: "Y tá hỗ trợ lâm sàng, ghi sinh hiệu, cập nhật ghi chú điều trị và trạng thái phòng."
  },
  admin: {
    label: "Quản trị viên",
    parent: "user",
    abstract: false,
    profileCollection: "adminprofiles",
    description: "Quản trị viên hoặc quản lý cấu hình master data, dashboard và báo cáo thống kê."
  }
};

export function getInheritanceChain(roleName) {
  const chain = [];
  let current = roleName;

  while (current && ROLE_HIERARCHY[current]) {
    chain.unshift(ROLE_HIERARCHY[current].label);
    current = ROLE_HIERARCHY[current].parent;
  }

  return chain;
}

export function getConcreteRoles() {
  return Object.entries(ROLE_HIERARCHY)
    .filter(([, value]) => !value.abstract)
    .map(([key]) => key);
}

export function getRoleHierarchyList() {
  return Object.entries(ROLE_HIERARCHY).map(([key, value]) => ({
    role: key,
    ...value,
    inheritanceChain: getInheritanceChain(key)
  }));
}
