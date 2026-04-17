import type { ReactNode } from "react";

export type DashboardModal = "pending" | "leave" | "absent" | "recent-activity";
export type QuickActionHost = "employees" | "attendance" | "payroll";
export type QuickActionType =
  | "add-employee"
  | "take-attendance"
  | "salary-settings";
export type LeaveDecisionStatus = "Approved" | "Denied";
export type LeavePriority = "High" | "Medium" | "Low";

export type LeaveRequestRow = {
  id: string | number;
  first_name: string;
  last_name: string;
  leave_type: string;
  date_from: string;
  date_to: string;
  priority?: LeavePriority | string;
  [key: string]: unknown;
};

export type ReviewConfirmState = {
  employee: LeaveRequestRow;
  status: LeaveDecisionStatus;
  totalDays: number;
  isMultiDay: boolean;
  selectedDates: string[];
  remarks: string;
};

export type QuickAction = {
  label: string;
  sub: string;
  action: QuickActionType;
  icon: ReactNode;
  color: string;
};

export type DashboardCard = {
  label: string;
  value: number;
  borderColor: string;
  icon: ReactNode;
  clickable: boolean;
  modalKey?: DashboardModal;
};

export type AdminDashboardSummaryData = {
  pendingLeaves?: LeaveRequestRow[];
  onLeave?: Array<Pick<LeaveRequestRow, "first_name" | "last_name" | "leave_type">>;
  absents?: Array<Pick<LeaveRequestRow, "first_name" | "last_name">>;
  resignations?: unknown[];
  recentActivities?: Array<{
    date: string;
    employee: string;
    status: string;
    type: string;
    activity: string;
  }>;
};

export type AdminEmployeeRow = {
  status?: string;
  role?: string;
};

export type AdminPayrollRow = {
  emp_id?: string | number;
  gross_pay?: number | string;
  net_pay?: number | string;
  absence_deductions?: number | string;
};

export type AdminAttendanceSummaryRow = {
  formatted_date?: string;
  date?: string;
  present_count?: number | string;
  absent_count?: number | string;
  late_count?: number | string;
};

export type AdminPayrollTotals = {
  gross: number;
  net: number;
  deductions: number;
};

export type AdminAttendanceTotals = {
  present: number;
  absent: number;
  late: number;
};

export type AdminAttendanceChartRow = {
  day: string;
  Present: number;
  Absent: number;
  Late: number;
};

export type AdminPayrollChartRow = {
  employee: string;
  Net: number;
  Gross: number;
};
