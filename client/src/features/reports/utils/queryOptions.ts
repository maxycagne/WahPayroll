import { queryOptions } from "@tanstack/react-query";
import axiosInterceptor from "@/hooks/interceptor";
import { mutationHandler } from "@/features/leave/hooks/createMutationHandler";

export const hrReportsQueryOptions = (reportType: string, dateRange: string) =>
  queryOptions({
    queryKey: ["hr-reports", reportType, dateRange],
    queryFn: async () => {
      const rawData = await mutationHandler(
        axiosInterceptor.get(`/api/hr-reports?type=${reportType}&range=${dateRange}`),
        "Failed to fetch HR reports",
      );

      return rawData.map((item: Record<string, unknown>) => {
        const cleaned = { ...item } as Record<string, unknown>;
        if (cleaned.days != null) cleaned.days = Math.round(Number(cleaned.days));
        if (cleaned.leaveBalance != null)
          cleaned.leaveBalance = Math.round(Number(cleaned.leaveBalance));
        if (cleaned.offsetCredits != null)
          cleaned.offsetCredits = Math.round(Number(cleaned.offsetCredits));
        return cleaned;
      });
    },
  });
