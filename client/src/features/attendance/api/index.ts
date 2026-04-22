import axiosInterceptor from "@/hooks/interceptor";
import { mutationHandler } from "@/features/leave/hooks/createMutationHandler";
import { 
  AttendanceCalendarSummary, 
  WorkweekConfig, 
  AttendanceStats, 
  DailyAttendance,
  AttendanceRecord
} from "../types";

export const getAttendance = (page: number, limit: number, search: string): Promise<any> => {
  const params = new URLSearchParams({ page: String(page), limit: String(limit), search });
  return mutationHandler(
    axiosInterceptor.get(`/api/employees/attendance?${params.toString()}`),
    "Failed to fetch attendance"
  );
};

export const getAttendanceCalendarSummary = (year: number, month: number): Promise<AttendanceCalendarSummary[]> =>
  mutationHandler(
    axiosInterceptor.get(
      `/api/employees/attendance-summary?year=${year}&month=${month + 1}`
    ),
    "Failed to fetch attendance summary"
  );

export const getWorkweekConfigs = (): Promise<WorkweekConfig[]> =>
  mutationHandler(
    axiosInterceptor.get("/api/employees/workweek-config"),
    "Failed to fetch workweek config"
  );

export const getAttendanceStats = (params: URLSearchParams): Promise<AttendanceStats[]> =>
  mutationHandler(
    axiosInterceptor.get(`/api/employees/attendance-stats?${params.toString()}`),
    "Failed to fetch attendance stats"
  );

export const getDailyAttendance = (date: string): Promise<DailyAttendance[]> =>
  mutationHandler(
    axiosInterceptor.get(`/api/employees/attendance-daily?date=${date}`),
    "Failed to fetch attendance daily list"
  );

export const adjustLeaveBalance = (empId: string, amount: number) =>
  mutationHandler(
    axiosInterceptor.put(`/api/employees/leave-balance/${empId}`, {
      adjustment: amount,
    }),
    "Failed to adjust leave balance"
  );

export const saveBulkAttendance = (date: string, records: any[]) =>
  mutationHandler(
    axiosInterceptor.post("/api/employees/attendance-bulk", {
      date,
      records,
    }),
    "Failed to save attendance"
  );

export const saveWorkweekConfig = (payload: any) =>
  mutationHandler(
    axiosInterceptor.post("/api/employees/workweek-config", payload),
    "Failed to save workweek config"
  );

export const updateWorkweekConfig = (id: number, payload: any) =>
  mutationHandler(
    axiosInterceptor.put(`/api/employees/workweek-config/${id}`, payload),
    "Failed to update workweek config"
  );

export const deleteWorkweekConfig = (id: number) =>
  mutationHandler(
    axiosInterceptor.delete(`/api/employees/workweek-config/${id}`),
    "Failed to delete workweek config"
  );
