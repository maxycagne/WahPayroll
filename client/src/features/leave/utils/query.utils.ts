// hooks/queries/leaveQueries.ts
import axiosInterceptor from "@/hooks/interceptor";
import { queryOptions } from "@tanstack/react-query";
import { mutationHandler } from "../hooks/createMutationHandler";

/**
 * Query for all leaves
 */
export const leavesQueryOptions = queryOptions({
  queryKey: ["leaves"],
  queryFn: () =>
    mutationHandler(
      axiosInterceptor.get("/api/leaves"),
      "Failed to fetch leaves",
    ),
  staleTime: 5 * 60 * 1000,
});

/**
 * Query for my attendance
 */
export const myAttendanceQueryOptions = (empId: string) =>
  queryOptions({
    queryKey: ["my-attendance", empId],
    enabled: !!empId,
    queryFn: () =>
      mutationHandler(
        axiosInterceptor.get(`/api/employees/my-attendance`),
        "Failed to fetch Attendance",
      ),
    staleTime: 5 * 60 * 1000,
  });

/**
 * Query for offset applications
 */
export const offsetApplicationsQueryOptions = queryOptions({
  queryKey: ["offset-applications"],
  queryFn: () =>
    mutationHandler(
      axiosInterceptor.get("/api/employees/offset-applications"),
      "Failed to fetch offset applications",
    ),
  staleTime: 5 * 60 * 1000,
});

/**
 * Query for offset balance
 */
export const offsetBalanceQueryOptions = (empId: string) =>
  queryOptions({
    queryKey: ["offset-balance", empId],
    enabled: !!empId,
    queryFn: () =>
      mutationHandler(
        axiosInterceptor.get(`/api/employees/offset-balance/${empId}`),
        "Failed to fetch offset balance",
      ),
    staleTime: 5 * 60 * 1000,
  });

/**
 * Query for resignations
 */
export const resignationQueryOptions = queryOptions({
  queryKey: ["resignations"],
  queryFn: () =>
    mutationHandler(
      axiosInterceptor.get(`/api/employees/resignations`),
      "Failed to fetch resignations",
    ),
  staleTime: 5 * 60 * 1000,
});

/**
 * Query for workweek configs
 */
export const workweekConfigQueryOptions = queryOptions({
  queryKey: ["workweek-config"],
  queryFn: () =>
    mutationHandler(
      axiosInterceptor.get("/api/employees/workweek-config"),
      "Failed to fetch workweek config",
    ),
  staleTime: 5 * 60 * 1000,
});

