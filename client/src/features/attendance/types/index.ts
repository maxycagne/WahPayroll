export type AttendanceStatus = "Present" | "Late" | "Undertime" | "Half-Day" | "Absent" | "On Leave" | "Pending" | "No-notice-via-text" | "No-notice-email" | "";

export type WorkweekType = "5-day" | "4-day";

export interface AttendanceRecord {
  emp_id: string;
  first_name: string;
  last_name: string;
  designation: string;
  status: AttendanceStatus;
  status2: AttendanceStatus | null;
  leave_balance: number;
}

export interface AttendanceCalendarSummary {
  date: string;
  formatted_date: string;
  present_count: number;
  absent_count: number;
  late_count: number;
  undertime_count: number;
  halfday_count: number;
  leave_count: number;
  no_notice_text_count: number;
  no_notice_email_count: number;
}

export interface WorkweekConfig {
  id: number;
  workweek_type: WorkweekType;
  effective_from: string;
  effective_to: string | null;
  hours_per_day: number;
  absence_unit: number;
}

export interface AttendanceStats {
  emp_id: string;
  first_name: string;
  last_name: string;
  designation: string;
  position: string;
  total_absences: number;
  approved_leave_days: number;
  approved_leave_count: number;
  leave_balance: number;
}

export interface DailyAttendance {
  emp_id: string;
  first_name: string;
  last_name: string;
  attendance_status: AttendanceStatus;
  status2: AttendanceStatus | null;
  emp_status: string;
  designation: string;
  position: string;
}

export interface User {
  emp_id: string;
  first_name: string;
  last_name: string;
  role: "Admin" | "HR" | "Supervisor" | "RankAndFile";
  designation?: string;
}
