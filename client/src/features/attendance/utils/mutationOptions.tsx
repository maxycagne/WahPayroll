import axiosInterceptor from "@/hooks/interceptor";
import { mutationHandler } from "@/features/leave/hooks/createMutationHandler";

export const adjustLeaveBalanceMutationFn = (payload: {
  empId: string | number;
  amount: number | string;
}) =>
  mutationHandler(
    axiosInterceptor.put(`/api/employees/leave-balance/${payload.empId}`, {
      adjustment: payload.amount,
    }),
    "Failed to adjust leave balance",
  );

export const saveDailyAttendanceMutationFn = (payload: {
  selectedDate: string;
  records: unknown[];
}) =>
  mutationHandler(
    axiosInterceptor.post("/api/employees/attendance-bulk", {
      date: payload.selectedDate,
      records: payload.records,
    }),
    "Failed to save attendance",
  );

export const saveWorkweekMutationFn = (payload: Record<string, unknown>) =>
  mutationHandler(
    axiosInterceptor.post("/api/employees/workweek-config", payload),
    "Failed to save workweek config",
  );

export const updateWorkweekMutationFn = (payload: {
  id: string | number;
  data: Record<string, unknown>;
}) =>
  mutationHandler(
    axiosInterceptor.put(`/api/employees/workweek-config/${payload.id}`, payload.data),
    "Failed to update workweek config",
  );

export const deleteWorkweekMutationFn = (id: string | number) =>
  mutationHandler(
    axiosInterceptor.delete(`/api/employees/workweek-config/${id}`),
    "Failed to delete workweek config",
  );

