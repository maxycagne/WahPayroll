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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewDate, setViewDate] = useState(new Date());
  
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("wah_user") || "null");
    } catch {
      return null;
    }
  }, []);

  const canEditAttendance = currentUser?.role === "Admin" || currentUser?.role === "HR";
  const canConfigureWorkweek = currentUser?.role === "Admin" || currentUser?.role === "HR";

  const [calendarScope, setCalendarScope] = useState(
    currentUser?.role === "Admin" || currentUser?.role === "HR" ? "overall" : 
    currentUser?.role === "Supervisor" ? "team" : "own"
  );

  const calendarScopeOptions = useMemo(() => {
    if (currentUser?.role === "Admin" || currentUser?.role === "HR") {
      return [{ key: "overall", label: "Overall Attendance" }];
    }
    const options = [{ key: "own", label: "My Attendance" }];
    if (currentUser?.role === "Supervisor") {
      options.push({ key: "team", label: "Team Attendance" });
    }
    return options;
  }, [currentUser]);

  // Specialized Hooks
  const stats = useAttendanceStats(canEditAttendance);
  const daily = useDailyAttendance(selectedDate, canEditAttendance, showToast);
  const workweek = useWorkweekConfig(showToast);
  const balance = useAdjustBalance(showToast);
  const details = useDateDetails(selectedDate, calendarScope);

  useEffect(() => {
    if (!shortcutMode && searchParams.get("open") !== "take-attendance") return;

    // BUG 1 FIX: Only Admin/HR can open the attendance entry modal via URL shortcut
    if (!canEditAttendance) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("open");
      setSearchParams(nextParams, { replace: true });
      return;
    }

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
    queryKey: ["attendance", currentPage, itemsPerPage, search],
    queryFn: () => getAttendance(currentPage, itemsPerPage, search),
    staleTime: 5 * 60 * 1000,
    enabled: canEditAttendance, // BUG 6 FIX: Only Admin/HR see the attendance table
  });

  const calendarSummaryQuery = useQuery({
    queryKey: ["attendance-calendar", year, month, calendarScope],
    queryFn: () => getAttendanceCalendarSummary(year, month, calendarScope),
    staleTime: 5 * 60 * 1000,
  });

  const overviewStats = useMemo(() => {
    const list = attendanceQuery.data?.data || [];
    return list.reduce(
      (acc: any, row: any) => {
        const primary = row.status || "Pending";
        if (primary === "Present") acc.present += 1;
        if (primary === "Absent") acc.absent += 1;
        if (primary === "On Leave") acc.onLeave += 1;
        if (primary === "Pending") acc.pending += 1;
        if (row.status2) acc.withSecondary += 1;
        return acc;
      },
      { total: list.length, present: 0, absent: 0, onLeave: 0, pending: 0, withSecondary: 0 }
    );
  }, [attendanceQuery.data]);

  return {
    // BUG B FIX: Use calendarSummary loading since attendanceQuery is disabled for non-Admin/HR
    isLoading: canEditAttendance ? attendanceQuery.isLoading : calendarSummaryQuery.isLoading,
    attendance: attendanceQuery.data?.data || [],
    totalRecords: attendanceQuery.data?.total || 0,
    totalPages: attendanceQuery.data?.totalPages || 1,
    currentPage,
    setCurrentPage,
    calendarSummary: calendarSummaryQuery.data || [],
    canEditAttendance,
    canConfigureWorkweek,
    search, setSearch,
    viewDate, setViewDate,
    year, month,
    selectedDate, setSelectedDate,
    calendarScope,
    setCalendarScope,
    calendarScopeOptions,
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
