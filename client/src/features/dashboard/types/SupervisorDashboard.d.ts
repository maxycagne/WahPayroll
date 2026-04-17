export type SupervisorPendingRequest = {
  id: string;
  type: "Leave" | "Offset" | "Resignation";
  detail: string;
  created_at: string;
};

export type SupervisorPersonalSummary = {
  employeeStatus?: string;
  todayAttendanceStatus?: string;
  leaveBalance?: number | string;
  offsetCredits?: number | string;
  pendingRequestCount?: number | string;
};

export type SupervisorTeamSummary = {
  teamSize?: number;
  presentCount?: number;
  lateCount?: number;
  absentCount?: number;
  onLeaveCount?: number;
  pendingApprovals?: number;
};

export type SupervisorTeamAttendanceRow = {
  emp_id: string | number;
  first_name: string;
  last_name: string;
  status: string;
};

export type SupervisorTeamPendingRow = {
  id: string | number;
  first_name: string;
  last_name: string;
  type: string;
  detail?: string;
  created_at: string;
};

export type SupervisorDashboardSummaryData = {
  personalSummary?: SupervisorPersonalSummary;
  teamSummary?: SupervisorTeamSummary;
  teamAttendanceStatus?: SupervisorTeamAttendanceRow[];
  teamPendingRequests?: SupervisorTeamPendingRow[];
};

export type SupervisorAttendanceRow = {
  date: string;
  status: string;
};

export type SupervisorLeaveRow = {
  id: string | number;
  emp_id?: string | number;
  status?: string;
  leave_type: string;
  created_at?: string;
  date_from?: string;
};

export type SupervisorOffsetRow = {
  id: string | number;
  emp_id?: string | number;
  status?: string;
  days_applied?: number | string;
  created_at?: string;
  date_from?: string;
};

export type SupervisorResignationRow = {
  id: string | number;
  emp_id?: string | number;
  status?: string;
  resignation_type: string;
  created_at?: string;
};
