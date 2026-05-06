export type Role = "Admin" | "HR" | "Supervisor" | "RankAndFile";

export interface User {
  emp_id: string | number;
  first_name?: string;
  last_name?: string;
  name?: string;
  role: Role;
  status: string;
  position?: string;
  designation?: string;
}

export interface DashboardSummary {
  balances?: any[];
  personalSummary?: {
    leaveBalance?: number;
    employeeStatus?: string;
    todayAttendanceStatus?: string;
    pendingRequestCount?: number;
  };
  pendingLeaves?: any[];
  onLeave?: any[];
  absents?: any[];
  resignations?: any[];
  recentActivities?: any[];
  teamSummary?: {
    teamSize: number;
    presentCount: number;
    lateCount: number;
    absentCount: number;
    onLeaveCount: number;
    pendingApprovals: number;
  };
  teamAttendanceStatus?: any[];
  teamPendingRequests?: any[];
}

export interface AttendanceLog {
  date: string;
  status: string;
  status2?: string;
}

export interface LeaveRequest {
  id: string | number;
  emp_id: string | number;
  first_name: string;
  last_name: string;
  leave_type: string;
  status: string;
  created_at: string;
  date_from: string;
  date_to: string;
  priority: "High" | "Medium" | "Low";
  reason?: string;
  remarks?: string;
  leave_reason?: string;
  documents?: string | any;
  ocp?: string;
  doctor_cert?: string;
  death_cert?: string;
  birth_cert?: string;
  marriage_cert?: string;
}

export interface OffsetRequest {
  id: string | number;
  status: string;
  days_applied: number | string;
  created_at: string;
  date_from: string;
}

export interface PayrollRecord {
  emp_id: string | number;
  gross_pay: number | string;
  net_pay: number | string;
  absence_deductions: number | string;
}

export interface AttendanceSummaryItem {
  formatted_date?: string;
  date?: string;
  present_count: number;
  absent_count: number;
  late_count: number;
}
