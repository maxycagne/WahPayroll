import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAttendanceStats } from "../api";
import { getCurrentPeriod, formatMonthLabel } from "../utils";

export const useAttendanceStats = (enabled: boolean) => {
  const [mode, setMode] = useState<"month" | "range" | "year">("month");
  const [month, setMonth] = useState(getCurrentPeriod());
  const [rangeStart, setRangeStart] = useState(getCurrentPeriod());
  const [rangeEnd, setRangeEnd] = useState(getCurrentPeriod());
  const [year, setYear] = useState(String(new Date().getFullYear()));

  const statsParams = useMemo(() => {
    const params = new URLSearchParams({ mode });
    if (mode === "range") {
      params.set("start", rangeStart);
      params.set("end", rangeEnd);
    } else if (mode === "year") {
      params.set("year", year);
    } else {
      params.set("month", month);
    }
    return params;
  }, [mode, month, rangeStart, rangeEnd, year]);

  const query = useQuery({
    queryKey: ["attendance-stats", statsParams.toString()],
    enabled,
    queryFn: () => getAttendanceStats(statsParams),
  });

  const label = useMemo(() => {
    if (mode === "range") return `${formatMonthLabel(rangeStart)} - ${formatMonthLabel(rangeEnd)}`;
    if (mode === "year") return year;
    return formatMonthLabel(month);
  }, [mode, month, rangeStart, rangeEnd, year]);

  const topAbsences = useMemo(() => {
    return [...(query.data || [])]
      .filter((row) => Number(row.total_absences || 0) > 0)
      .sort((a, b) => Number(b.total_absences || 0) - Number(a.total_absences || 0))
      .slice(0, 5);
  }, [query.data]);

  const topApprovedLeave = useMemo(() => {
    return [...(query.data || [])]
      .filter((row) => Number(row.approved_leave_days || 0) > 0)
      .sort((a, b) => Number(b.approved_leave_days || 0) - Number(a.approved_leave_days || 0))
      .slice(0, 5);
  }, [query.data]);

  const lowestLeaveBalance = useMemo(() => {
    return [...(query.data || [])]
      .sort((a, b) => Number(a.leave_balance || 0) - Number(b.leave_balance || 0))
      .slice(0, 5);
  }, [query.data]);

  return {
    mode, setMode,
    month, setMonth,
    rangeStart, setRangeStart,
    rangeEnd, setRangeEnd,
    year, setYear,
    label,
    isLoading: query.isLoading,
    topAbsences,
    topApprovedLeave,
    lowestLeaveBalance
  };
};
