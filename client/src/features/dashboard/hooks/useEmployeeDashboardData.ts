import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type {
  EmployeeAttendanceRow,
  EmployeeBalanceRecord,
  EmployeeDashboardSummaryData,
  EmployeeLeaveRow,
  EmployeeMissingDocRecord,
  EmployeeOffsetRow,
  EmployeePendingRequest,
} from "../types/EmployeeDashboard";
import type { CurrentUser, StatusBadgeClass } from "../types/Dashboard";
import {
  dashboardEmployeeLeavesQueryOptions,
  dashboardMyAttendanceQueryOptions,
  dashboardOffsetApplicationsQueryOptions,
  dashboardSummaryQueryOptions,
} from "./queryOptions";

export function useEmployeeDashboardData(currentUser: CurrentUser) {
  const { data: dashboardData, isLoading: dashLoading } =
    useQuery(dashboardSummaryQueryOptions<EmployeeDashboardSummaryData>());

  const { data: myAttendance = [], isLoading: attLoading } =
    useQuery(
      dashboardMyAttendanceQueryOptions<EmployeeAttendanceRow[]>(
        currentUser?.emp_id,
      ),
    );

  const { data: myLeaves = [] } = useQuery(
    dashboardEmployeeLeavesQueryOptions<EmployeeLeaveRow[]>(),
  );

  const { data: myOffsets = [] } = useQuery(
    dashboardOffsetApplicationsQueryOptions<EmployeeOffsetRow[]>(),
  );

  const myBalanceRecord = useMemo<EmployeeBalanceRecord | undefined>(
    () =>
      dashboardData?.balances?.find(
        (b) => String(b.emp_id) === String(currentUser.emp_id),
      ),
    [dashboardData?.balances, currentUser.emp_id],
  );

  const myMissingDocsRecord = useMemo<EmployeeMissingDocRecord | undefined>(
    () =>
      dashboardData?.missingDocs?.find(
        (d) => String(d.emp_id) === String(currentUser.emp_id),
      ),
    [dashboardData?.missingDocs, currentUser.emp_id],
  );

  const displayedLeaveBalance = useMemo(() => {
    const personalSummary = dashboardData?.personalSummary || {};
    return personalSummary.leaveBalance !== undefined
      ? Number(personalSummary.leaveBalance || 0)
      : Number(myBalanceRecord?.leave_balance || 0);
  }, [dashboardData?.personalSummary, myBalanceRecord?.leave_balance]);

  const pendingRequests = useMemo<EmployeePendingRequest[]>(
    () =>
      [
        ...myLeaves
          .filter((l) => l.status === "Pending")
          .map((l) => ({
            id: `l-${l.id}`,
            type: "Leave" as const,
            title: l.leave_type,
            date: l.created_at || l.date_from || new Date().toISOString(),
          })),
        ...myOffsets
          .filter((o) => o.status === "Pending")
          .map((o) => ({
            id: `o-${o.id}`,
            type: "Offset" as const,
            title: `${Number(o.days_applied)} Days Applied`,
            date: o.created_at || o.date_from || new Date().toISOString(),
          })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [myLeaves, myOffsets],
  );

  const badgeClass: StatusBadgeClass = {
    Present: "bg-emerald-100 text-emerald-800",
    Late: "bg-amber-100 text-amber-800",
    Undertime: "bg-rose-100 text-rose-800",
    "Half-Day": "bg-orange-100 text-orange-800",
    Absent: "bg-red-100 text-red-800",
    "On Leave": "bg-violet-100 text-violet-800",
    Pending: "bg-slate-100 text-slate-700",
  };

  const employeeStatus =
    dashboardData?.personalSummary?.employeeStatus || currentUser?.status || "N/A";

  return {
    isLoading: dashLoading || attLoading,
    myAttendance,
    myBalanceRecord,
    myMissingDocsRecord,
    displayedLeaveBalance,
    pendingRequests,
    badgeClass,
    employeeStatus,
  };
}
