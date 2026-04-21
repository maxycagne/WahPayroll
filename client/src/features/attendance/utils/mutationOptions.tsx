import axiosInterceptor from "@/hooks/interceptor";
import { mutationOptions } from "@tanstack/react-query";

export const adjustLeaveBalanceMutationOptions = mutationOptions({
  mutationFn: async (payload: {
    empId: string | number;
    amount: number | string;
  }) => {
    const res = await axiosInterceptor.put(
      `/api/employees/leave-balance/${payload.empId}`,
      {
        adjustment: payload.amount,
      },
    );
    return res.data;
  },
});

export const saveDailyAttendanceMutationOptions = mutationOptions({
  mutationFn: async (payload: {
    selectedDate: string;
    records: unknown[];
  }) => {
    const res = await axiosInterceptor.post("/api/employees/attendance-bulk", {
      date: payload.selectedDate,
      records: payload.records,
    });
    return res.data;
  },
});

export const saveWorkweekMutationOptions = mutationOptions({
  mutationFn: async (payload: Record<string, unknown>) => {
    const res = await axiosInterceptor.post(
      "/api/employees/workweek-config",
      payload,
    );
    return res.data;
  },
});

export const updateWorkweekMutationOptions = mutationOptions({
  mutationFn: async (payload: {
    id: string | number;
    data: Record<string, unknown>;
  }) => {
    const res = await axiosInterceptor.put(
      `/api/employees/workweek-config/${payload.id}`,
      payload.data,
    );
    return res.data;
  },
});

export const deleteWorkweekMutationOptions = mutationOptions({
  mutationFn: async (id: string | number) => {
    const res = await axiosInterceptor.delete(
      `/api/employees/workweek-config/${id}`,
    );
    return res.data;
  },
});
