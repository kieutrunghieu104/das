import { BarChart3, DoorOpen, Settings2, Star, UsersRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import AccountManagement from "../components/admin/AccountManagement.jsx";
import AdminReportPanel from "../components/admin/AdminReportPanel.jsx";
import AdminReviewList from "../components/admin/AdminReviewList.jsx";
import ClinicRoomManagement from "../components/admin/ClinicRoomManagement.jsx";
import DentalServiceManagement from "../components/admin/DentalServiceManagement.jsx";
import StaffScheduleManagement from "../components/admin/StaffScheduleManagement.jsx";
import Feedback from "../components/Feedback.jsx";
import { api, getErrorMessage } from "../utils/api.js";
import { todayInput } from "../utils/format.js";
import { firstError, requireValue, validateDate, validateEmail, validateName, validateNote, validatePhone } from "../utils/validation.js";

const adminFeatures = [
  { id: "stats", label: "Thống kê", icon: BarChart3 },
  { id: "users", label: "Tài khoản", icon: UsersRound },
  { id: "services", label: "Dịch vụ", icon: Settings2 },
  { id: "rooms", label: "Phòng khám", icon: DoorOpen },
  { id: "reviews", label: "Đánh giá", icon: Star }
];

const staffRoles = ["dentist", "nurse", "receptionist"];
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
const clinicSessions = [
  { start: "08:00", end: "11:30" },
  { start: "14:00", end: "17:30" }
];

const defaultServiceForm = {
  name: "",
  description: "",
  price: ""
};

const defaultUserForm = {
  fullName: "",
  email: "",
  phone: "",
  role: "patient"
};

const defaultRoomForm = {
  name: "",
  assignedDentist: "",
  assignedNurse: ""
};

export default function AdminDashboard() {
  const location = useLocation();
  const [activeFeature, setActiveFeature] = useState("stats");
  const [stats, setStats] = useState(null);
  const [roleHierarchy, setRoleHierarchy] = useState([]);
  const [users, setUsers] = useState([]);
  const [services, setServices] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [schedulesLoaded, setSchedulesLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [revenueReport, setRevenueReport] = useState(null);
  const [patientStatistics, setPatientStatistics] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reportFilters, setReportFilters] = useState({
    startDate: todayInput().slice(0, 8) + "01",
    endDate: todayInput()
  });
  const [serviceForm, setServiceForm] = useState(defaultServiceForm);
  const [editingService, setEditingService] = useState(null);
  const [userForm, setUserForm] = useState(defaultUserForm);
  const [editingUser, setEditingUser] = useState(null);
  const [roomForm, setRoomForm] = useState(defaultRoomForm);
  const [editingRoom, setEditingRoom] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({
    userId: "",
    timeSlotId: "",
    roomId: "",
    workDate: todayInput(),
    startTime: "08:00",
    endTime: "11:30"
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await api.get("/admin/dashboard");
      setStats(res.data.stats);
      setUsers(res.data.users);
      setServices(res.data.services);
      setRooms(res.data.rooms);
      setRoleHierarchy(res.data.roleHierarchy);
      setTimeSlots(res.data.timeSlots);
      setReviews(res.data.reviews || []);
      setScheduleForm((current) => ({
        ...current,
        userId: current.userId || res.data.users.find((item) => ["dentist", "nurse", "receptionist"].includes(item.role))?._id || "",
        timeSlotId: current.timeSlotId || res.data.timeSlots[0]?._id || "",
        roomId: current.roomId || res.data.rooms[0]?._id || "",
        workDate: current.workDate || todayInput()
      }));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    load();
  }, [activeFeature]);

  useEffect(() => {
    const tab = new URLSearchParams(location.search).get("tab");
    if (adminFeatures.some((item) => item.id === tab)) {
      setActiveFeature(tab);
    }
  }, [location.search]);

  useEffect(() => {
    if (activeFeature === "schedules" && !schedulesLoaded) {
      loadSchedules();
    }
  }, [activeFeature, schedulesLoaded]);

  async function loadSchedules() {
    try {
      const res = await api.get("/admin/staff-schedules", { params: { limit: 80 } });
      setSchedules(res.data.schedules);
      setSchedulesLoaded(true);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function createService(event) {
    event.preventDefault();
    const validationError = firstError(
      validateName(serviceForm.name, "Tên dịch vụ"),
      validateNote(serviceForm.description),
      String(serviceForm.price || "").trim() ? "" : "Giá tiền là bắt buộc."
    );
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setError("");
      setMessage("");
      await api.post("/admin/services", {
        ...serviceForm,
        price: String(serviceForm.price)
      });
      setServiceForm(defaultServiceForm);
      setMessage("Đã tạo dịch vụ.");
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function createUser(event) {
    event.preventDefault();
    const validationError = firstError(
      validateName(userForm.fullName),
      userForm.email?.trim() ? validateEmail(userForm.email) : "",
      validatePhone(userForm.phone)
    );
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setError("");
      setMessage("");
      await api.post("/admin/users", {
        ...userForm,
        password: "nhakhoa2026"
      });
      setUserForm(defaultUserForm);
      setMessage("Đã tạo tài khoản. Mật khẩu mặc định: nhakhoa2026");
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  function startEditService(service) {
    setEditingService({
      _id: service._id,
      name: service.name || "",
      description: service.description || "",
      price: service.price || ""
    });
  }

  async function updateService(event) {
    event.preventDefault();
    if (!editingService) return;
    const validationError = firstError(
      validateName(editingService.name, "Tên dịch vụ"),
      validateNote(editingService.description),
      String(editingService.price || "").trim() ? "" : "Giá tiền là bắt buộc."
    );
    if (validationError) {
      setError(validationError);
      return;
    }
    try {
      setError("");
      setMessage("");
      await api.patch(`/admin/services/${editingService._id}`, {
        name: editingService.name,
        description: editingService.description,
        price: String(editingService.price)
      });
      setEditingService(null);
      setMessage("Đã cập nhật dịch vụ.");
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function deleteService(service) {
    if (!window.confirm(`Xóa dịch vụ ${service.name}?`)) return;

    try {
      setError("");
      setMessage("");
      await api.delete(`/admin/services/${service._id}`);
      setMessage("Đã xóa dịch vụ.");
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function updateUserStatus(id, status) {
    try {
      setError("");
      setMessage("");
      await api.patch(`/admin/users/${id}`, { status });
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function resetUserPassword(user) {
    const confirmed = window.confirm(`Đặt lại mật khẩu cho ${user.fullName}? Mật khẩu cũ sẽ không thể xem lại.`);
    if (!confirmed) return;

    try {
      setError("");
      setMessage("");
      const res = await api.post(`/admin/users/${user._id}/reset-password`);
      setUsers((current) => current.map((item) => (item._id === user._id ? res.data.user : item)));
      setMessage(`Đã đặt lại mật khẩu cho ${user.fullName}. Mật khẩu tạm thời: ${res.data.temporaryPassword}`);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  function startEditRoom(room) {
    setEditingRoom({
      _id: room._id,
      name: room.name || "",
      assignedDentist: room.assignedDentist?._id || "",
      assignedNurse: room.assignedNurse?._id || "",
      status: room.status || "available",
      equipmentText: Array.isArray(room.equipment) ? room.equipment.join(", ") : "",
      isActive: room.isActive !== false
    });
  }

  async function deleteRoom(room) {
    if (!window.confirm(`Xóa phòng khám ${room.name}?`)) return;
    try {
      setError("");
      setMessage("");
      await api.delete(`/admin/rooms/${room._id}`);
      setMessage("Đã xóa phòng khám.");
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function updateRoom(event) {
    event.preventDefault();
    if (!editingRoom) return;
    const validationError = firstError(validateName(editingRoom.name, "Tên phòng"));
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setError("");
      setMessage("");
      await api.patch(`/admin/rooms/${editingRoom._id}`, {
        name: editingRoom.name,
        assignedDentist: editingRoom.assignedDentist,
        assignedNurse: editingRoom.assignedNurse,
        equipment: parseCommaList(editingRoom.equipmentText)
      });
      setEditingRoom(null);
      setMessage("Đã cập nhật phòng khám.");
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  function startEditUser(user) {
    setEditingUser({
      _id: user._id,
      fullName: user.fullName || "",
      email: user.email || "",
      phone: user.phone || "",
      status: user.status || "active",
      bio: user.bio || "",
      yearsOfExperience: user.yearsOfExperience || 0
    });
  }

  async function updateUser(event) {
    event.preventDefault();
    if (!editingUser) return;
    const validationError = firstError(
      validateName(editingUser.fullName),
      editingUser.email?.trim() ? validateEmail(editingUser.email) : "",
      editingUser.phone?.trim() ? validatePhone(editingUser.phone) : "",
      validateNote(editingUser.bio)
    );
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setError("");
      setMessage("");
      await api.patch(`/admin/users/${editingUser._id}`, {
        fullName: editingUser.fullName,
        email: editingUser.email,
        phone: editingUser.phone,
        status: editingUser.status,
        bio: editingUser.bio,
        yearsOfExperience: Number(editingUser.yearsOfExperience || 0)
      });
      setEditingUser(null);
      setMessage("Đã cập nhật tài khoản.");
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function createRoom(event) {
    event.preventDefault();
    const validationError = firstError(validateName(roomForm.name, "Tên phòng"));
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setError("");
      setMessage("");
      await api.post("/admin/rooms", {
        ...roomForm,
        assignedDentist: roomForm.assignedDentist || undefined,
        assignedNurse: roomForm.assignedNurse || undefined
      });
      setRoomForm(defaultRoomForm);
      setMessage("Đã tạo phòng khám.");
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }
  async function toggleReviewVisibility(review, isHidden) {
    try {
      setError("");
      setMessage("");
      const res = await api.patch(`/admin/reviews/${review._id}`, { isHidden });
      setReviews((current) => current.map((item) => (item._id === review._id ? res.data.review : item)));
      setMessage(isHidden ? "Đã ẩn đánh giá." : "Đã hiện đánh giá.");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function createSchedule(event) {
    event.preventDefault();
    const validationError = firstError(
      requireValue(scheduleForm.userId, "Nhân sự"),
      requireValue(scheduleForm.timeSlotId, "Ca làm"),
      validateDate(scheduleForm.workDate),
      validateTimeRange(scheduleForm.startTime, scheduleForm.endTime)
    );
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setError("");
      setMessage("");
      await api.post("/admin/staff-schedules", {
        ...scheduleForm,
        roomId: scheduleForm.roomId || undefined
      });
      setMessage("Đã tạo lịch nhân sự.");
      await loadSchedules();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function updateScheduleStatus(id, status) {
    try {
      setError("");
      setMessage("");
      await api.patch(`/admin/staff-schedules/${id}`, { status });
      await loadSchedules();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function exportReport() {
    try {
      setError("");
      setMessage("");
      const res = await api.get("/admin/reports/export");
      setReport(res.data);
      downloadJson(res.data, "das-report.json");
      setMessage("Đã tạo file báo cáo JSON.");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function loadRevenueReport() {
    if (!validateReportRange()) return;
    try {
      setError("");
      setMessage("");
      const res = await api.get("/admin/reports/revenue", { params: reportFilters });
      setRevenueReport(res.data);
      setMessage("Đã tải báo cáo doanh thu.");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function loadPatientStatistics() {
    if (!validateReportRange()) return;
    try {
      setError("");
      setMessage("");
      const res = await api.get("/admin/reports/patient-statistics", { params: reportFilters });
      setPatientStatistics(res.data);
      setMessage("Đã tải thống kê bệnh nhân.");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  function validateReportRange() {
    if (!reportFilters.startDate || !reportFilters.endDate) {
      setError("Chọn đầy đủ từ ngày và đến ngày.");
      return false;
    }
    if (reportFilters.startDate > reportFilters.endDate) {
      setError("Từ ngày không được lớn hơn đến ngày.");
      return false;
    }
    return true;
  }

  const assignableUsers = users.filter((user) => staffRoles.includes(user.role));
  const dentistUsers = users.filter((user) => user.role === "dentist");
  const nurseUsers = users.filter((user) => user.role === "nurse");

  return (
    <div className="page-grid">
      <Feedback error={error} message={message} />

      {activeFeature === "users" && (
        <AccountManagement
          editingUser={editingUser}
          loading={loading}
          onCreateUser={createUser}
          onEditUser={startEditUser}
          onEditingUserChange={(next) => setEditingUser((current) => ({ ...current, ...next }))}
          onSubmitEditUser={updateUser}
          onCancelEditUser={() => setEditingUser(null)}
          onResetUserPassword={resetUserPassword}
          onUpdateUserStatus={updateUserStatus}
          onUserFormChange={(next) => setUserForm((current) => ({ ...current, ...next }))}
          userForm={userForm}
          users={users}
        />
      )}

      {activeFeature === "services" && (
        <DentalServiceManagement
          editingService={editingService}
          loading={loading}
          onCreateService={createService}
          onCancelEditService={() => setEditingService(null)}
          onEditingServiceChange={(next) => setEditingService((current) => ({ ...current, ...next }))}
          onServiceFormChange={(next) => setServiceForm((current) => ({ ...current, ...next }))}
          onDeleteService={deleteService}
          onEditService={startEditService}
          onUpdateService={updateService}
          serviceForm={serviceForm}
          services={services}
        />
      )}

      {activeFeature === "rooms" && (
        <ClinicRoomManagement
          dentistUsers={dentistUsers}
          editingRoom={editingRoom}
          loading={loading}
          nurseUsers={nurseUsers}
          onCancelEditRoom={() => setEditingRoom(null)}
          onCreateRoom={createRoom}
          onEditingRoomChange={(next) => setEditingRoom((current) => ({ ...current, ...next }))}
          onRoomFormChange={(next) => setRoomForm((current) => ({ ...current, ...next }))}
          onDeleteRoom={deleteRoom}
          onEditRoom={startEditRoom}
          onUpdateRoom={updateRoom}
          roomForm={roomForm}
          rooms={rooms}
        />
      )}
      {activeFeature === "stats" && (
        <AdminReportPanel
          onLoadPatientStatistics={loadPatientStatistics}
          onLoadRevenueReport={loadRevenueReport}
          onReportFiltersChange={(next) => setReportFilters((current) => ({ ...current, ...next }))}
          patientStatistics={patientStatistics}
          reportFilters={reportFilters}
          revenueReport={revenueReport}
          stats={stats}
        />
      )}

      {activeFeature === "reviews" && (
        <AdminReviewList loading={loading} onToggleVisibility={toggleReviewVisibility} reviews={reviews} />
      )}
    </div>
  );
}

function validateTimeRange(startTime, endTime) {
  if (!timePattern.test(startTime) || !timePattern.test(endTime)) return "Giờ phải theo định dạng HH:mm.";
  if (startTime >= endTime) return "Giờ bắt đầu phải trước giờ kết thúc.";
  if (!clinicSessions.some((session) => startTime >= session.start && endTime <= session.end)) {
    return "Thời gian phải nằm trong ca sáng 08:00 - 11:30 hoặc ca chiều 14:00 - 17:30.";
  }
  return "";
}

function parseCommaList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function downloadJson(payload, filename) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}


