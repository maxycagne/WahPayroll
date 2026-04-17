import axiosInterceptor from "@/hooks/interceptor";
import { mutationHandler } from "@/features/leave/hooks/createMutationHandler";

export const addEmployeeMutationFn = (newData: Record<string, unknown>) => {
  const autoPassword = `${newData.emp_id}${String(newData.first_name || "").replace(/\s+/g, "")}`;
  return axiosInterceptor.post("/api/employees/add", {
    ...newData,
    password: autoPassword,
  });
};

export const updateEmployeeMutationFn = (updatedData: {
  emp_id: string | number;
  [key: string]: unknown;
}) =>
  mutationHandler(
    axiosInterceptor.put(`/api/employees/${updatedData.emp_id}`, updatedData),
    "Failed to update employee",
  );

export const deleteEmployeeMutationFn = (id: string | number) =>
  mutationHandler(
    axiosInterceptor.delete(`/api/employees/${id}`),
    "Failed to delete employee",
  );

export const resetEmployeePasswordMutationFn = async (emp: {
  emp_id: string | number;
  [key: string]: unknown;
}) => {
  const data = await mutationHandler(
    axiosInterceptor.put(`/api/employees/${emp.emp_id}/reset-password`),
    "Failed to reset password",
  );
  return { ...data, emp };
};

