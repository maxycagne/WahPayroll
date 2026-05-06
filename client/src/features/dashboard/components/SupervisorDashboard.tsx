import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CalendarPlus2,
  Clock3,
  FileClock,
  FolderClock,
} from "lucide-react";
import { User } from "../types";
import { AttendanceModal } from "./AttendanceModal";
import {
  getDashboardSummary,
  getMyAttendance,
  getSupervisorLeaves,
  getMyOffsets,
  getSupervisorResignations,
} from "../api";

interface SupervisorDashboardProps {
  currentUser: User;
}

const statusClass: Record<string, string> = {
  Present: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  Late: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  Undertime: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400",
  "Half-Day": "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  Absent: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  "On Leave": "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400",
  Pending: "bg-slate-100 text-slate-700 dark:bg-gray-800 dark:text-gray-400",
};

export const SupervisorDashboard: React.FC<SupervisorDashboardProps> = ({
  currentUser,
}) => {
  const navigate = useNavigate();
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const isPendingLeaveStatus = (status: unknown) => {
    const normalized = String(status || "").trim().toLowerCase();
    return ["pending", "pending approval", "pending review"].includes(
      normalized,
    );
  };

  const { data: dashboardData, isLoading: dashLoading } = useQuery({
    queryKey: ["dashboardSummary"],
    queryFn: getDashboardSummary,
    staleTime: 5 * 60 * 1000,
  });

  const { data: myAttendance = [], isLoading: attLoading } = useQuery({
    queryKey: ["my-attendance", currentUser?.emp_id],
    queryFn: getMyAttendance,
    staleTime: 5 * 60 * 1000,
  });

  const { data: leaves = [] } = useQuery({
    queryKey: ["leaves"],
    queryFn: getSupervisorLeaves,
    staleTime: 5 * 60 * 1000,
  });

  const { data: offsets = [] } = useQuery({
    queryKey: ["offset-applications"],
    queryFn: getMyOffsets,
    staleTime: 5 * 60 * 1000,
  });

  const { data: resignations = [] } = useQuery({
    queryKey: ["resignations"],
    queryFn: getSupervisorResignations,
    staleTime: 5 * 60 * 1000,
  });

  const personalSummary = useMemo(() => dashboardData?.personalSummary || {}, [dashboardData]);
  const employeeStatus = useMemo(() => 
    personalSummary.employeeStatus || currentUser?.status || "N/A",
    [personalSummary.employeeStatus, currentUser?.status]
  );
  const teamSummary = useMemo(() => dashboardData?.teamSummary || {
    teamSize: 0,
    presentCount: 0,
    lateCount: 0,
    absentCount: 0,
    onLeaveCount: 0,
    pendingApprovals: 0,
  }, [dashboardData]);

  const myPendingRequests = useMemo(() => [
    ...(leaves as any[])
      .filter(
        (row) =>
          String(row.emp_id) === String(currentUser.emp_id) &&
          isPendingLeaveStatus(row.status)
      )
      .map((row) => ({
        id: `leave-${row.id}`,
        type: "Leave",
        detail: row.leave_type,
        created_at: row.created_at || row.date_from,
      })),
    ...(offsets as any[])
      .filter(
        (row) =>
          String(row.emp_id) === String(currentUser.emp_id) &&
          ["pending", "pending approval"].includes(
            String(row.status || "").toLowerCase()
          )
      )
      .map((row) => ({
        id: `offset-${row.id}`,
        type: "Offset",
        detail: `${Number(row.days_applied || 0)} day(s)`,
        created_at: row.created_at || row.date_from,
      })),
    ...(resignations as any[])
      .filter(
        (row) =>
          String(row.emp_id) === String(currentUser.emp_id) &&
          String(row.status || "").toLowerCase() === "pending approval"
      )
      .map((row) => ({
        id: `resignation-${row.id}`,
        type: "Resignation",
        detail: row.resignation_type,
        created_at: row.created_at,
      })),
  ]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 6), [leaves, offsets, resignations, currentUser.emp_id]);

  const teamAttendanceRows = useMemo(() => dashboardData?.teamAttendanceStatus || [], [dashboardData]);
  const teamPendingRequests = useMemo(() => dashboardData?.teamPendingRequests || [], [dashboardData]);

  if (dashLoading || attLoading) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 font-semibold text-slate-700 dark:text-gray-300 shadow-sm">
        Loading Supervisor Dashboard...
      </div>
    );
  }

  return (
    <div className="max-w-full space-y-4">
      <div className="rounded-xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3 shadow-sm">
        <h1 className="m-0 text-[1.3rem] font-bold text-slate-900 dark:text-gray-100">
          Supervisor Dashboard
        </h1>
        <p className="m-0 mt-0.5 text-xs text-slate-500 dark:text-gray-400">
          Personal insights and team overview for your assigned designation.
        </p>
        <div className="flex flex-wrap gap-2 mt-2">
          <p className="m-0 inline-flex items-center rounded-full border border-slate-200 dark:border-gray-800 bg-slate-50 dark:bg-gray-800 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-gray-300">
            Employment Status: {employeeStatus}
          </p>
          {(currentUser?.position || currentUser?.designation) && (
            <p className="m-0 inline-flex items-center rounded-full border border-purple-200 dark:border-purple-900/30 bg-purple-50 dark:bg-purple-900/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">
              Position: {currentUser?.position || currentUser?.designation}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/30 bg-emerald-50 dark:bg-emerald-900/20 p-3 shadow-sm">
          <p className="m-0 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            My Attendance Today
          </p>
          <p className="m-0 mt-1 text-xl font-black text-emerald-800 dark:text-emerald-300">
            {personalSummary.todayAttendanceStatus || "Absent"}
          </p>
        </div>
        <div className="rounded-xl border border-blue-200 dark:border-blue-900/30 bg-blue-50 dark:bg-blue-900/20 p-3 shadow-sm">
          <p className="m-0 text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
            My Leave Balance
          </p>
          <p className="m-0 mt-1 text-xl font-black text-blue-800 dark:text-blue-300">
            {Number(personalSummary.leaveBalance || 0)}
          </p>
        </div>

        <div className="rounded-xl border border-amber-200 dark:border-amber-900/30 bg-amber-50 dark:bg-amber-900/20 p-3 shadow-sm">
          <p className="m-0 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
            My Pending Requests
          </p>
          <p className="m-0 mt-1 text-xl font-black text-amber-800 dark:text-amber-300">
            {Number(personalSummary.pendingRequestCount || 0)}
          </p>
        </div>
      </div>

      <section className="rounded-xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="m-0 text-sm font-bold text-slate-900 dark:text-gray-100">
            Quick Actions
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <button
            onClick={() => navigate("/leave")}
            className="group rounded-lg border border-violet-200 dark:border-violet-900/30 bg-violet-50 dark:bg-violet-900/20 p-2.5 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className="inline-flex items-center gap-2 text-xs font-bold text-violet-800 dark:text-violet-400">
              <CalendarPlus2 className="h-4 w-4" />
              File Leave / Offset
            </span>
            <p className="m-0 mt-1 text-[11px] text-slate-600 dark:text-gray-400">
              Create and track your personal requests.
            </p>
            <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-gray-500">
              Open
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </button>
          <button
            onClick={() => navigate("/attendance")}
            className="group rounded-lg border border-emerald-200 dark:border-emerald-900/30 bg-emerald-50 dark:bg-emerald-900/20 p-2.5 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className="inline-flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-400">
              <Clock3 className="h-4 w-4" />
              Team Attendance
            </span>
            <p className="m-0 mt-1 text-[11px] text-slate-600 dark:text-gray-400">
              Review attendance entries for your team.
            </p>
            <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-gray-500">
              Open
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </button>
          <button
            onClick={() => navigate("/leave")}
            className="group rounded-lg border border-sky-200 dark:border-sky-900/30 bg-sky-50 dark:bg-sky-900/20 p-2.5 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className="inline-flex items-center gap-2 text-xs font-bold text-sky-800 dark:text-sky-400">
              <FileClock className="h-4 w-4" />
              Team Pending Requests
            </span>
            <p className="m-0 mt-1 text-[11px] text-slate-600 dark:text-gray-400">
              Review pending leave, offset, and resignation requests.
            </p>
            <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-gray-500">
              Open
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </button>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <div className="rounded-xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3 shadow-sm lg:col-span-1">
          <p className="m-0 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">
            Team Size
          </p>
          <p className="m-0 mt-1 text-2xl font-black text-slate-900 dark:text-gray-100">
            {teamSummary.teamSize}
          </p>
        </div>
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/30 bg-emerald-50 dark:bg-emerald-900/20 p-3 shadow-sm lg:col-span-1">
          <p className="m-0 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            Present
          </p>
          <p className="m-0 mt-1 text-2xl font-black text-emerald-800 dark:text-emerald-300">
            {teamSummary.presentCount}
          </p>
        </div>
        <div className="rounded-xl border border-amber-200 dark:border-amber-900/30 bg-amber-50 dark:bg-amber-900/20 p-3 shadow-sm lg:col-span-1">
          <p className="m-0 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
            Late
          </p>
          <p className="m-0 mt-1 text-2xl font-black text-amber-800 dark:text-amber-300">
            {teamSummary.lateCount}
          </p>
        </div>
        <div className="rounded-xl border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/20 p-3 shadow-sm lg:col-span-1">
          <p className="m-0 text-[10px] font-bold uppercase tracking-wider text-red-700 dark:text-red-400">
            Absent
          </p>
          <p className="m-0 mt-1 text-2xl font-black text-red-800 dark:text-red-300">
            {teamSummary.absentCount}
          </p>
        </div>
        <div className="rounded-xl border border-violet-200 dark:border-violet-900/30 bg-violet-50 dark:bg-violet-900/20 p-3 shadow-sm lg:col-span-1">
          <p className="m-0 text-[10px] font-bold uppercase tracking-wider text-violet-700 dark:text-violet-400">
            On Leave
          </p>
          <p className="m-0 mt-1 text-2xl font-black text-violet-800 dark:text-violet-300">
            {teamSummary.onLeaveCount}
          </p>
        </div>
        <div className="rounded-xl border border-sky-200 dark:border-sky-900/30 bg-sky-50 dark:bg-sky-900/20 p-3 shadow-sm lg:col-span-1">
          <p className="m-0 text-[10px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400">
            Pending
          </p>
          <p className="m-0 mt-1 text-2xl font-black text-sky-800 dark:text-sky-300">
            {teamSummary.pendingApprovals}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="rounded-xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm">
          <h3 className="m-0 text-sm font-bold text-slate-900 dark:text-gray-100">
            Team Attendance Today
          </h3>
          <p className="m-0 mt-1 text-[11px] text-slate-500 dark:text-gray-400">
            Status of employees under your supervision.
          </p>
          <div className="mt-3 max-h-[280px] space-y-2 overflow-y-auto pr-1">
            {teamAttendanceRows.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-500">
                No team attendance data found.
              </p>
            ) : (
              (teamAttendanceRows as any[]).map((row) => (
                <div
                  key={row.emp_id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-gray-800 bg-slate-50 dark:bg-gray-800 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="m-0 text-xs font-bold text-slate-900 dark:text-gray-100">
                      {row.first_name} {row.last_name}
                    </p>
                  </div>
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

        <section className="rounded-xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm">
          <h3 className="m-0 text-sm font-bold text-slate-900 dark:text-gray-100">
            Team Pending Requests
          </h3>
          <p className="m-0 mt-1 text-[11px] text-slate-500 dark:text-gray-400">
            Recent requests awaiting your review.
          </p>
          <div className="mt-3 max-h-[280px] space-y-2 overflow-y-auto pr-1">
            {teamPendingRequests.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-500 dark:text-gray-400">
                No pending team requests.
              </p>
            ) : (
              (teamPendingRequests as any[]).map((row) => (
                <div
                  key={row.id}
                  className="rounded-lg border border-slate-200 dark:border-gray-800 bg-slate-50 dark:bg-gray-800 px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="m-0 text-xs font-bold text-slate-900 dark:text-gray-100">
                      {row.first_name} {row.last_name}
                    </p>
                    <span className="rounded bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                      {row.type}
                    </span>
                  </div>
                  <p className="m-0 mt-1 text-[11px] text-slate-600 dark:text-gray-400">
                    {row.detail || "Pending review"}
                  </p>
                  <p className="m-0 mt-0.5 text-[10px] text-slate-400 dark:text-gray-500">
                    Filed on {new Date(row.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="rounded-xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm">
          <h3 className="m-0 text-sm font-bold text-slate-900 dark:text-gray-100">
            My Recent Attendance
          </h3>
          <div className="mt-3 space-y-2">
            {(myAttendance as any[]).slice(0, 5).map((row, idx) => (
              <div
                key={`${row.date}-${idx}`}
                className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-gray-800 bg-slate-50 dark:bg-gray-800 px-3 py-2"
              >
                <p className="m-0 text-xs font-semibold text-slate-700 dark:text-gray-300">
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
              <p className="py-6 text-center text-xs text-slate-500 dark:text-gray-400">
                No recent attendance records.
              </p>
            )}
          </div>
          <button
            onClick={() => setIsAttendanceModalOpen(true)}
            className="mt-4 inline-flex w-full items-center justify-center gap-1 rounded-lg border border-slate-200 dark:border-gray-800 bg-slate-50 dark:bg-gray-800/50 py-2 text-xs font-bold text-slate-600 dark:text-gray-300 transition-colors hover:bg-slate-100 dark:hover:bg-gray-800 cursor-pointer"
          >
            View Full Attendance
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </section>

        <section className="rounded-xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm">
          <h3 className="m-0 text-sm font-bold text-slate-900 dark:text-gray-100">
            My Pending Requests
          </h3>
          <div className="mt-3 space-y-2">
            {myPendingRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <span className="mb-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30 p-2 text-emerald-700 dark:text-emerald-400">
                  <FolderClock className="h-5 w-5" />
                </span>
                <p className="m-0 text-sm font-semibold text-slate-700 dark:text-gray-300">
                  You are all caught up.
                </p>
              </div>
            ) : (
              myPendingRequests.map((row) => (
                <div
                  key={row.id}
                  className="rounded-lg border border-slate-200 dark:border-gray-800 bg-slate-50 dark:bg-gray-800 px-3 py-2"
                >
                  <div className="flex items-center justify-between">
                    <p className="m-0 text-xs font-bold text-slate-900 dark:text-gray-100">
                      {row.type} Request
                    </p>
                    <span className="rounded bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                      Pending
                    </span>
                  </div>
                  <p className="m-0 mt-1 text-[11px] text-slate-600 dark:text-gray-400">
                    {row.detail}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <AttendanceModal
        isOpen={isAttendanceModalOpen}
        onClose={() => setIsAttendanceModalOpen(false)}
        attendance={myAttendance}
        badgeClass={statusClass}
      />
    </div>
  );
};
