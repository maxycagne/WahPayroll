import axiosInterceptor from "@/hooks/interceptor";
import { mutationHandler } from "@/features/leave/hooks/createMutationHandler";

export const sendPayslipMutationFn = (payload: {
  empId: string | number;
  period: string;
}) =>
  mutationHandler(
    axiosInterceptor.post(`/api/employees/payroll/${payload.empId}/send-payslip`, {
      period: payload.period,
    }),
    "Failed to send payslip",
  );

export const sendBulkPayslipsMutationFn = (period: string) =>
  mutationHandler(
    axiosInterceptor.post("/api/employees/payroll/send-bulk-payslips", {
      period,
    }),
    "Failed to send bulk payslips",
  );

export const saveSalaryAdjustmentMutationFn = (payload: Record<string, unknown>) =>
  mutationHandler(
    axiosInterceptor.post("/api/employees/salary-adjustment", payload),
    "Failed to save adjustments",
  );

export const updateSalaryHistoryEntryMutationFn = (payload: {
  id: string | number;
  type: string;
  amount: number | string;
  description?: string;
}) =>
  mutationHandler(
    axiosInterceptor.put(`/api/employees/salary-history/${payload.id}`, {
      type: payload.type,
      amount: payload.amount,
      description: payload.description,
    }),
    "Failed to update adjustment",
  );

export const deleteSalaryHistoryEntryMutationFn = (id: string | number) =>
  mutationHandler(
    axiosInterceptor.delete(`/api/employees/salary-history/${id}`),
    "Failed to remove adjustment",
  );

export const updateBaseSalaryMutationFn = (payload: Record<string, unknown>) =>
  mutationHandler(
    axiosInterceptor.put("/api/employees/update-base-salary", payload),
    "Failed to update base salary",
  );

export const generatePayrollMutationFn = (period: string) =>
  mutationHandler(
    axiosInterceptor.post("/api/employees/generate-payroll", { period }),
    "Failed to generate payroll",
  );

export const resetPayrollMutationFn = () =>
  mutationHandler(
    axiosInterceptor.post("/api/employees/reset-payroll"),
    "Failed to reset payroll data",
  );

