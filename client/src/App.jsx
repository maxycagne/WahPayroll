import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./components/MainLayout";
import { URL } from "./assets/constant";

// Admin & Shared Pages
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Attendance from "./pages/Attendance";
import Leave from "./pages/Leave";
import Payroll from "./pages/Payroll";

// HR Pages
import HRDashboard from "./pages/HRDashboard";
import SalaryHistory from "./pages/SalaryHistory";
import HRReports from "./pages/HRReports";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// --- Placeholders for new Rank & File / Supervisor pages we haven't built yet ---
const SupervisorDashboard = () => (
  <div className="p-6 font-bold text-xl text-gray-900">
    Supervisor Dashboard
  </div>
);
const RankAndFileDashboard = () => (
  <div className="p-6 font-bold text-xl text-gray-900">
    Rank & File Dashboard
  </div>
);
const MyPayslip = () => (
  <div className="p-6 font-bold text-xl text-gray-900">My Payslip</div>
);
const MyAttendance = () => (
  <div className="p-6 font-bold text-xl text-gray-900">
    My Attendance History
  </div>
);
const MyApplications = () => (
  <div className="p-6 font-bold text-xl text-gray-900">
    My Applications (Leave/Offset)
  </div>
);

function App() {
  const queryClient = new QueryClient();

  // Auth & View States
  const [view, setView] = useState("login"); // 'login' or 'main'
  const [user, setUser] = useState(null);

  // Login Form States
  const [email, setEmail] = useState("admin@wah.org"); // Pre-filled for easy testing
  const [password, setPassword] = useState("admin123");
  const [loginError, setLoginError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Check if user is already logged in when the app loads
  useEffect(() => {
    const savedUser = localStorage.getItem("wah_user");
    const savedToken = localStorage.getItem("wah_token");
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setView("main");
    }
  }, []);

  // --- LOGIN FUNCTION ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setIsLoading(true);

    try {
      const res = await fetch(`${URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "69420",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // Save token and user info to browser storage
        localStorage.setItem("wah_token", data.token);
        localStorage.setItem("wah_user", JSON.stringify(data.user));

        setUser(data.user);
        setView("main");
      } else {
        setLoginError(data.message || "Invalid email or password");
      }
    } catch (error) {
      console.error(error);
      setLoginError("Cannot connect to server. Check your network.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- LOGOUT FUNCTION ---
  const handleLogout = () => {
    localStorage.removeItem("wah_token");
    localStorage.removeItem("wah_user");
    setUser(null);
    setView("login");
  };

  // ==========================================
  // LOGIN SCREEN
  // ==========================================
  if (view === "login") {
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

            {/* Error Message Display */}
            {loginError && (
              <div className="mt-4 w-full max-w-[340px] p-3 bg-red-100 text-red-700 text-sm rounded-lg text-center font-semibold border border-red-200">
                {loginError}
              </div>
            )}

            <form
              className="mt-[24px] w-full max-w-[340px] grid gap-3"
              onSubmit={handleLogin}
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
                  className="peer w-full h-full border-[1.8px] border-wah-light rounded-[14px] bg-white px-4 pt-3 text-base text-[#1e2430] outline-none transition-colors duration-150 focus:border-wah-mid invalid:border-wah-light"
                />
                <label
                  htmlFor="email"
                  className="absolute left-3.5 top-1/2 text-wah-accent pointer-events-none -translate-y-1/2 transition-all duration-150 px-[0.2em] peer-focus:-translate-y-[160%] peer-focus:scale-[0.82] peer-focus:bg-wah-card peer-valid:-translate-y-[160%] peer-valid:scale-[0.82] peer-valid:bg-wah-card font-semibold"
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
                  className="absolute left-3.5 top-1/2 text-wah-accent pointer-events-none -translate-y-1/2 transition-all duration-150 px-[0.2em] peer-focus:-translate-y-[160%] peer-focus:scale-[0.82] peer-focus:bg-wah-card peer-valid:-translate-y-[160%] peer-valid:scale-[0.82] peer-valid:bg-wah-card font-semibold"
                >
                  Password
                </label>
              </div>

              <div className="mt-2.5 grid grid-cols-1 gap-2.5">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="h-12 rounded-xl border-0 text-white text-xl font-semibold cursor-pointer bg-gradient-to-r from-wah-primary to-wah-lighter disabled:opacity-50"
                >
                  {isLoading ? "Logging in..." : "Log in"}
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    );
  }

  // ==========================================
  // MAIN ROUTING (AUTH SUCCESSFUL)
  // ==========================================
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route
            element={<MainLayout role={user?.role} onLogout={handleLogout} />}
          >
            {/* --- 1. ADMIN PORTAL --- */}
            {user?.role === "Admin" && (
              <>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/employees" element={<Employees />} />
                <Route path="/attendance" element={<Attendance />} />
                <Route path="/leave" element={<Leave />} />
                <Route path="/payroll" element={<Payroll />} />
                <Route
                  path="*"
                  element={<Navigate to="/dashboard" replace />}
                />
              </>
            )}

            {/* --- 2. SUPERVISOR PORTAL --- */}
            {user?.role === "Supervisor" && (
              <>
                <Route path="/dashboard" element={<SupervisorDashboard />} />
                <Route path="/employees" element={<Employees />} />
                <Route path="/attendance" element={<Attendance />} />
                <Route path="/payroll" element={<Payroll />} />
                <Route path="/leave" element={<Leave />} />
                <Route
                  path="*"
                  element={<Navigate to="/dashboard" replace />}
                />
              </>
            )}

            {/* --- 3. HR PORTAL --- */}
            {user?.role === "HR" && (
              <>
                <Route path="/dashboard" element={<HRDashboard />} />
                <Route path="/employees" element={<Employees />} />
                <Route path="/attendance" element={<Attendance />} />
                <Route path="/leave" element={<Leave />} />
                <Route path="/salary-history" element={<SalaryHistory />} />
                <Route path="/reports" element={<HRReports />} />
                <Route
                  path="*"
                  element={<Navigate to="/dashboard" replace />}
                />
              </>
            )}

            {/* --- 4. RANK & FILE PORTAL --- */}
            {user?.role === "RankAndFile" && (
              <>
                <Route path="/dashboard" element={<RankAndFileDashboard />} />
                <Route path="/my-payslip" element={<MyPayslip />} />
                <Route path="/my-attendance" element={<MyAttendance />} />
                <Route path="/my-applications" element={<MyApplications />} />
                <Route
                  path="*"
                  element={<Navigate to="/dashboard" replace />}
                />
              </>
            )}
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
