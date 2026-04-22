import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/useToast";
import { 
  getAttendance, 
  getAttendanceCalendarSummary
} from "../api";
import { useAttendanceStats } from "./useAttendanceStats";
import { useDailyAttendance } from "./useDailyAttendance";
import { useWorkweekConfig } from "./useWorkweekConfig";
import { useAdjustBalance } from "./useAdjustBalance";
import { useDateDetails } from "./useDateDetails";

export const useAttendance = (shortcutMode: boolean = false) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast, showToast, clearToast } = useToast();
  
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewDate, setViewDate] = useState(new Date());
  
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("wah_user") || "null");
    } catch {
      return null;
    }
  }, []);

  const canEditAttendance = currentUser?.role === "Admin" || currentUser?.role === "HR";
  const canConfigureWorkweek = currentUser?.role === "Admin" || currentUser?.role === "HR";

  // Specialized Hooks
  const stats = useAttendanceStats(canEditAttendance);
  const daily = useDailyAttendance(selectedDate, canEditAttendance, showToast);
  const workweek = useWorkweekConfig(showToast);
  const balance = useAdjustBalance(showToast);
  const details = useDateDetails(selectedDate);

  useEffect(() => {
    if (!shortcutMode && searchParams.get("open") !== "take-attendance") return;

    const now = new Date();
    const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    setSelectedDate(localDate);
    daily.setIsOpen(true);

    if (shortcutMode) return;

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("open");
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams, shortcutMode]);

  // Main Queries
  const attendanceQuery = useQuery({
    queryKey: ["attendance"],
    queryFn: getAttendance,
  });

  const calendarSummaryQuery = useQuery({
    queryKey: ["attendance-calendar", year, month],
    queryFn: () => getAttendanceCalendarSummary(year, month),
  });

  const overviewStats = useMemo(() => {
    return (attendanceQuery.data || []).reduce(
      (acc, row) => {
        const primary = row.status || "Pending";
        if (primary === "Present") acc.present += 1;
        if (primary === "Absent") acc.absent += 1;
        if (primary === "On Leave") acc.onLeave += 1;
        if (primary === "Pending") acc.pending += 1;
        if (row.status2) acc.withSecondary += 1;
        return acc;
      },
      { total: (attendanceQuery.data || []).length, present: 0, absent: 0, onLeave: 0, pending: 0, withSecondary: 0 }
    );
  }, [attendanceQuery.data]);

  return {
    isLoading: attendanceQuery.isLoading,
    attendance: attendanceQuery.data || [],
    calendarSummary: calendarSummaryQuery.data || [],
    canEditAttendance,
    canConfigureWorkweek,
    search, setSearch,
    viewDate, setViewDate,
    year, month,
    selectedDate, setSelectedDate,
    overviewStats,
    
    // Sub-hooks exposure
    stats,
    daily,
    workweek,
    balance,
    details,
    
    toast, clearToast
  };
};
