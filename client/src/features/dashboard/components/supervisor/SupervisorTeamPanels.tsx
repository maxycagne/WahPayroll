import React from "react";
import type { StatusBadgeClass } from "../../types/Dashboard";
import type {
  SupervisorTeamAttendanceRow,
  SupervisorTeamPendingRow,
} from "../../types/SupervisorDashboard";

type SupervisorTeamPanelsProps = {
  teamAttendanceRows: SupervisorTeamAttendanceRow[];
  teamPendingRequests: SupervisorTeamPendingRow[];
  statusClass: StatusBadgeClass;
};

export default function SupervisorTeamPanels({
  teamAttendanceRows,
  teamPendingRequests,
  statusClass,
}: SupervisorTeamPanelsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="m-0 text-sm font-bold text-slate-900">Team Attendance Today</h3>
        <p className="m-0 mt-1 text-[11px] text-slate-500">
          Status of employees under your supervision.
        </p>
        <div className="mt-3 max-h-[280px] space-y-2 overflow-y-auto pr-1">
          {teamAttendanceRows.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-500">
              No team attendance data found.
            </p>
          ) : (
            teamAttendanceRows.map((row) => (
              <div
                key={row.emp_id}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
              >
                <p className="m-0 text-xs font-bold text-slate-900">
                  {row.first_name} {row.last_name}
                </p>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusClass[row.status] || statusClass.Pending}`}
                >
                  {row.status}
                </span>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="m-0 text-sm font-bold text-slate-900">Team Pending Requests</h3>
        <p className="m-0 mt-1 text-[11px] text-slate-500">
          Recent requests awaiting your review.
        </p>
        <div className="mt-3 max-h-[280px] space-y-2 overflow-y-auto pr-1">
          {teamPendingRequests.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-500">
              No pending team requests.
            </p>
          ) : (
            teamPendingRequests.map((row) => (
              <div
                key={row.id}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="m-0 text-xs font-bold text-slate-900">
                    {row.first_name} {row.last_name}
                  </p>
                  <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800">
                    {row.type}
                  </span>
                </div>
                <p className="m-0 mt-1 text-[11px] text-slate-600">
                  {row.detail || "Pending review"}
                </p>
                <p className="m-0 mt-0.5 text-[10px] text-slate-400">
                  Filed on {new Date(row.created_at).toLocaleDateString()}
                </p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
