import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type {
  AdminAttendanceChartRow,
  AdminAttendanceSummaryRow,
  AdminAttendanceTotals,
  AdminDashboardSummaryData,
  AdminEmployeeRow,
  AdminPayrollChartRow,
  AdminPayrollRow,
  AdminPayrollTotals,
} from "../types/AdminDashboard";
import {
  dashboardAttendanceSummaryQueryOptions,
  dashboardEmployeesQueryOptions,
  dashboardPayrollQueryOptions,
  dashboardSummaryQueryOptions,
} from "./queryOptions";

export function useAdminDashboardData(period: string) {
  const [year, month] = useMemo(() => period.split("-").map(Number), [period]);

  const dashboardQuery = useQuery(
    dashboardSummaryQueryOptions<AdminDashboardSummaryData>(),
  );

  const employeesQuery = useQuery(
    dashboardEmployeesQueryOptions<AdminEmployeeRow[]>(),
  );

  const payrollQuery = useQuery(
    dashboardPayrollQueryOptions<AdminPayrollRow[]>(period),
  );

  const attendanceSummaryQuery = useQuery(
    dashboardAttendanceSummaryQueryOptions<AdminAttendanceSummaryRow[]>(
      year,
      month,
    ),
  );

  const dashboardData: AdminDashboardSummaryData = dashboardQuery.data || {};
  const employeesData: AdminEmployeeRow[] = employeesQuery.data || [];
  const payrollData: AdminPayrollRow[] = payrollQuery.data || [];
  const attendanceSummary: AdminAttendanceSummaryRow[] =
    attendanceSummaryQuery.data || [];

  const activeEmployeeCount = useMemo(
    () =>
      employeesData.filter(
        (e) =>
          String(e.status || "").toLowerCase() !== "inactive" &&
          String(e.role || "").toLowerCase() !== "admin",
      ).length,
    [employeesData],
  );

  const pendingLeaveCount = dashboardData.pendingLeaves?.length || 0;
  const onLeaveCount = dashboardData.onLeave?.length || 0;
  const absentsCount = dashboardData.absents?.length || 0;
  const pendingResignationCount = dashboardData.resignations?.length || 0;

  const payrollTotals = useMemo<AdminPayrollTotals>(
    () =>
      payrollData.reduce(
        (acc, row) => {
          acc.gross += Number(row.gross_pay || 0);
          acc.net += Number(row.net_pay || 0);
          acc.deductions += Number(row.absence_deductions || 0);
          return acc;
        },
        { gross: 0, net: 0, deductions: 0 },
      ),
    [payrollData],
  );

  const attendanceTotals = useMemo<AdminAttendanceTotals>(
    () =>
      attendanceSummary.reduce(
        (acc, item) => {
          acc.present += Number(item.present_count || 0);
          acc.absent += Number(item.absent_count || 0);
          acc.late += Number(item.late_count || 0);
          return acc;
        },
        { present: 0, absent: 0, late: 0 },
      ),
    [attendanceSummary],
  );

  const attendanceChartData = useMemo<AdminAttendanceChartRow[]>(
    () =>
      attendanceSummary
        .map((item) => ({
          day: String(item.formatted_date || item.date || "").slice(8, 10),
          Present: Number(item.present_count || 0),
          Absent: Number(item.absent_count || 0),
          Late: Number(item.late_count || 0),
        }))
        .sort((a, b) => Number(a.day) - Number(b.day)),
    [attendanceSummary],
  );

  const payrollChartData = useMemo<AdminPayrollChartRow[]>(
    () =>
      [...payrollData]
        .sort((a, b) => Number(b.net_pay || 0) - Number(a.net_pay || 0))
        .slice(0, 8)
        .map((row) => ({
          employee: `${row.emp_id}`,
          Net: Number(row.net_pay || 0),
          Gross: Number(row.gross_pay || 0),
        })),
    [payrollData],
  );

  const isLoading =
    dashboardQuery.isLoading ||
    employeesQuery.isLoading ||
    payrollQuery.isLoading ||
    attendanceSummaryQuery.isLoading;

  return {
    dashboardData,
    activeEmployeeCount,
    pendingLeaveCount,
    onLeaveCount,
    absentsCount,
    pendingResignationCount,
    payrollTotals,
    attendanceTotals,
    attendanceChartData,
    payrollChartData,
    isLoading,
  };
}
