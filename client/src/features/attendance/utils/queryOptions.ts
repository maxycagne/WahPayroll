import { queryOptions } from "@tanstack/react-query";
import axiosInterceptor from "@/hooks/interceptor";
import { mutationHandler } from "@/features/leave/hooks/createMutationHandler";

export const attendanceQueryOptions = queryOptions({
  queryKey: ["attendance"],
  queryFn: () =>
    mutationHandler(
      axiosInterceptor.get("/api/employees/attendance"),
      "Failed to fetch attendance",
    ),
});

export const attendanceCalendarSummaryQueryOptions = (
  year: number,
  month: number,
) =>
  queryOptions({
    queryKey: ["attendance-calendar", year, month],
    queryFn: () =>
      mutationHandler(
        axiosInterceptor.get(
          `/api/employees/attendance-summary?year=${year}&month=${month}`,
        ),
        "Failed to fetch attendance summary",
      ),
  });

export const attendanceWorkweekConfigQueryOptions = queryOptions({
  queryKey: ["workweek-config"],
  queryFn: () =>
    mutationHandler(
      axiosInterceptor.get("/api/employees/workweek-config"),
      "Failed to fetch workweek config",
    ),
});

export const attendanceDailyQueryOptions = (
  selectedDate: string | null,
  enabled: boolean,
) =>
  queryOptions({
    queryKey: ["attendance-daily", selectedDate],
    enabled: Boolean(selectedDate) && enabled,
    queryFn: async () =>
      mutationHandler(
        axiosInterceptor.get(
          `/api/employees/attendance-daily?date=${selectedDate}`,
        ),
        "Failed to fetch attendance daily list",
      ),
  });
