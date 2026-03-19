import { useEffect, useMemo, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import MainLayout from "./components/MainLayout";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Attendance from "./pages/Attendance";
import Leave from "./pages/Leave";
import Payroll from "./pages/Payroll";
import SalaryHistory from "./pages/SalaryHistory";
import HRReports from "./pages/HRReports";
import Payslips from "./pages/Payslips";
import Reports from "./pages/Reports";
import { apiFetch } from "./lib/api";

const STORAGE_TOKEN_KEY = "wah_token";
const STORAGE_USER_KEY = "wah_user";

const safeParseUser = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_USER_KEY) || "null");
  } catch {
    return null;
  }
};

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const res = await apiFetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Invalid email or password");
      }

      onLogin(data.token, data.user);
    } catch (err) {
      setError(err.message || "Unable to sign in");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center p-7 bg-gradient-to-br from-[#50109a] to-wah-accent">
      <div className="w-full max-w-[500px] bg-wah-card rounded-[14px] overflow-hidden shadow-lg">
        <section className="px-12 py-16 flex flex-col items-center">
          <img
            className="w-[150px] h-[150px] object-contain mb-6"
            src="/images/wah-logo.png"
            alt="WAH logo"
          />

          <h1 className="m-0 max-w-[320px] text-center text-[clamp(1.6rem,2vw,1.8rem)] leading-[1.15] text-wah-text">
            Welcome to Wireless Access For Health Payroll System
          </h1>

          <form
            className="mt-[34px] w-full max-w-[340px] grid gap-3"
            onSubmit={handleSubmit}
          >
            <div className="relative w-full h-14">
              <input
                required
                id="email"
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="off"
                className="peer w-full h-full border-[1.8px] border-wah-light rounded-[14px] bg-white px-4 pt-3 text-base text-[#1e2430] outline-none transition-colors duration-150 focus:border-wah-mid"
              />
              <label
                htmlFor="email"
                className="absolute left-3.5 top-1/2 text-wah-accent pointer-events-none -translate-y-1/2 transition-all duration-150 px-[0.2em] peer-focus:-translate-y-[160%] peer-focus:scale-[0.82] peer-focus:bg-wah-card peer-focus:text-wah-mid peer-valid:-translate-y-[160%] peer-valid:scale-[0.82] peer-valid:bg-wah-card peer-valid:text-wah-mid"
              >
                Email
              </label>
            </div>

            <div className="relative w-full h-14">
              <input
                required
                id="password"
                type="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="off"
                className="peer w-full h-full border-[1.8px] border-wah-light rounded-[14px] bg-white px-4 pt-3 text-base text-[#1e2430] outline-none transition-colors duration-150 focus:border-wah-mid"
              />
              <label
                htmlFor="password"
                className="absolute left-3.5 top-1/2 text-wah-accent pointer-events-none -translate-y-1/2 transition-all duration-150 px-[0.2em] peer-focus:-translate-y-[160%] peer-focus:scale-[0.82] peer-focus:bg-wah-card peer-focus:text-wah-mid peer-valid:-translate-y-[160%] peer-valid:scale-[0.82] peer-valid:bg-wah-card peer-valid:text-wah-mid"
              >
                Password
              </label>
            </div>

            {error && (
              <p className="m-0 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <div className="mt-2.5 grid grid-cols-1 gap-2.5">
              <button
                type="submit"
                disabled={isSubmitting}
                className="h-12 rounded-xl border-0 text-white text-xl font-semibold cursor-pointer bg-gradient-to-r from-wah-primary to-wah-lighter disabled:opacity-60"
              >
                {isSubmitting ? "Signing in..." : "Log in"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}

function RoleProtectedRoute({ user, allowedRoles, children }) {
  if (!user) return <Navigate to="/" replace />;

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function AppRoutes({ user, onLogout }) {
  const role = user?.role;

  const defaultPathByRole = {
    Admin: "/dashboard",
    Supervisor: "/dashboard",
    HR: "/dashboard",
    RankAndFile: "/dashboard",
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout role={role} onLogout={onLogout} />}>
          <Route path="/dashboard" element={<Dashboard />} />

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

          <Route path="/leave" element={<Leave />} />

          <Route
            path="/payroll"
            element={
              <RoleProtectedRoute
                user={user}
                allowedRoles={["Admin", "Supervisor", "HR"]}
              >
                <Payroll />
              </RoleProtectedRoute>
            }
          />

          <Route
            path="/salary-history"
            element={
              <RoleProtectedRoute
                user={user}
                allowedRoles={["Admin", "Supervisor", "HR"]}
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
              <RoleProtectedRoute
                user={user}
                allowedRoles={["Admin", "Supervisor"]}
              >
                <Reports />
              </RoleProtectedRoute>
            }
          />

          <Route
            path="/payslips"
            element={
              <RoleProtectedRoute
                user={user}
                allowedRoles={["Admin", "Supervisor", "HR", "RankAndFile"]}
              >
                <Payslips />
              </RoleProtectedRoute>
            }
          />

          <Route
            path="*"
            element={<Navigate to={defaultPathByRole[role] || "/dashboard"} replace />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  const [queryClient] = useState(() => new QueryClient());
  const [user, setUser] = useState(() => safeParseUser());
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const hasToken = useMemo(
    () => Boolean(localStorage.getItem(STORAGE_TOKEN_KEY)),
    [user],
  );

  useEffect(() => {
    const bootstrapAuth = async () => {
      const token = localStorage.getItem(STORAGE_TOKEN_KEY);

      if (!token) {
        setIsBootstrapping(false);
        return;
      }

      try {
        const res = await apiFetch("/api/auth/me");

        if (!res.ok) {
          throw new Error("Session expired");
        }

        const data = await res.json();
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(data.user));
        setUser(data.user);
      } catch {
        localStorage.removeItem(STORAGE_TOKEN_KEY);
        localStorage.removeItem(STORAGE_USER_KEY);
        setUser(null);
      } finally {
        setIsBootstrapping(false);
      }
    };

    bootstrapAuth();
  }, []);

  const handleLogin = (token, nextUser) => {
    localStorage.setItem(STORAGE_TOKEN_KEY, token);
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_TOKEN_KEY);
    localStorage.removeItem(STORAGE_USER_KEY);
    setUser(null);
  };

  if (isBootstrapping) {
    return <div className="p-6 font-bold text-gray-900">Initializing session...</div>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      {!hasToken || !user ? (
        <LoginScreen onLogin={handleLogin} />
      ) : (
        <AppRoutes user={user} onLogout={handleLogout} />
      )}
    </QueryClientProvider>
  );
}
