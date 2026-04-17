import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { CurrentUser, StatusBadgeClass } from "../types/Dashboard";
import type {
  SupervisorAttendanceRow,
  SupervisorDashboardSummaryData,
  SupervisorLeaveRow,
  SupervisorOffsetRow,
  SupervisorPendingRequest,
  SupervisorPersonalSummary,
  SupervisorResignationRow,
  SupervisorTeamSummary,
} from "../types/SupervisorDashboard";
import {
  dashboardMyAttendanceQueryOptions,
  dashboardOffsetApplicationsQueryOptions,
  dashboardResignationsQueryOptions,
  dashboardSummaryQueryOptions,
  dashboardSupervisorLeavesQueryOptions,
} from "./queryOptions";

const statusClass: StatusBadgeClass = {
  Present: "bg-emerald-100 text-emerald-800",
  Late: "bg-amber-100 text-amber-800",
  Undertime: "bg-rose-100 text-rose-800",
  "Half-Day": "bg-orange-100 text-orange-800",
  Absent: "bg-red-100 text-red-800",
  "On Leave": "bg-violet-100 text-violet-800",
  Pending: "bg-slate-100 text-slate-700",
};

export function useSupervisorDashboardData(currentUser: CurrentUser) {
  const { data: dashboardData, isLoading: dashLoading } =
    useQuery(dashboardSummaryQueryOptions<SupervisorDashboardSummaryData>());

  const { data: myAttendance = [], isLoading: attLoading } =
    useQuery(
      dashboardMyAttendanceQueryOptions<SupervisorAttendanceRow[]>(
        currentUser?.emp_id,
      ),
    );

  const { data: leaves = [] } = useQuery(
    dashboardSupervisorLeavesQueryOptions<SupervisorLeaveRow[]>(),
  );

  const { data: offsets = [] } = useQuery(
    dashboardOffsetApplicationsQueryOptions<SupervisorOffsetRow[]>(),
  );

  const { data: resignations = [] } = useQuery(
    dashboardResignationsQueryOptions<SupervisorResignationRow[]>(),
  );

  const summaryData: SupervisorDashboardSummaryData = dashboardData || {};
  const personalSummary: SupervisorPersonalSummary =
    summaryData.personalSummary || {};
  const teamSummary: Required<SupervisorTeamSummary> = {
    teamSize: Number(summaryData.teamSummary?.teamSize || 0),
    presentCount: Number(summaryData.teamSummary?.presentCount || 0),
    lateCount: Number(summaryData.teamSummary?.lateCount || 0),
    absentCount: Number(summaryData.teamSummary?.absentCount || 0),
    onLeaveCount: Number(summaryData.teamSummary?.onLeaveCount || 0),
    pendingApprovals: Number(summaryData.teamSummary?.pendingApprovals || 0),
  };
  const teamAttendanceRows = summaryData.teamAttendanceStatus || [];
  const teamPendingRequests = summaryData.teamPendingRequests || [];

  const myPendingRequests = useMemo<SupervisorPendingRequest[]>(
    () =>
      [
        ...leaves
          .filter(
            (row) =>
              String(row.emp_id) === String(currentUser.emp_id) &&
              String(row.status || "").toLowerCase() === "pending",
          )
          .map((row) => ({
            id: `leave-${row.id}`,
            type: "Leave" as const,
            detail: row.leave_type || "Leave request",
            created_at:
              row.created_at || row.date_from || new Date().toISOString(),
          })),
        ...offsets
          .filter(
            (row) =>
              String(row.emp_id) === String(currentUser.emp_id) &&
              ["pending", "pending approval"].includes(
                String(row.status || "").toLowerCase(),
              ),
          )
          .map((row) => ({
            id: `offset-${row.id}`,
            type: "Offset" as const,
            detail: `${Number(row.days_applied || 0)} day(s)`,
            created_at:
              row.created_at || row.date_from || new Date().toISOString(),
          })),
        ...resignations
          .filter(
            (row) =>
              String(row.emp_id) === String(currentUser.emp_id) &&
              String(row.status || "").toLowerCase() === "pending approval",
          )
          .map((row) => ({
            id: `resignation-${row.id}`,
            type: "Resignation" as const,
            detail: row.resignation_type || "Resignation request",
            created_at: row.created_at || new Date().toISOString(),
          })),
      ]
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )
        .slice(0, 6),
    [currentUser.emp_id, leaves, offsets, resignations],
  );

  const employeeStatus = personalSummary.employeeStatus || currentUser?.status || "N/A";

  return {
    isLoading: dashLoading || attLoading,
    personalSummary,
    employeeStatus,
    teamSummary,
    teamAttendanceRows,
    teamPendingRequests,
    myAttendance,
    myPendingRequests,
    statusClass,
  };
}
