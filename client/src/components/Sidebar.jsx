import { NavLink } from "react-router-dom";

const navItems = {
  Admin: [
    { to: "/dashboard", icon: "⊞", label: "Dashboard" },
    { to: "/employees", icon: "⊚", label: "Employees" },
    { to: "/attendance", icon: "☰", label: "Attendance" },
    { to: "/leave", icon: "✉", label: "Leave Applications" },
    { to: "/payroll", icon: "⊕", label: "Salary / Payroll" },
    { to: "/payroll-reports", icon: "⊟", label: "Payroll Reports" },
    { to: "/payslips", icon: "▤", label: "Payslips" },
  ],
  Supervisor: [
    { to: "/dashboard", icon: "⊞", label: "Dashboard" },
    { to: "/employees", icon: "⊚", label: "Employees" },
    { to: "/attendance", icon: "☰", label: "Attendance" },
    { to: "/leave", icon: "✉", label: "Leave / Offset" },
    { to: "/payroll", icon: "⊕", label: "Salary / Payroll" },
    { to: "/payroll-reports", icon: "⊟", label: "Payroll Reports" },
    { to: "/payslips", icon: "▤", label: "Payslips" },
  ],
  HR: [
    { to: "/dashboard", icon: "⊞", label: "Dashboard" },
    { to: "/employees", icon: "⊚", label: "Employees" },
    { to: "/attendance", icon: "☰", label: "Attendance" },
    { to: "/leave", icon: "✉", label: "Leave / Offset" },
    { to: "/salary-history", icon: "◷", label: "Salary History" },
    { to: "/reports", icon: "⊟", label: "Reports" },
    { to: "/payslips", icon: "▤", label: "Payslips" },
  ],
  RankAndFile: [
    { to: "/dashboard", icon: "⊞", label: "Dashboard" },
    { to: "/leave", icon: "✉", label: "Applications" },
    { to: "/payslips", icon: "▤", label: "My Payslips" },
  ],
};

export default function Sidebar({ role, onLogout }) {
  const items = navItems[role] || navItems.RankAndFile;

  return (
    <aside className="bg-gradient-to-b from-wah-sidebar-start to-wah-mid text-white flex flex-col sticky top-[42px] h-[calc(100vh-42px)] overflow-y-auto">
      <div className="flex justify-center items-center px-4 pt-7 pb-6">
        <img
          src="/images/wah-logo.png"
          alt="WAH"
          className="w-[120px] h-[120px] object-contain"
        />
      </div>

      <nav className="flex-1 flex flex-col px-3">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-3 text-white/90 no-underline text-[0.95rem] transition-colors duration-150 hover:bg-white/10 hover:text-white ${isActive ? "bg-white/[0.18] text-white font-semibold" : ""}`
            }
          >
            <span className="text-[1.1rem] w-[22px] text-center">
              {item.icon}
            </span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <button
        className="mx-4 mb-4 mt-3.5 px-2.5 py-2.5 rounded-[10px] border border-white/30 bg-transparent text-white cursor-pointer text-[0.92rem] transition-colors duration-150 hover:bg-white/15"
        onClick={onLogout}
      >
        ⎋ Log out
      </button>
    </aside>
  );
}
