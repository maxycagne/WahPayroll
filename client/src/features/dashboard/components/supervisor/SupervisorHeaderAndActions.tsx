import React from "react";
import { ArrowRight, CalendarPlus2, Clock3, FileClock } from "lucide-react";
import type { SupervisorPersonalSummary } from "../../types/SupervisorDashboard";

type SupervisorHeaderAndActionsProps = {
  employeeStatus: string;
  personalSummary: SupervisorPersonalSummary;
  onOpenLeave: () => void;
  onOpenAttendance: () => void;
};

export default function SupervisorHeaderAndActions({
  employeeStatus,
  personalSummary,
  onOpenLeave,
  onOpenAttendance,
}: SupervisorHeaderAndActionsProps) {
  return (
    <>
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <h1 className="m-0 text-[1.3rem] font-bold text-slate-900">
          Supervisor Dashboard
        </h1>
        <p className="m-0 mt-0.5 text-xs text-slate-500">
          Personal insights and team overview for your assigned designation.
        </p>
        <p className="m-0 mt-2 inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-600">
          Employment Status: {employeeStatus}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 shadow-sm">
          <p className="m-0 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
            My Attendance Today
          </p>
          <p className="m-0 mt-1 text-xl font-black text-emerald-800">
            {personalSummary.todayAttendanceStatus || "Absent"}
          </p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 shadow-sm">
          <p className="m-0 text-[10px] font-bold uppercase tracking-wider text-blue-700">
            My Leave Balance
          </p>
          <p className="m-0 mt-1 text-xl font-black text-blue-800">
            {Number(personalSummary.leaveBalance || 0)}
          </p>
        </div>
        <div className="rounded-xl border border-violet-200 bg-violet-50 p-3 shadow-sm">
          <p className="m-0 text-[10px] font-bold uppercase tracking-wider text-violet-700">
            My Offset Credits
          </p>
          <p className="m-0 mt-1 text-xl font-black text-violet-800">
            {Number(personalSummary.offsetCredits || 0)}
          </p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 shadow-sm">
          <p className="m-0 text-[10px] font-bold uppercase tracking-wider text-amber-700">
            My Pending Requests
          </p>
          <p className="m-0 mt-1 text-xl font-black text-amber-800">
            {Number(personalSummary.pendingRequestCount || 0)}
          </p>
        </div>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="m-0 text-sm font-bold text-slate-900">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <button
            onClick={onOpenLeave}
            className="group rounded-lg border border-violet-200 bg-violet-50 p-2.5 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className="inline-flex items-center gap-2 text-xs font-bold text-violet-800">
              <CalendarPlus2 className="h-4 w-4" />
              File Leave / Offset
            </span>
            <p className="m-0 mt-1 text-[11px] text-slate-600">
              Create and track your personal requests.
            </p>
            <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600">
              Open
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </button>
          <button
            onClick={onOpenAttendance}
            className="group rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className="inline-flex items-center gap-2 text-xs font-bold text-emerald-800">
              <Clock3 className="h-4 w-4" />
              Team Attendance
            </span>
            <p className="m-0 mt-1 text-[11px] text-slate-600">
              Review attendance entries for your team.
            </p>
            <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600">
              Open
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </button>
          <button
            onClick={onOpenLeave}
            className="group rounded-lg border border-sky-200 bg-sky-50 p-2.5 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className="inline-flex items-center gap-2 text-xs font-bold text-sky-800">
              <FileClock className="h-4 w-4" />
              Team Pending Requests
            </span>
            <p className="m-0 mt-1 text-[11px] text-slate-600">
              Review pending leave, offset, and resignation requests.
            </p>
            <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600">
              Open
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </button>
        </div>
      </section>
    </>
  );
}
