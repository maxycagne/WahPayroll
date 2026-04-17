export type UserRole = "RankAndFile" | "Supervisor" | "Admin" | "HR" | string;

export interface CurrentUser {
  emp_id?: string | number;
  role?: UserRole;
  status?: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  [key: string]: unknown;
}

export interface DashboardViewProps {
  currentUser: CurrentUser;
}

export type StatusBadgeClass = Record<string, string>;

export type TooltipEntry = {
  dataKey?: string | number;
  color?: string;
  name?: string;
  value?: string | number | null;
};

export type DashboardTooltipProps = {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
};
