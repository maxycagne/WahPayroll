import { queryOptions } from "@tanstack/react-query";
import axiosInterceptor from "@/hooks/interceptor";
import { mutationHandler } from "@/features/leave/hooks/createMutationHandler";

const fetchData = async <TData>(
  promise: Promise<{ data: TData }>,
  errorMsg: string,
): Promise<TData> => (await mutationHandler(promise, errorMsg)) as TData;

export const dashboardSummaryQueryOptions = <TData>() =>
  queryOptions({
    queryKey: ["dashboardSummary"] as const,
    queryFn: () =>
      fetchData<TData>(
        axiosInterceptor.get("/api/employees/dashboard-summary"),
        "Failed to fetch dashboard summary",
      ),
  });

export const dashboardEmployeesQueryOptions = <TData>() =>
  queryOptions({
    queryKey: ["dashboard-employees"] as const,
    queryFn: () =>
      fetchData<TData>(
        axiosInterceptor.get("/api/employees"),
        "Failed to fetch employees",
      ),
  });

export const dashboardPayrollQueryOptions = <TData>(period: string) =>
  queryOptions({
    queryKey: ["dashboard-payroll", period] as const,
    queryFn: () =>
      fetchData<TData>(
        axiosInterceptor.get(`/api/employees/payroll?period=${period}`),
        "Failed to fetch payroll",
      ),
  });

export const dashboardAttendanceSummaryQueryOptions = <TData>(
  year: number,
  month: number,
) =>
  queryOptions({
    queryKey: ["dashboard-attendance-summary", year, month] as const,
    queryFn: () =>
      fetchData<TData>(
        axiosInterceptor.get(
          `/api/employees/attendance-summary?year=${year}&month=${month}`,
        ),
        "Failed to fetch attendance summary",
      ),
  });

export const dashboardMyAttendanceQueryOptions = <TData>(
  empId?: string | number,
) =>
  queryOptions({
    queryKey: ["my-attendance", empId] as const,
    queryFn: () =>
      fetchData<TData>(
        axiosInterceptor.get("/api/employees/my-attendance"),
        "Failed to fetch attendance",
      ),
  });

export const dashboardEmployeeLeavesQueryOptions = <TData>() =>
  queryOptions({
    queryKey: ["leaves"] as const,
    queryFn: () =>
      fetchData<TData>(
        axiosInterceptor.get("api/leaves/"),
        "Failed to fetch leaves",
      ),
  });

export const dashboardSupervisorLeavesQueryOptions = <TData>() =>
  queryOptions({
    queryKey: ["leaves"] as const,
    queryFn: () =>
      fetchData<TData>(
        axiosInterceptor.get("/api/employees/leaves"),
        "Failed to fetch leaves",
      ),
  });

export const dashboardOffsetApplicationsQueryOptions = <TData>() =>
  queryOptions({
    queryKey: ["offset-applications"] as const,
    queryFn: () =>
      fetchData<TData>(
        axiosInterceptor.get("/api/employees/offset-applications"),
        "Failed to fetch offset applications",
      ),
  });

export const dashboardResignationsQueryOptions = <TData>() =>
  queryOptions({
    queryKey: ["resignations"] as const,
    queryFn: () =>
      fetchData<TData>(
        axiosInterceptor.get("/api/employees/resignations"),
        "Failed to fetch resignations",
      ),
  });
