import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./components/MainLayout";

// Admin Pages
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Attendance from "./pages/Attendance";
import Leave from "./pages/Leave";
import Payroll from "./pages/Payroll";

// HR Pages
import HRDashboard from "./pages/HRDashboard"; // <--- 1. IMPORT ADDED HERE
import SalaryHistory from "./pages/SalaryHistory";
import HRReports from "./pages/HRReports";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

function App() {
  const [view, setView] = useState("login");
  const [role, setRole] = useState("Admin");

  const handleLogin = (e) => {
    e.preventDefault();
    setView("main");
  };
  const queryClient = new QueryClient();

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

            <form
              className="mt-[34px] w-full max-w-[340px] grid gap-3"
              onSubmit={handleLogin}
            >
              <div className="relative w-full h-14">
                <input
                  id="email"
                  type="email"
                  name="email"
                  autoComplete="off"
                  className="peer w-full h-full border-[1.8px] border-wah-light rounded-[14px] bg-white px-4 text-base text-[#1e2430] outline-none transition-colors duration-150 focus:border-wah-mid invalid:border-wah-light"
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
                  id="password"
                  type="password"
                  name="password"
                  autoComplete="off"
                  className="peer w-full h-full border-[1.8px] border-wah-light rounded-[14px] bg-white px-4 pr-[42px] text-base text-[#1e2430] outline-none transition-colors duration-150 focus:border-wah-mid"
                />
                <label
                  htmlFor="password"
                  className="absolute left-3.5 top-1/2 text-wah-accent pointer-events-none -translate-y-1/2 transition-all duration-150 px-[0.2em] peer-focus:-translate-y-[160%] peer-focus:scale-[0.82] peer-focus:bg-wah-card peer-focus:text-wah-mid peer-valid:-translate-y-[160%] peer-valid:scale-[0.82] peer-valid:bg-wah-card peer-valid:text-wah-mid"
                >
                  Password
                </label>
                <span
                  aria-hidden="true"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-wah-mid text-sm"
                >
                  ◉
                </span>
              </div>

              <label className="mt-1 flex items-center gap-2 text-wah-text">
                <input type="checkbox" className="w-4 h-4" />
                Remember me
              </label>

              <div className="relative w-full h-14 border-[1.8px] border-wah-light rounded-[14px] bg-white">
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full h-full px-4 text-base text-[#1e2430] outline-none bg-transparent cursor-pointer"
                >
                  <option value="Admin">Admin</option>
                  <option value="HR">HR</option>
                </select>
              </div>

              <div className="mt-2.5 grid grid-cols-1 gap-2.5">
                <button
                  type="submit"
                  className="h-12 rounded-xl border-0 text-white text-xl font-semibold cursor-pointer bg-gradient-to-r from-wah-primary to-wah-lighter"
                >
                  Log in
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    );
  }

  if (view === "register") {
    // ... keeping your existing register view code untouched
    return (
      <div className="min-h-screen grid place-items-center p-7">
        <div className="w-full max-w-[860px] min-h-[640px] bg-wah-card rounded-[14px] overflow-hidden grid grid-cols-1">
          <section className="px-16 py-12 flex flex-col items-center">
            <img
              className="w-[200px] h-[200px] object-contain mb-6"
              src="/images/wah-logo.png"
              alt="WAH logo"
            />
            <h1 className="m-0 text-[clamp(1.5rem,2vw,1.8rem)] text-wah-text text-center">
              Create an Account
            </h1>
            <form className="mt-7 w-full max-w-[720px] grid gap-3.5">
              <h3 className="mt-2.5 mb-0 text-base font-bold text-wah-text">
                User Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="relative w-full h-14">
                  <input
                    required
                    type="text"
                    name="firstName"
                    autoComplete="off"
                    className="peer w-full h-full border-[1.8px] border-wah-light rounded-[14px] bg-white px-4 text-base text-[#1e2430] outline-none transition-colors duration-150 focus:border-wah-mid"
                  />
                  <label className="absolute left-3.5 top-1/2 text-wah-accent pointer-events-none -translate-y-1/2 transition-all duration-150 px-[0.2em] peer-focus:-translate-y-[160%] peer-focus:scale-[0.82] peer-focus:bg-wah-card peer-focus:text-wah-mid peer-valid:-translate-y-[160%] peer-valid:scale-[0.82] peer-valid:bg-wah-card peer-valid:text-wah-mid">
                    First Name
                  </label>
                </div>
                <div className="relative w-full h-14">
                  <input
                    required
                    type="text"
                    name="lastName"
                    autoComplete="off"
                    className="peer w-full h-full border-[1.8px] border-wah-light rounded-[14px] bg-white px-4 text-base text-[#1e2430] outline-none transition-colors duration-150 focus:border-wah-mid"
                  />
                  <label className="absolute left-3.5 top-1/2 text-wah-accent pointer-events-none -translate-y-1/2 transition-all duration-150 px-[0.2em] peer-focus:-translate-y-[160%] peer-focus:scale-[0.82] peer-focus:bg-wah-card peer-focus:text-wah-mid peer-valid:-translate-y-[160%] peer-valid:scale-[0.82] peer-valid:bg-wah-card peer-valid:text-wah-mid">
                    Last Name
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="relative w-full h-14">
                  <input
                    type="text"
                    name="middleName"
                    autoComplete="off"
                    className="peer w-full h-full border-[1.8px] border-gray-400 rounded-[14px] bg-white px-4 text-base text-[#1e2430] outline-none transition-colors duration-150 focus:border-wah-mid"
                  />
                  <label className="absolute left-3.5 top-1/2 text-wah-accent pointer-events-none -translate-y-1/2 transition-all duration-150 px-[0.2em] peer-focus:-translate-y-[160%] peer-focus:scale-[0.82] peer-focus:bg-wah-card peer-focus:text-wah-mid">
                    Middle Name (Optional)
                  </label>
                </div>
                <div className="relative w-full h-14">
                  <input
                    type="text"
                    name="suffix"
                    autoComplete="off"
                    className="peer w-full h-full border-[1.8px] border-gray-400 rounded-[14px] bg-white px-4 text-base text-[#1e2430] outline-none transition-colors duration-150 focus:border-wah-mid"
                  />
                  <label className="absolute left-3.5 top-1/2 text-wah-accent pointer-events-none -translate-y-1/2 transition-all duration-150 px-[0.2em] peer-focus:-translate-y-[160%] peer-focus:scale-[0.82] peer-focus:bg-wah-card peer-focus:text-wah-mid">
                    Suffix (Optional)
                  </label>
                </div>
              </div>
              <h3 className="mt-2.5 mb-0 text-base font-bold text-wah-text">
                Account Credentials
              </h3>
              <div className="relative w-full h-14">
                <input
                  required
                  type="email"
                  name="regEmail"
                  autoComplete="off"
                  className="peer w-full h-full border-[1.8px] border-wah-light rounded-[14px] bg-white px-4 text-base text-[#1e2430] outline-none transition-colors duration-150 focus:border-wah-mid"
                />
                <label className="absolute left-3.5 top-1/2 text-wah-accent pointer-events-none -translate-y-1/2 transition-all duration-150 px-[0.2em] peer-focus:-translate-y-[160%] peer-focus:scale-[0.82] peer-focus:bg-wah-card peer-focus:text-wah-mid peer-valid:-translate-y-[160%] peer-valid:scale-[0.82] peer-valid:bg-wah-card peer-valid:text-wah-mid">
                  Email Address
                </label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="relative w-full h-14">
                  <input
                    required
                    type="password"
                    name="regPassword"
                    autoComplete="off"
                    className="peer w-full h-full border-[1.8px] border-wah-light rounded-[14px] bg-white px-4 text-base text-[#1e2430] outline-none transition-colors duration-150 focus:border-wah-mid"
                  />
                  <label className="absolute left-3.5 top-1/2 text-wah-accent pointer-events-none -translate-y-1/2 transition-all duration-150 px-[0.2em] peer-focus:-translate-y-[160%] peer-focus:scale-[0.82] peer-focus:bg-wah-card peer-focus:text-wah-mid peer-valid:-translate-y-[160%] peer-valid:scale-[0.82] peer-valid:bg-wah-card peer-valid:text-wah-mid">
                    Password
                  </label>
                </div>
                <div className="relative w-full h-14">
                  <input
                    required
                    type="password"
                    name="confirmPassword"
                    autoComplete="off"
                    className="peer w-full h-full border-[1.8px] border-wah-light rounded-[14px] bg-white px-4 text-base text-[#1e2430] outline-none transition-colors duration-150 focus:border-wah-mid"
                  />
                  <label className="absolute left-3.5 top-1/2 text-wah-accent pointer-events-none -translate-y-1/2 transition-all duration-150 px-[0.2em] peer-focus:-translate-y-[160%] peer-focus:scale-[0.82] peer-focus:bg-wah-card peer-focus:text-wah-mid peer-valid:-translate-y-[160%] peer-valid:scale-[0.82] peer-valid:bg-wah-card peer-valid:text-wah-mid">
                    Confirm Password
                  </label>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-1 gap-2.5">
                <button
                  type="button"
                  className="h-12 rounded-xl border-0 text-white text-xl font-semibold cursor-pointer bg-gradient-to-r from-wah-primary to-wah-lighter"
                >
                  Register
                </button>
              </div>
              <div className="flex flex-col gap-3 mt-3 text-center">
                <a
                  href="#"
                  className="text-wah-mid no-underline hover:underline"
                  onClick={(e) => {
                    e.preventDefault();
                    setView("login");
                  }}
                >
                  Already have an account?
                </a>
              </div>
            </form>
          </section>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route
            element={
              <MainLayout role={role} onLogout={() => setView("login")} />
            }
          >
            {role === "Admin" ? (
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
            ) : (
              <>
                {/* 2. HRDashboard IS NOW PROPERLY ROUTED HERE */}
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
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
