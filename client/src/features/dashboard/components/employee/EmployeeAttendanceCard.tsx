import React from "react";
import { ArrowRight } from "lucide-react";
import type { EmployeeAttendanceRow } from "../../types/EmployeeDashboard";
import type { StatusBadgeClass } from "../../types/Dashboard";

type EmployeeAttendanceCardProps = {
  attendance: EmployeeAttendanceRow[];
  badgeClass: StatusBadgeClass;
  onOpenAttendance: () => void;
};

export default function EmployeeAttendanceCard({
  attendance,
  badgeClass,
  onOpenAttendance,
}: EmployeeAttendanceCardProps) {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50 px-5 py-3">
        <h3 className="m-0 text-sm font-bold text-slate-900">
          Recent Attendance (Last 5 Days)
        </h3>
      </div>
      <div className="flex-1 p-5">
        {attendance.length === 0 ? (
          <p className="py-4 text-center text-sm italic text-slate-500">
            No recent attendance records found.
          </p>
        ) : (
          <div className="space-y-3">
            {attendance.slice(0, 5).map((log, idx) => {
              const primaryStatus = log.status?.split(",")[0]?.trim() || "Pending";
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0"
                >
                  <p className="m-0 text-sm font-semibold text-slate-800">
                    {new Date(log.date).toLocaleDateString(undefined, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${badgeClass[primaryStatus] || badgeClass.Pending}`}
                  >
                    {log.status}
                  </span>
                </div>
              );
            })}
          </div>
        )}
        <button
          onClick={onOpenAttendance}
          className="mt-4 inline-flex w-full cursor-pointer items-center justify-center gap-1 rounded-lg border border-slate-200 bg-slate-50 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-100"
        >
          View Full Calendar
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
