import { queryOptions } from "@tanstack/react-query";
import axiosInterceptor from "@/hooks/interceptor";
import { mutationHandler } from "@/features/leave/hooks/createMutationHandler";

export const employeesQueryOptions = queryOptions({
  queryKey: ["employees"],
  queryFn: () =>
    mutationHandler(
      axiosInterceptor.get("/api/employees"),
      "Failed to fetch employees",
    ),
});

export const fileManagementInventoryQueryOptions = (role?: string | number) =>
  queryOptions({
    queryKey: ["file-management", role] as const,
    queryFn: () =>
      mutationHandler(
        axiosInterceptor.get("/api/employees/file-management"),
        "Failed to load file inventory",
      ),
  });

export const fileTemplatesQueryOptions = (role?: string | number) =>
  queryOptions({
    queryKey: ["file-templates", role] as const,
    queryFn: async () => {
      const payload = await mutationHandler(
        axiosInterceptor.get("/api/employees/file-templates"),
        "Failed to load templates",
      );
      return Array.isArray(payload) ? payload : [];
    },
  });
