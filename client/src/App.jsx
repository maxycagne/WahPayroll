import { useEffect, useMemo, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import MainLayout from "./components/MainLayout";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Attendance from "./pages/Attendance";
import Leave from "./pages/Leave";
import Payroll from "./pages/Payroll";
import Settings from "./pages/Settings";
import FileManagement from "./pages/FileManagement1";
import HRDashboard from "./pages/HRDashboard";
import SalaryHistory from "./pages/SalaryHistory";
import HRReports from "./pages/HRReports";
import Payslips from "./pages/Payslips";
import Reports from "./pages/Reports";
import MyReports from "./pages/MyReports";
import Login from "./pages/Login";
import PostLoginLoading from "./pages/PostLoginLoading";
import { useAuthStore } from "@/stores/authStore";
import { registerUnauthorizedHandler } from "@/stores/authNavigation";
import axiosInterceptor from "./hooks/interceptor";

function RoleProtectedRoute({ user, allowedRoles, children }) {
  if (!user) return <Navigate to="/" replace />;

  if (!allowedRoles.includes(user.role)) {
    const defaultPath = user.role === "HR" ? "/hr-dashboard" : "/dashboard";
    return <Navigate to={defaultPath} replace />;
  }

  return children;
}

function AppRoutes({ user, isBootstrapping }) {
  const role = user?.role;
  const hasSession = Boolean(user);

  const defaultPathByRole = {
    Admin: "/dashboard",
    Supervisor: "/dashboard",
    HR: "/hr-dashboard",
    RankAndFile: "/dashboard",
  };

  if (isBootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#3d0d74] via-[#50109a] to-[#6c2eb9] p-6 text-white">
        Restoring your session...
      </div>
    );
  }

  if (!hasSession) {
    return (
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/loading" replace />} />
      <Route path="/loading" element={<PostLoginLoading user={user} />} />
      <Route element={<MainLayout role={role} />}>
        <Route
          path="/dashboard"
          element={
            <RoleProtectedRoute
              user={user}
              allowedRoles={["Admin", "Supervisor", "RankAndFile"]}
            >
              <Dashboard />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/hr-dashboard"
          element={
            <RoleProtectedRoute user={user} allowedRoles={["HR"]}>
              <HRDashboard />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/employees"
          element={
            <RoleProtectedRoute
              user={user}
              allowedRoles={["Admin", "Supervisor", "HR"]}
            >
              <Employees />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/attendance"
          element={
            <RoleProtectedRoute
              user={user}
              allowedRoles={["Admin", "Supervisor", "HR"]}
            >
              <Attendance />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/leave"
          element={
            <RoleProtectedRoute
              user={user}
              allowedRoles={["Admin", "Supervisor", "HR", "RankAndFile"]}
            >
              <Leave />
            </RoleProtectedRoute>
          }
        />
        <Route path="/settings" element={<Settings />} />
        <Route
          path="/file-management"
          element={
            <RoleProtectedRoute
              user={user}
              allowedRoles={["Admin", "Supervisor", "HR", "RankAndFile"]}
            >
              <FileManagement />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/payroll"
          element={
            <RoleProtectedRoute user={user} allowedRoles={["Admin", "HR"]}>
              <Payroll />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/salary-history"
          element={
            <RoleProtectedRoute
              user={user}
              allowedRoles={["Admin", "Supervisor"]}
            >
              <SalaryHistory />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <RoleProtectedRoute
              user={user}
              allowedRoles={["Admin", "Supervisor", "HR"]}
            >
              <HRReports />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/payroll-reports"
          element={
            <RoleProtectedRoute user={user} allowedRoles={["Admin"]}>
              <Reports />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/payslips"
          element={
            <RoleProtectedRoute
              user={user}
              allowedRoles={["Supervisor", "HR", "RankAndFile"]}
            >
              <Payslips />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/my-reports"
          element={
            <RoleProtectedRoute user={user} allowedRoles={["RankAndFile"]}>
              <MyReports />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="*"
          element={
            <Navigate to={defaultPathByRole[role] || "/dashboard"} replace />
          }
        />
      </Route>
    </Routes>
  );
}

function AuthNavigationBridge() {
  const navigate = useNavigate();

  useEffect(
    () =>
      registerUnauthorizedHandler(() => {
        navigate("/", { replace: true });
      }),
    [navigate],
  );

  return null;
}

const queryClient = new QueryClient();

export default function App() {
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const clearSession = useAuthStore((state) => state.clearSession);

  const hasToken = useMemo(() => Boolean(token), [token]);

  useEffect(() => {
    const bootstrapAuth = async () => {
      if (!token) {
        setIsBootstrapping(false);
        return;
      }

      try {
        const res = await axiosInterceptor.get("/api/auth/me");
        setUser(res.data.user);
      } catch {
        clearSession();
      } finally {
        setIsBootstrapping(false);
      }
    };

    bootstrapAuth();
  }, [clearSession, setUser, token]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthNavigationBridge />
        <AppRoutes
          user={hasToken ? user : null}
          isBootstrapping={isBootstrapping}
        />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
