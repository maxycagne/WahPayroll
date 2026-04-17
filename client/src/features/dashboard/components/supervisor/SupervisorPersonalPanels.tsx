import React from "react";
import { FolderClock } from "lucide-react";
import type { StatusBadgeClass } from "../../types/Dashboard";
import type {
  SupervisorAttendanceRow,
  SupervisorPendingRequest,
} from "../../types/SupervisorDashboard";

type SupervisorPersonalPanelsProps = {
  myAttendance: SupervisorAttendanceRow[];
  myPendingRequests: SupervisorPendingRequest[];
  statusClass: StatusBadgeClass;
};

export default function SupervisorPersonalPanels({
  myAttendance,
  myPendingRequests,
  statusClass,
}: SupervisorPersonalPanelsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="m-0 text-sm font-bold text-slate-900">My Recent Attendance</h3>
        <div className="mt-3 space-y-2">
          {myAttendance.slice(0, 5).map((row, idx) => (
            <div
              key={`${row.date}-${idx}`}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
            >
              <p className="m-0 text-xs font-semibold text-slate-700">
                {new Date(row.date).toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </p>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusClass[row.status] || statusClass.Pending}`}
              >
                {row.status}
              </span>
            </div>
          ))}
          {myAttendance.length === 0 && (
            <p className="py-6 text-center text-xs text-slate-500">
              No recent attendance records.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="m-0 text-sm font-bold text-slate-900">My Pending Requests</h3>
        <div className="mt-3 space-y-2">
          {myPendingRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <span className="mb-2 rounded-full bg-emerald-100 p-2 text-emerald-700">
                <FolderClock className="h-5 w-5" />
              </span>
              <p className="m-0 text-sm font-semibold text-slate-700">
                You are all caught up.
              </p>
            </div>
          ) : (
            myPendingRequests.map((row) => (
              <div
                key={row.id}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
              >
                <div className="flex items-center justify-between">
                  <p className="m-0 text-xs font-bold text-slate-900">
                    {row.type} Request
                  </p>
                  <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800">
                    Pending
                  </span>
                </div>
                <p className="m-0 mt-1 text-[11px] text-slate-600">{row.detail}</p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
