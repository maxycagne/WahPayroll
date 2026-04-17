export type EmployeePendingRequest = {
  id: string;
  type: "Leave" | "Offset";
  title: string;
  date: string;
};

export type EmployeeBalanceRecord = {
  emp_id?: string | number;
  leave_balance?: number | string;
  offset_credits?: number | string;
};

export type EmployeeMissingDocRecord = {
  emp_id?: string | number;
  missing_docs?: string;
};

export type EmployeeDashboardSummaryData = {
  balances?: EmployeeBalanceRecord[];
  missingDocs?: EmployeeMissingDocRecord[];
  personalSummary?: {
    leaveBalance?: number | string;
    employeeStatus?: string;
  };
};

export type EmployeeAttendanceRow = {
  date: string;
  status?: string;
};

export type EmployeeLeaveRow = {
  id: string | number;
  status?: string;
  leave_type: string;
  created_at?: string;
  date_from?: string;
};

export type EmployeeOffsetRow = {
  id: string | number;
  status?: string;
  days_applied?: number | string;
  created_at?: string;
  date_from?: string;
};
