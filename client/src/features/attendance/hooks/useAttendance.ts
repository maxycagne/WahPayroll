import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/useToast";
import { useAuthStore } from "@/stores/authStore";
import { AttendanceRecord } from "../types/Attendance";

export function useAttendance(shortcutMode = false) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast, clearToast } = useToast();
  const currentUser = useAuthStore((state) => state.user);

  // Top-level View State
  const [search, setSearch] = useState("");
  const [viewDate, setViewDate] = useState(new Date());

  const year = useMemo(() => viewDate.getFullYear(), [viewDate]);
  const month = useMemo(() => viewDate.getMonth(), [viewDate]);

  // Modal State
  const [workweekModalOpen, setWorkweekModalOpen] = useState(false);
  const [dailyModalDate, setDailyModalDate] = useState<string | null>(null);
  const [dateDetailsDate, setDateDetailsDate] = useState<string | null>(null);
  const [adjModalRecord, setAdjModalRecord] = useState<AttendanceRecord | null>(
    null,
  );

  // Permissions
  const canEditAttendance =
    currentUser?.role === "Admin" || currentUser?.role === "HR";
  const canConfigureWorkweek =
    currentUser?.role === "Admin" || currentUser?.role === "HR";

  // Shortcut Mode Logic
  useEffect(() => {
    if (!shortcutMode && searchParams.get("open") !== "take-attendance") return;

    const now = new Date();
    const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    setDailyModalDate(localDate);

    if (shortcutMode) return;

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("open");
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams, shortcutMode]);

  return {
    // UI State
    search,
    setSearch,
    viewDate,
    setViewDate,
    year,
    month,

    // Modal Visibility
    workweekModalOpen,
    openWorkweekModal: () => setWorkweekModalOpen(true),
    closeWorkweekModal: () => setWorkweekModalOpen(false),

    dailyModalDate,
    openDailyModal: (date: string) => setDailyModalDate(date),
    closeDailyModal: () => setDailyModalDate(null),

    dateDetailsDate,
    openDateDetails: (date: string) => setDateDetailsDate(date),
    closeDateDetails: () => setDateDetailsDate(null),

    adjModalRecord,
    openAdjustModal: (record: AttendanceRecord) => setAdjModalRecord(record),
    closeAdjustModal: () => setAdjModalRecord(null),

    // Permissions & Toast
    canEditAttendance,
    canConfigureWorkweek,
    toast,
    clearToast,
  };
}
