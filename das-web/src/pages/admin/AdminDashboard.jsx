import { BarChart3, DoorOpen, Settings2, Star, UsersRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import AccountManagement from "../../components/admin/AccountManagement.jsx";
import AdminReportPanel from "../../components/admin/AdminReportPanel.jsx";
import AdminReviewList from "../../components/admin/AdminReviewList.jsx";
import ClinicRoomManagement from "../../components/admin/ClinicRoomManagement.jsx";
import DentalServiceManagement from "../../components/admin/DentalServiceManagement.jsx";
import Feedback from "../../components/Feedback.jsx";
import { api, getErrorMessage } from "../../utils/api.js";
import { todayInput } from "../../utils/format.js";
import { firstError, validateEmail, validateName, validateNote, validatePhone } from "../../utils/validation.js";

const adminFeatures = [
  { id: "stats", label: "Thống kê", icon: BarChart3 },
  { id: "users", label: "Tài khoản", icon: UsersRound },
  { id: "services", label: "Dịch vụ", icon: Settings2 },
  { id: "rooms", label: "Phòng khám", icon: DoorOpen },
  { id: "reviews", label: "Đánh giá", icon: Star }
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
  address: "",
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
  const [users, setUsers] = useState([]);
  const [services, setServices] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
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
      setReviews(res.data.reviews || []);
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

  async function createService(event) {
    event.preventDefault();
    const validationError = firstError(
      validateName(serviceForm.name, "Tên dịch vụ"),
      validateNote(serviceForm.description),
      validateServicePrice(serviceForm.price)
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
        price: normalizeServicePrice(serviceForm.price)
      });
      setServiceForm(defaultServiceForm);
      setMessage("Đã tạo dịch vụ mới.");
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
      setMessage("Đã tạo tài khoản mới. Mật khẩu mặc định: nhakhoa2026");
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
      validateServicePrice(editingService.price)
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
        price: normalizeServicePrice(editingService.price)
      });
      setEditingService(null);
      setMessage("Đã cập nhật thông tin dịch vụ.");
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function deleteService(service) {
    if (!window.confirm(`Xóa dịch vụ ${service.name} khỏi hệ thống?`)) return;

    try {
      setError("");
      setMessage("");
      await api.delete(`/admin/services/${service._id}`);
      setMessage("Đã xóa dịch vụ khỏi hệ thống.");
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

  function startEditRoom(room) {
    setEditingRoom({
      _id: room._id,
      name: room.name || "",
      assignedDentist: room.assignedDentist?._id || "",
      assignedNurse: room.assignedNurse?._id || ""
    });
  }

  async function deleteRoom(room) {
    if (!window.confirm(`Xóa phòng khám ${room.name} khỏi hệ thống?`)) return;
    try {
      setError("");
      setMessage("");
      await api.delete(`/admin/rooms/${room._id}`);
      setMessage("Đã xóa phòng khám khỏi hệ thống.");
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function updateRoom(event) {
    event.preventDefault();
    if (!editingRoom) return;
    const validationError = firstError(
      validateName(editingRoom.name, "Tên phòng"),
      editingRoom.assignedDentist ? "" : "Vui lòng chọn bác sĩ phụ trách phòng khám."
    );
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
        assignedNurse: editingRoom.assignedNurse
      });
      setEditingRoom(null);
      setMessage("Đã cập nhật thông tin phòng khám.");
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
      address: user.address || "",
      role: user.role || "patient"
    });
  }

  async function updateUser(event) {
    event.preventDefault();
    if (!editingUser) return;
    const validationError = firstError(
      validateName(editingUser.fullName),
      editingUser.email?.trim() ? validateEmail(editingUser.email) : "",
      editingUser.phone?.trim() ? validatePhone(editingUser.phone) : ""
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
        address: editingUser.address,
        role: editingUser.role
      });
      setEditingUser(null);
      setMessage("Đã cập nhật thông tin tài khoản.");
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function createRoom(event) {
    event.preventDefault();
    const validationError = firstError(
      validateName(roomForm.name, "Tên phòng"),
      roomForm.assignedDentist ? "" : "Vui lòng chọn bác sĩ phụ trách phòng khám."
    );
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setError("");
      setMessage("");
      await api.post("/admin/rooms", {
        ...roomForm,
        assignedDentist: roomForm.assignedDentist,
        assignedNurse: roomForm.assignedNurse || undefined
      });
      setRoomForm(defaultRoomForm);
      setMessage("Đã tạo phòng khám mới.");
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
      setMessage(isHidden ? "Đã ẩn đánh giá khỏi trang khách." : "Đã hiển thị đánh giá trên trang khách.");
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
      setMessage("Đã tải báo cáo doanh thu theo khoảng thời gian đã chọn.");
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
      setMessage("Đã tải thống kê bệnh nhân theo khoảng thời gian đã chọn.");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  function validateReportRange() {
    if (!reportFilters.startDate || !reportFilters.endDate) {
      setError("Vui lòng chọn đầy đủ ngày bắt đầu và ngày kết thúc.");
      return false;
    }
    if (reportFilters.startDate > reportFilters.endDate) {
      setError("Ngày bắt đầu không được lớn hơn ngày kết thúc.");
      return false;
    }
    return true;
  }

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

function normalizeServicePrice(value) {
  return String(value || "").trim();
}

function validateServicePrice(value) {
  const price = normalizeServicePrice(value);
  if (!price) return "Giá tiền là bắt buộc.";
  return /^\d+(?:-\d+)*$/.test(price) ? "" : "Giá tiền chỉ được nhập số và dấu gạch ngang.";
}
