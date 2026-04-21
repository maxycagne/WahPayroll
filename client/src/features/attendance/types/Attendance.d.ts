export interface AttendanceRecord {
  emp_id: string;
  first_name: string;
  last_name: string;
  emp_status: string;
  status: string | null;
  status2: string | null;
  total_absences: number;
}

export interface CalendarSummary {
  date: string;
  present_count: number;
  late_count: number;
  undertime_count: number;
  halfday_count: number;
  leave_count: number;
  absent_count: number;
}

export interface WorkweekConfig {
  id: number;
  workweek_type: string;
  effective_from: string;
  effective_to: string | null;
  hours_per_day: number;
  absence_unit: number;
}

export interface DailyAttendanceRecord {
  emp_id: string;
  first_name: string;
  last_name: string;
  attendance_status: string | null;
  status2: string | null;
  emp_status: string;
  designation?: string;
  position?: string;
}

export interface AttendanceForm {
  [emp_id: string]: string;
}

export interface WorkweekForm {
  workweek_type: string;
  effective_from: string;
  effective_to: string;
}
