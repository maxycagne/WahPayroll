import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function MainLayout({ role, onLogout }) {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center justify-between px-7 py-3 bg-gradient-to-r from-wah-topbar-start to-wah-topbar-end sticky top-0 z-20">
        <h2 className="m-0 flex items-baseline gap-2">
          <span className="text-white text-[0.95rem] font-extrabold uppercase tracking-wide">
            WIRELESS ACCESS FOR HEALTH
          </span>
          <span className="text-white/70 text-[0.78rem] font-normal uppercase tracking-wider">
            PAYROLL.
          </span>
        </h2>
        <span className="text-[0.78rem] uppercase tracking-widest font-semibold px-2.5 py-1 rounded-full border border-white/35 text-white/90">
          {role}
        </span>
      </header>
      <div className="grid grid-cols-[200px_1fr] flex-1">
        <Sidebar role={role} onLogout={onLogout} />
        <main className="flex-1 p-5 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
