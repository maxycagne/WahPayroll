import axiosInterceptor from "@/hooks/interceptor";
import { queryOptions } from "@tanstack/react-query";

export const attendanceCount = queryOptions({
  queryKey: ["attendance count"],
  queryFn: async () => {
    const res = await axiosInterceptor.get("/api/reports/attendance-count");
    console.log(res.data);
    return res.data;
  },
});
