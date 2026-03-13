import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './components/MainLayout'
import Dashboard from './pages/Dashboard'
import Employees from './pages/Employees'
import Attendance from './pages/Attendance'
import Leave from './pages/Leave'
import Payroll from './pages/Payroll'
import Payslips from './pages/Payslips'
import Reports from './pages/Reports'

function App() {
  const [view, setView] = useState('login')
  const role = 'Admin'

  if (view === 'login') {
    return (
      <div className="min-h-screen grid place-items-center p-7">
        <div className="w-full max-w-[980px] min-h-[640px] bg-wah-card rounded-[14px] overflow-hidden grid grid-cols-1 md:grid-cols-2">
          <section className="px-[62px] py-14 flex flex-col items-center">
            <img className="w-[200px] h-[200px] object-contain mb-6" src="/images/wah-logo.png" alt="WAH logo" />

            <h1 className="m-0 max-w-[320px] text-center text-[clamp(1.6rem,2vw,1.8rem)] leading-[1.15] text-wah-text">
              Welcome to Wireless Access For Health Payroll System
            </h1>

            <form className="mt-[34px] w-full max-w-[340px] grid gap-3">
              <div className="relative w-full h-14">
                <input
                  id="email"
                  required
                  type="email"
                  name="email"
                  autoComplete="off"
                  className="peer w-full h-full border-[1.8px] border-wah-light rounded-[14px] bg-white px-4 text-base text-[#1e2430] outline-none transition-colors duration-150 focus:border-wah-mid invalid:border-wah-light"
                />
                <label htmlFor="email" className="absolute left-3.5 top-1/2 text-wah-accent pointer-events-none -translate-y-1/2 transition-all duration-150 px-[0.2em] peer-focus:-translate-y-[160%] peer-focus:scale-[0.82] peer-focus:bg-wah-card peer-focus:text-wah-mid peer-valid:-translate-y-[160%] peer-valid:scale-[0.82] peer-valid:bg-wah-card peer-valid:text-wah-mid">
                  Email
                </label>
              </div>

              <div className="relative w-full h-14">
                <input
                  id="password"
                  required
                  type="password"
                  name="password"
                  autoComplete="off"
                  className="peer w-full h-full border-[1.8px] border-wah-light rounded-[14px] bg-white px-4 pr-[42px] text-base text-[#1e2430] outline-none transition-colors duration-150 focus:border-wah-mid"
                />
                <label htmlFor="password" className="absolute left-3.5 top-1/2 text-wah-accent pointer-events-none -translate-y-1/2 transition-all duration-150 px-[0.2em] peer-focus:-translate-y-[160%] peer-focus:scale-[0.82] peer-focus:bg-wah-card peer-focus:text-wah-mid peer-valid:-translate-y-[160%] peer-valid:scale-[0.82] peer-valid:bg-wah-card peer-valid:text-wah-mid">
                  Password
                </label>
                <span aria-hidden="true" className="absolute right-3.5 top-1/2 -translate-y-1/2 text-wah-mid text-sm">
                  ◉
                </span>
              </div>

              <label className="mt-1 flex items-center gap-2 text-wah-text">
                <input type="checkbox" className="w-4 h-4" />
                Remember me
              </label>

              <div className="mt-2.5 grid grid-cols-1 gap-2.5">
                <button type="button" onClick={() => setView('main')} className="h-12 rounded-xl border-0 text-white text-xl font-semibold cursor-pointer bg-gradient-to-r from-wah-primary to-wah-lighter">
                  Log in
                </button>
              </div>

              <div className="flex flex-col gap-3 mt-6 text-center">
                <a href="#" className="text-gray-400 no-underline hover:underline">Forgot your password?</a>
                <a
                  href="#"
                  className="text-gray-400 no-underline hover:underline"
                  onClick={(e) => {
                    e.preventDefault()
                    setView('register')
                  }}
                >
                  Don't have an account?
                </a>
              </div>
            </form>
          </section>

          <aside className="bg-gradient-to-br from-[#50109a] to-wah-accent text-white hidden md:flex flex-col justify-center items-center text-center p-12">
            <h2 className="max-w-[360px] m-0 text-[clamp(1.6rem,2vw,2rem)] leading-[1.2]">
              A simple payroll system made from scratch
            </h2>
            <p className="mt-9 max-w-[360px] text-base leading-[1.45]">
              Helping teams manage payroll data quickly and accurately through a
              secure and reliable WAH digital platform.
            </p>
          </aside>
        </div>
      </div>
    )
  }

  if (view === 'register') {
    return (
      <div className="min-h-screen grid place-items-center p-7">
        <div className="w-full max-w-[860px] min-h-[640px] bg-wah-card rounded-[14px] overflow-hidden grid grid-cols-1">
          <section className="px-16 py-12 flex flex-col items-center">
            <img className="w-[200px] h-[200px] object-contain mb-6" src="/images/wah-logo.png" alt="WAH logo" />

            <h1 className="m-0 text-[clamp(1.5rem,2vw,1.8rem)] text-wah-text text-center">Create an Account</h1>

            <form className="mt-7 w-full max-w-[720px] grid gap-3.5">
              <h3 className="mt-2.5 mb-0 text-base font-bold text-wah-text">User Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="relative w-full h-14">
                  <input required type="text" name="firstName" autoComplete="off" className="peer w-full h-full border-[1.8px] border-wah-light rounded-[14px] bg-white px-4 text-base text-[#1e2430] outline-none transition-colors duration-150 focus:border-wah-mid" />
                  <label className="absolute left-3.5 top-1/2 text-wah-accent pointer-events-none -translate-y-1/2 transition-all duration-150 px-[0.2em] peer-focus:-translate-y-[160%] peer-focus:scale-[0.82] peer-focus:bg-wah-card peer-focus:text-wah-mid peer-valid:-translate-y-[160%] peer-valid:scale-[0.82] peer-valid:bg-wah-card peer-valid:text-wah-mid">First Name</label>
                </div>
                <div className="relative w-full h-14">
                  <input required type="text" name="lastName" autoComplete="off" className="peer w-full h-full border-[1.8px] border-wah-light rounded-[14px] bg-white px-4 text-base text-[#1e2430] outline-none transition-colors duration-150 focus:border-wah-mid" />
                  <label className="absolute left-3.5 top-1/2 text-wah-accent pointer-events-none -translate-y-1/2 transition-all duration-150 px-[0.2em] peer-focus:-translate-y-[160%] peer-focus:scale-[0.82] peer-focus:bg-wah-card peer-focus:text-wah-mid peer-valid:-translate-y-[160%] peer-valid:scale-[0.82] peer-valid:bg-wah-card peer-valid:text-wah-mid">Last Name</label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="relative w-full h-14">
                  <input type="text" name="middleName" autoComplete="off" className="peer w-full h-full border-[1.8px] border-gray-400 rounded-[14px] bg-white px-4 text-base text-[#1e2430] outline-none transition-colors duration-150 focus:border-wah-mid" />
                  <label className="absolute left-3.5 top-1/2 text-wah-accent pointer-events-none -translate-y-1/2 transition-all duration-150 px-[0.2em] peer-focus:-translate-y-[160%] peer-focus:scale-[0.82] peer-focus:bg-wah-card peer-focus:text-wah-mid">Middle Name (Optional)</label>
                </div>
                <div className="relative w-full h-14">
                  <input type="text" name="suffix" autoComplete="off" className="peer w-full h-full border-[1.8px] border-gray-400 rounded-[14px] bg-white px-4 text-base text-[#1e2430] outline-none transition-colors duration-150 focus:border-wah-mid" />
                  <label className="absolute left-3.5 top-1/2 text-wah-accent pointer-events-none -translate-y-1/2 transition-all duration-150 px-[0.2em] peer-focus:-translate-y-[160%] peer-focus:scale-[0.82] peer-focus:bg-wah-card peer-focus:text-wah-mid">Suffix (Optional)</label>
                </div>
              </div>

              <h3 className="mt-2.5 mb-0 text-base font-bold text-wah-text">Account Credentials</h3>

              <div className="relative w-full h-14">
                <input required type="email" name="regEmail" autoComplete="off" className="peer w-full h-full border-[1.8px] border-wah-light rounded-[14px] bg-white px-4 text-base text-[#1e2430] outline-none transition-colors duration-150 focus:border-wah-mid" />
                <label className="absolute left-3.5 top-1/2 text-wah-accent pointer-events-none -translate-y-1/2 transition-all duration-150 px-[0.2em] peer-focus:-translate-y-[160%] peer-focus:scale-[0.82] peer-focus:bg-wah-card peer-focus:text-wah-mid peer-valid:-translate-y-[160%] peer-valid:scale-[0.82] peer-valid:bg-wah-card peer-valid:text-wah-mid">Email Address</label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="relative w-full h-14">
                  <input required type="password" name="regPassword" autoComplete="off" className="peer w-full h-full border-[1.8px] border-wah-light rounded-[14px] bg-white px-4 text-base text-[#1e2430] outline-none transition-colors duration-150 focus:border-wah-mid" />
                  <label className="absolute left-3.5 top-1/2 text-wah-accent pointer-events-none -translate-y-1/2 transition-all duration-150 px-[0.2em] peer-focus:-translate-y-[160%] peer-focus:scale-[0.82] peer-focus:bg-wah-card peer-focus:text-wah-mid peer-valid:-translate-y-[160%] peer-valid:scale-[0.82] peer-valid:bg-wah-card peer-valid:text-wah-mid">Password</label>
                </div>
                <div className="relative w-full h-14">
                  <input required type="password" name="confirmPassword" autoComplete="off" className="peer w-full h-full border-[1.8px] border-wah-light rounded-[14px] bg-white px-4 text-base text-[#1e2430] outline-none transition-colors duration-150 focus:border-wah-mid" />
                  <label className="absolute left-3.5 top-1/2 text-wah-accent pointer-events-none -translate-y-1/2 transition-all duration-150 px-[0.2em] peer-focus:-translate-y-[160%] peer-focus:scale-[0.82] peer-focus:bg-wah-card peer-focus:text-wah-mid peer-valid:-translate-y-[160%] peer-valid:scale-[0.82] peer-valid:bg-wah-card peer-valid:text-wah-mid">Confirm Password</label>
                </div>
              </div>

              <div className="mt-2 grid grid-cols-1 gap-2.5">
                <button type="button" className="h-12 rounded-xl border-0 text-white text-xl font-semibold cursor-pointer bg-gradient-to-r from-wah-primary to-wah-lighter">Register</button>
              </div>

              <div className="flex flex-col gap-3 mt-3 text-center">
                <a
                  href="#"
                  className="text-wah-mid no-underline hover:underline"
                  onClick={(e) => {
                    e.preventDefault()
                    setView('login')
                  }}
                >
                  Already have an account?
                </a>
              </div>
            </form>
          </section>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          element={
            <MainLayout
              role={role}
              onLogout={() => setView('login')}
            />
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/leave" element={<Leave />} />
          <Route path="/payroll" element={<Payroll />} />
          <Route path="/payslips" element={<Payslips />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App