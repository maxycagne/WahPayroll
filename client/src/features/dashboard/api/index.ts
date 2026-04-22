import axiosInterceptor from "@/hooks/interceptor";
import { mutationHandler } from "@/features/leave/hooks/createMutationHandler";

export const getDashboardSummary = () =>
  mutationHandler(axiosInterceptor.get("/api/employees/dashboard-summary"));

export const getMyAttendance = () =>
  mutationHandler(axiosInterceptor.get("/api/employees/my-attendance"));

export const getMyLeaves = () =>
  mutationHandler(axiosInterceptor.get("api/leaves/"));

export const getMyOffsets = () =>
  mutationHandler(axiosInterceptor.get("/api/employees/offset-applications"));

export const getAllEmployees = () =>
  mutationHandler(axiosInterceptor.get("/api/employees"));

export const getPayroll = (period: string) =>
  mutationHandler(axiosInterceptor.get(`/api/employees/payroll?period=${period}`));

export const getAttendanceSummary = (year: number, month: number) =>
  mutationHandler(
    axiosInterceptor.get(
      `/api/employees/attendance-summary?year=${year}&month=${month}`
    )
  );

export const updateLeaveStatus = (id: string | number, payload: any) =>
  axiosInterceptor.put(`/api/employees/leaves/${id}`, { payload });

export const getSupervisorLeaves = () =>
  mutationHandler(axiosInterceptor.get("/api/employees/leaves"));

export const getSupervisorResignations = () =>
  mutationHandler(axiosInterceptor.get("/api/employees/resignations"));
