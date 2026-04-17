import { queryOptions } from "@tanstack/react-query";
import axiosInterceptor from "@/hooks/interceptor";
import { mutationHandler } from "@/features/leave/hooks/createMutationHandler";

export const payrollByPeriodQueryOptions = (period: string) =>
  queryOptions({
    queryKey: ["payroll", period],
    queryFn: () =>
      mutationHandler(
        axiosInterceptor.get(`/api/employees/payroll?period=${period}`),
        "Failed to fetch payroll",
      ),
  });

export const salaryHistoryQueryOptions = (payload: {
  empId?: string | number;
  period: string;
}) =>
  queryOptions({
    queryKey: ["salary-history", payload.empId, payload.period],
    enabled: Boolean(payload.empId),
    queryFn: () =>
      mutationHandler(
        axiosInterceptor.get(
          `/api/employees/salary-history/${payload.empId}?period=${payload.period}`,
        ),
        "Failed to fetch salary history",
      ),
  });

export const payrollReportsQueryOptions = queryOptions({
  queryKey: ["payroll-reports"],
  queryFn: () =>
    mutationHandler(
      axiosInterceptor.get("/api/employees/payroll-reports"),
      "Failed to fetch reports",
    ),
});

export const myPayrollReportQueryOptions = (period: string) =>
  queryOptions({
    queryKey: ["my-payroll-report", period],
    queryFn: () =>
      mutationHandler(
        axiosInterceptor.get(`/api/employees/payroll?period=${period}`),
        "Failed to fetch payroll report",
      ),
  });
