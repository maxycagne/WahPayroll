import axiosInterceptor from "@/hooks/interceptor";
import { mutationOptions, useQueryClient } from "@tanstack/react-query";

export const updateMutationDoc = mutationOptions({
  mutationFn: async (data: { emp_id: number; missing_docs: string[] }) => {
    const res = await axiosInterceptor.post("/api/employees/missing-docs", {
      emp_id: data.emp_id,
      missing_docs: data.missing_docs.join(", "),
    });

    return res.data;
  },
});

export const updateResignationMutationOptions = mutationOptions({
  mutationFn: async ({ id, status }: { id: number; status: string }) => {
    const res = await axiosInterceptor.put(
      `/api/employees/resignations/${id}`,
      { status },
    );
  },
  onError: () => alert("Error updating resignation"),
});
