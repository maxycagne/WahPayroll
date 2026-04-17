import { queryOptions } from "@tanstack/react-query";
import axiosInterceptor from "@/hooks/interceptor";

export const notificationsQueryOptions = queryOptions({
  queryKey: ["notifications"],
  queryFn: async () => {
    const res = await axiosInterceptor.get("/api/employees/notifications");
    if (res?.status && res.status !== 200) throw new Error("Failed to fetch notifications");
    return res?.data || [];
  },
  refetchInterval: 30000,
});
