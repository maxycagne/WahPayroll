import React, { lazy, Suspense } from "react";
import type { QuickActionHost } from "../../types/AdminDashboard";

const EmployeesModule = lazy(() => import("@/pages/Employees"));
const AttendanceModule = lazy(() => import("@/pages/Attendance"));
const PayrollModule = lazy(() => import("@/pages/Payroll"));

type AdminQuickActionHostProps = {
  quickActionHost: QuickActionHost | null;
  quickActionSeed: number;
};

export default function AdminQuickActionHost({
  quickActionHost,
  quickActionSeed,
}: AdminQuickActionHostProps) {
  if (!quickActionHost) return null;

  return (
    <Suspense
      fallback={
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm font-semibold text-slate-700 shadow-sm">
          Loading module...
        </div>
      }
    >
      {quickActionHost === "employees" && (
        <EmployeesModule key={`qa-employees-${quickActionSeed}`} shortcutMode />
      )}
      {quickActionHost === "attendance" && (
        <AttendanceModule key={`qa-attendance-${quickActionSeed}`} shortcutMode />
      )}
      {quickActionHost === "payroll" && (
        <PayrollModule key={`qa-payroll-${quickActionSeed}`} shortcutMode />
      )}
    </Suspense>
  );
}
