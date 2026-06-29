import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "../components/AppLayout.jsx";
import { useAuth } from "../redux/AuthContext.jsx";
import AdminDashboard from "../pages/AdminDashboard.jsx";
import AuthPage from "../pages/AuthPage.jsx";
import BookingPage from "../pages/BookingPage.jsx";
import ClinicalDashboard from "../pages/ClinicalDashboard.jsx";
import PatientDashboard from "../pages/PatientDashboard.jsx";
import ProfilePage from "../pages/ProfilePage.jsx";
import PublicHome from "../pages/PublicHome.jsx";
import ReceptionistDashboard from "../pages/ReceptionistDashboard.jsx";
import { canUsePatientBooking, isClinicalRole } from "../utils/roles.js";

function DashboardRouter() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "patient") return <PatientDashboard />;
  if (user.role === "receptionist") return <ReceptionistDashboard />;
  if (isClinicalRole(user.role)) return <ClinicalDashboard />;
  if (user.role === "admin") return <AdminDashboard />;
  return <Navigate to="/" replace />;
}

function PublicLookupRoute() {
  const { user } = useAuth();

  if (user) return <Navigate to="/dashboard" replace />;
  return <PublicHome />;
}

function PatientBookingRoute() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (!canUsePatientBooking(user.role)) return <Navigate to="/dashboard" replace />;
  return <BookingPage />;
}

function PrivateRoute({ children }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<PublicLookupRoute />} />
        <Route path="/dat-lich-hen" element={<PublicLookupRoute />} />
        <Route path="/booking" element={<PatientBookingRoute />} />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route path="/forgot-password" element={<AuthPage mode="forgot" />} />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <ProfilePage />
            </PrivateRoute>
          }
        />
        <Route path="/dashboard" element={<DashboardRouter />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
