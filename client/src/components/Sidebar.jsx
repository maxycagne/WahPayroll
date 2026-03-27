import { NavLink } from "react-router-dom";
import {
  BarChart3,
  CalendarCheck2,
  FileSpreadsheet,
  LayoutDashboard,
  LineChart,
  LogOut,
  ReceiptText,
  Users,
  Wallet,
} from "lucide-react";

const navItems = {
  Admin: [
    { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/employees", icon: Users, label: "Employees" },
    { to: "/attendance", icon: CalendarCheck2, label: "Attendance" },
    { to: "/leave", icon: FileSpreadsheet, label: "Leave Applications" },
    { to: "/payroll", icon: Wallet, label: "Salary / Payroll" },
    { to: "/payroll-reports", icon: BarChart3, label: "Payroll Reports" },
  ],
  Supervisor: [
    { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/employees", icon: Users, label: "Employees" },
    { to: "/attendance", icon: CalendarCheck2, label: "Attendance" },
    { to: "/leave", icon: FileSpreadsheet, label: "Leave / Offset" },
    { to: "/payroll", icon: Wallet, label: "Salary / Payroll" },
    { to: "/payroll-reports", icon: BarChart3, label: "Payroll Reports" },
    { to: "/payslips", icon: ReceiptText, label: "Payslips" },
  ],
  HR: [
    { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/employees", icon: Users, label: "Employees" },
    { to: "/attendance", icon: CalendarCheck2, label: "Attendance" },
    { to: "/leave", icon: FileSpreadsheet, label: "Leave / Offset" },
    { to: "/salary-history", icon: LineChart, label: "Salary History" },
    { to: "/reports", icon: BarChart3, label: "Reports" },
    { to: "/payslips", icon: ReceiptText, label: "Payslips" },
  ],
  RankAndFile: [
    { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/leave", icon: FileSpreadsheet, label: "Applications" },
    { to: "/payslips", icon: ReceiptText, label: "My Payslips" },
  ],
};

export default function Sidebar({ role, onLogout }) {
  const items = navItems[role] || navItems.RankAndFile;

  return (
    <aside className="flex h-full flex-col overflow-y-auto border-r border-white/15 bg-gradient-to-b from-[#3e0d75] via-[#4d128f] to-[#5a1ea2] text-white md:h-[calc(100vh-64px)]">
      <div className="border-b border-white/15 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/25">
            <img
              src="/images/wah-logo.png"
              alt="WAH"
              className="h-8 w-8 object-contain"
            />
          </div>
          <div className="min-w-0">
            <p className="m-0 truncate text-[11px] uppercase tracking-[0.2em] text-white/65">
              WAH Payroll
            </p>
            <p className="m-0 truncate text-sm font-semibold text-white">
              Workspace
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1.5 px-3 py-4">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[0.84rem] font-medium text-white/85 no-underline transition-all duration-150 hover:bg-white/12 hover:text-white ${isActive ? "bg-white/18 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.22)]" : ""}`
            }
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white/10 text-white/95 transition-colors group-hover:bg-white/15">
              <item.icon className="h-4 w-4" />
            </span>
            <span className="whitespace-nowrap">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <button
        className="mx-4 mb-4 mt-2 flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/8 px-3 py-2.5 text-[0.88rem] font-semibold text-white transition-colors duration-150 hover:bg-white/18"
        onClick={onLogout}
      >
        <LogOut className="h-4 w-4" />
        Log out
      </button>
    </aside>
  );
}
