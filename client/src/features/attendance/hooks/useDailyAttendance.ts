import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDailyAttendance, saveBulkAttendance } from "../api";
import { AttendanceStatus } from "../types";

export const useDailyAttendance = (selectedDate: string | null, canEdit: boolean, showToast: any) => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [attendanceForm, setAttendanceForm] = useState<Record<string, AttendanceStatus>>({});
  const [secondaryStatusForm, setSecondaryStatusForm] = useState<Record<string, AttendanceStatus>>({});
  const [selectedEmployees, setSelectedEmployees] = useState(new Set<string>());
  const [bulkStatus, setBulkStatus] = useState("Present");

  const query = useQuery({
    queryKey: ["attendance-daily", selectedDate],
    queryFn: async () => {
      const data = await getDailyAttendance(selectedDate!);
      const initialForm: Record<string, AttendanceStatus> = {};
      const initialSecondary: Record<string, AttendanceStatus> = {};
      data.forEach((emp) => {
        initialForm[emp.emp_id] = emp.attendance_status || "";
        initialSecondary[emp.emp_id] = emp.status2 || "";
      });
      setAttendanceForm(initialForm);
      setSecondaryStatusForm(initialSecondary);
      return data;
    },
    enabled: !!selectedDate && isOpen,
  });

  const saveMutation = useMutation({
    mutationFn: (records: any[]) => saveBulkAttendance(selectedDate!, records),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      queryClient.invalidateQueries({ queryKey: ["attendance-calendar"] });
      showToast("Attendance saved successfully.");
      setIsOpen(false);
    },
    onError: () => showToast("Failed to save attendance.", "error"),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      showToast("View-only access: you cannot modify attendance.", "error");
      return;
    }
    const records = Object.entries(attendanceForm)
      .filter(([_, status]) => status !== "" && status !== "Pending")
      .map(([emp_id, status]) => ({
        emp_id,
        status,
        status2: secondaryStatusForm[emp_id] || null,
      }));
    saveMutation.mutate(records);
  };

  const markAllPresent = () => {
    if (!canEdit) return;
    const updated = { ...attendanceForm };
    (query.data || []).forEach((emp) => {
      if (!updated[emp.emp_id] || updated[emp.emp_id] === "Pending") {
        updated[emp.emp_id] = "Present";
      }
    });
    setAttendanceForm(updated);
  };

  const filteredDaily = (query.data || []).filter((a) => {
    const matchesSearch = `${a.first_name} ${a.last_name} ${a.emp_id}`.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (statusFilter === "All") return true;
    const primary = attendanceForm[a.emp_id] || "None";
    const secondary = secondaryStatusForm[a.emp_id] || "None";
    if (statusFilter === "None") return primary === "None" && secondary === "None";
    return primary === statusFilter || secondary === statusFilter;
  });

  const overview = useMemo(() => {
    return filteredDaily.reduce(
      (acc, emp) => {
        const primary = attendanceForm[emp.emp_id] || "";
        const secondary = secondaryStatusForm[emp.emp_id] || "";
        if (primary === "Present") acc.present += 1;
        if (primary === "Absent") acc.absent += 1;
        if (primary === "On Leave") acc.onLeave += 1;
        if (!primary && !secondary) acc.unassigned += 1;
        if (secondary === "Late") acc.late += 1;
        if (secondary === "Undertime") acc.undertime += 1;
        if (secondary === "Half-Day") acc.halfDay += 1;
        if (primary || secondary) acc.assigned += 1;
        return acc;
      },
      { total: filteredDaily.length, assigned: 0, unassigned: 0, present: 0, absent: 0, onLeave: 0, late: 0, undertime: 0, halfDay: 0 }
    );
  }, [filteredDaily, attendanceForm, secondaryStatusForm]);

  const toggleEmployeeSelection = (empId: string) => {
    if (!canEdit) return;
    const newSelected = new Set(selectedEmployees);
    if (newSelected.has(empId)) newSelected.delete(empId);
    else newSelected.add(empId);
    setSelectedEmployees(newSelected);
  };

  const toggleAllSelected = () => {
    if (!canEdit) return;
    if (selectedEmployees.size === filteredDaily.length) setSelectedEmployees(new Set());
    else setSelectedEmployees(new Set(filteredDaily.map((e) => e.emp_id)));
  };

  const applyBulkStatus = () => {
    if (!canEdit || selectedEmployees.size === 0) return;
    const updated = { ...attendanceForm };
    selectedEmployees.forEach((id) => { updated[id] = bulkStatus as AttendanceStatus; });
    setAttendanceForm(updated);
    setSelectedEmployees(new Set());
  };

  return {
    isOpen, setIsOpen,
    search, setSearch,
    statusFilter, setStatusFilter,
    attendanceForm, setAttendanceForm,
    secondaryStatusForm, setSecondaryStatusForm,
    selectedEmployees, setSelectedEmployees,
    bulkStatus, setBulkStatus,
    loading: query.isLoading,
    isSaving: saveMutation.isPending,
    filteredDaily,
    overview,
    onSubmit,
    markAllPresent,
    toggleEmployeeSelection,
    toggleAllSelected,
    applyBulkStatus
  };
};
