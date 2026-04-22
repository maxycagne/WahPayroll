import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  CalendarPlus2,
  Clock3,
  FolderClock,
} from "lucide-react";
import { User } from "../types";
import {
  getDashboardSummary,
  getMyAttendance,
  getMyLeaves,
  getMyOffsets,
} from "../api";

interface EmployeeDashboardProps {
  currentUser: User;
}

const badgeClass: Record<string, string> = {
  Present: "bg-emerald-100 text-emerald-800",
  Late: "bg-amber-100 text-amber-800",
  Undertime: "bg-rose-100 text-rose-800",
  "Half-Day": "bg-orange-100 text-orange-800",
  Absent: "bg-red-100 text-red-800",
  "On Leave": "bg-violet-100 text-violet-800",
  Pending: "bg-slate-100 text-slate-700",
};

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({
  currentUser,
}) => {
  const navigate = useNavigate();

  const { data: dashboardData, isLoading: dashLoading } = useQuery({
    queryKey: ["dashboardSummary"],
    queryFn: getDashboardSummary,
  });

  const { data: myAttendance = [], isLoading: attLoading } = useQuery({
    queryKey: ["my-attendance", currentUser?.emp_id],
    queryFn: getMyAttendance,
  });

  const { data: myLeaves = [] } = useQuery({
    queryKey: ["leaves"],
    queryFn: getMyLeaves,
  });

  const { data: myOffsets = [] } = useQuery({
    queryKey: ["offset-applications"],
    queryFn: getMyOffsets,
  });

  const myBalanceRecord = useMemo(() => 
    dashboardData?.balances?.find(
      (b: any) => String(b.emp_id) === String(currentUser.emp_id)
    ),
    [dashboardData?.balances, currentUser.emp_id]
  );

  const myMissingDocsRecord = useMemo(() => 
    dashboardData?.missingDocs?.find(
      (d: any) => String(d.emp_id) === String(currentUser.emp_id)
    ),
    [dashboardData?.missingDocs, currentUser.emp_id]
  );

  const personalSummary = useMemo(() => dashboardData?.personalSummary || {}, [dashboardData]);

  const displayedLeaveBalance = useMemo(() => 
    personalSummary.leaveBalance !== undefined
      ? Number(personalSummary.leaveBalance || 0)
      : Number(myBalanceRecord?.leave_balance || 0),
    [personalSummary.leaveBalance, myBalanceRecord?.leave_balance]
  );

  const pendingRequests = useMemo(() => [
    ...(myLeaves as any[])
      .filter((l) => l.status === "Pending")
      .map((l) => ({
        id: `l-${l.id}`,
        type: "Leave",
        title: l.leave_type,
        date: l.created_at || l.date_from || new Date().toISOString(),
      })),
    ...(myOffsets as any[])
      .filter((o) => o.status === "Pending")
      .map((o) => ({
        id: `o-${o.id}`,
        type: "Offset",
        title: `${Number(o.days_applied)} Days Applied`,
        date: o.created_at || o.date_from || new Date().toISOString(),
      })),
  ].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  ), [myLeaves, myOffsets]);

  const employeeStatus = useMemo(() => 
    personalSummary?.employeeStatus ||
    currentUser?.status ||
    "N/A",
    [personalSummary?.employeeStatus, currentUser?.status]
  );

  if (dashLoading || attLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 font-semibold text-slate-700 shadow-sm">
        Loading My Dashboard...
      </div>
    );
  }

  return (
    <div className="max-w-full space-y-6">
      <div>
        <h1 className="m-0 text-[1.6rem] font-bold text-slate-900">
          Welcome back,{" "}
          {currentUser?.first_name || currentUser?.name || "Employee"}!
        </h1>
        <p className="m-0 mt-1 text-sm text-slate-500">
          Here is what is happening with your account today.
        </p>
        <p className="m-0 mt-2 inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-600">
          Employment Status: {employeeStatus}
        </p>
      </div>

      {myMissingDocsRecord && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm">
          <span className="mt-0.5 rounded-md bg-white p-1 text-red-600">
            <AlertTriangle className="h-4 w-4" />
          </span>
          <div>
            <h3 className="m-0 mb-1 text-sm font-bold text-red-800">
              Action Required: Missing Documents
            </h3>
            <p className="m-0 text-xs leading-5 text-red-700">
              HR has flagged your profile for missing requirements:{" "}
              <span className="font-bold">
                {myMissingDocsRecord.missing_docs}
              </span>
              . Please submit these as soon as possible.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col justify-between rounded-xl border border-emerald-200/70 bg-white p-5 shadow-sm">
          <p className="m-0 mb-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
            Leave Balance
          </p>
          <div className="flex items-baseline gap-2">
            <h2 className="m-0 text-4xl font-black text-slate-900">
              {displayedLeaveBalance}
            </h2>
            <span className="text-sm font-medium text-slate-500">
              Days Remaining
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => navigate("/leave")}
            className="group flex flex-1 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 shadow-sm transition-colors hover:bg-slate-50 cursor-pointer"
          >
            <span className="rounded-md bg-violet-100 p-1.5 text-violet-700">
              <CalendarPlus2 className="h-4 w-4" />
            </span>
            <span className="text-sm font-bold text-slate-800">
              File a Leave Request
            </span>
            <ArrowRight className="ml-auto h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5" />
          </button>
          <button
            onClick={() => navigate("/leave")}
            className="group flex flex-1 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 shadow-sm transition-colors hover:bg-slate-50 cursor-pointer"
          >
            <span className="rounded-md bg-indigo-100 p-1.5 text-indigo-700">
              <Clock3 className="h-4 w-4" />
            </span>
            <span className="text-sm font-bold text-slate-800">
              File an Offset
            </span>
            <ArrowRight className="ml-auto h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50 px-5 py-3">
            <h3 className="m-0 text-sm font-bold text-slate-900">
              Recent Attendance (Last 5 Days)
            </h3>
          </div>
          <div className="flex-1 p-5">
            {myAttendance.length === 0 ? (
              <p className="py-4 text-center text-sm italic text-slate-500">
                No recent attendance records found.
              </p>
            ) : (
              <div className="space-y-3">
                {(myAttendance as any[]).slice(0, 5).map((log, idx) => {
                  const primaryStatus =
                    log.status?.split(",")[0]?.trim() || "Pending";
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0"
                    >
                      <div>
                        <p className="m-0 text-sm font-semibold text-slate-800">
                          {new Date(log.date).toLocaleDateString(undefined, {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${badgeClass[primaryStatus] || badgeClass["Pending"]}`}
                      >
                        {log.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            <button
              onClick={() => navigate("/attendance")}
              className="mt-4 inline-flex w-full items-center justify-center gap-1 rounded-lg border border-slate-200 bg-slate-50 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-100 cursor-pointer"
            >
              View Full Calendar
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3">
            <h3 className="m-0 text-sm font-bold text-slate-900">
              My Pending Requests
            </h3>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
              {pendingRequests.length} Pending
            </span>
          </div>
          <div className="flex-1 p-5 overflow-y-auto max-h-[300px]">
            {pendingRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <span className="mb-2 rounded-full bg-emerald-100 p-2 text-emerald-700">
                  <FolderClock className="h-5 w-5" />
                </span>
                <p className="m-0 text-sm font-semibold text-slate-700">
                  You are all caught up!
                </p>
                <p className="m-0 mt-1 text-xs text-slate-500">
                  No pending requests waiting for approval.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50/80 p-3"
                  >
                    <div className="mt-0.5 rounded-md bg-white p-1.5 text-violet-700 ring-1 ring-slate-200">
                      {req.type === "Leave" ? (
                        <CalendarPlus2 className="h-3.5 w-3.5" />
                      ) : (
                        <Clock3 className="h-3.5 w-3.5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="m-0 text-sm font-bold text-slate-900">
                        {req.type} Request
                      </p>
                      <p className="m-0 text-xs text-slate-600">{req.title}</p>
                      <p className="m-0 mt-1 text-[10px] text-slate-400">
                        Filed on {new Date(req.date).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800">
                      Pending
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
