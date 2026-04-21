import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DailyAttendanceRecord, AttendanceForm } from "../types/Attendance";
import { badgeClass } from "../constants";
import { attendanceDailyQueryOptions } from "../utils/queryOptions";
import { saveDailyAttendanceMutationOptions } from "../utils/mutationOptions";
import { useToast } from "@/hooks/useToast";

interface DailyAttendanceModalProps {
  selectedDate: string;
  onClose: () => void;
  canEditAttendance: boolean;
}

export const DailyAttendanceModal: React.FC<DailyAttendanceModalProps> = ({
  selectedDate,
  onClose,
  canEditAttendance,
}) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // 1. Fetch Data
  const { data: dailyList = [], isLoading: dailyLoading } = useQuery(
    attendanceDailyQueryOptions(selectedDate, true),
  );

  // 2. Local State
  const [dailySearch, setDailySearch] = useState("");
  const [dailyStatusFilter, setDailyStatusFilter] = useState("All");
  const [attendanceForm, setAttendanceForm] = useState<AttendanceForm>({});
  const [secondaryStatusForm, setSecondaryStatusForm] = useState<AttendanceForm>({});
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState("Present");

  // Sync dailyList to Form
  useEffect(() => {
    const initialForm: AttendanceForm = {};
    const initialSecondary: AttendanceForm = {};
    dailyList.forEach((emp) => {
      initialForm[emp.emp_id] = emp.attendance_status || "";
      initialSecondary[emp.emp_id] = emp.status2 || "";
    });
    setAttendanceForm(initialForm);
    setSecondaryStatusForm(initialSecondary);
    setSelectedEmployees(new Set());
  }, [dailyList]);

  // 3. Derived State
  const filteredDaily = useMemo(() => {
    return dailyList.filter((a) => {
      const matchesSearch = `${a.first_name} ${a.last_name} ${a.emp_id}`
        .toLowerCase()
        .includes(dailySearch.toLowerCase());

      if (!matchesSearch) return false;
      if (dailyStatusFilter === "All") return true;

      const primary = attendanceForm[a.emp_id] || "None";
      const secondary = secondaryStatusForm[a.emp_id] || "None";

      if (dailyStatusFilter === "None") {
        return primary === "None" && secondary === "None";
      }

      return primary === dailyStatusFilter || secondary === dailyStatusFilter;
    });
  }, [dailyList, dailySearch, dailyStatusFilter, attendanceForm, secondaryStatusForm]);

  const dailyModalOverview = useMemo(() => {
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
      {
        total: filteredDaily.length,
        assigned: 0,
        unassigned: 0,
        present: 0,
        absent: 0,
        onLeave: 0,
        late: 0,
        undertime: 0,
        halfDay: 0,
      },
    );
  }, [filteredDaily, attendanceForm, secondaryStatusForm]);

  // 4. Mutations
  const saveMutation = useMutation({
    ...saveDailyAttendanceMutationOptions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      queryClient.invalidateQueries({ queryKey: ["attendance-calendar"] });
      showToast("Attendance saved successfully.");
      onClose();
    },
    onError: () => showToast("Failed to save attendance.", "error"),
  });

  // 5. Handlers
  const handleDailySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const records = Object.entries(attendanceForm)
      .filter(([_, status]) => status !== "" && status !== "Pending")
      .map(([emp_id, status]) => {
        const secondary = secondaryStatusForm[emp_id];
        return {
          emp_id,
          status: status,
          status2: secondary || null,
        };
      });
    saveMutation.mutate({ selectedDate, records });
  };

  const updateAttendanceForm = (id: string, value: string) => {
    setAttendanceForm((prev) => ({ ...prev, [id]: value }));
    if (value === "Absent") {
      setSecondaryStatusForm((prev) => ({ ...prev, [id]: "" }));
    }
  };

  const toggleEmployeeSelection = (id: string) => {
    setSelectedEmployees((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllSelected = () => {
    const allIds = filteredDaily.map((e) => e.emp_id);
    if (selectedEmployees.size === allIds.length) {
      setSelectedEmployees(new Set());
    } else {
      setSelectedEmployees(new Set(allIds));
    }
  };

  const applyBulkStatus = () => {
    if (!bulkStatus) return;
    setAttendanceForm((prev) => {
      const next = { ...prev };
      selectedEmployees.forEach((id) => {
        next[id] = bulkStatus;
      });
      return next;
    });
    setSelectedEmployees(new Set());
  };

  const markAllPresent = () => {
    setAttendanceForm((prev) => {
      const next = { ...prev };
      dailyList.forEach((emp) => {
        if (!next[emp.emp_id] || next[emp.emp_id] === "Pending") {
          next[emp.emp_id] = "Present";
        }
      });
      return next;
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-700 px-5 py-3 text-white">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="m-0 text-base font-bold">Attendance for {selectedDate}</h2>
              <p className="m-0 mt-0.5 text-[11px] text-white/80">
                Review, filter, and manage personnel attendance records.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold tracking-wide text-white/90">
                {canEditAttendance ? "Edit Mode" : "View Mode"}
              </div>
              <button
                onClick={onClose}
                className="cursor-pointer rounded-md border border-white/20 bg-white/5 px-2 py-0.5 text-lg text-white transition-colors hover:bg-white/10 hover:text-slate-200"
                aria-label="Close attendance modal"
              >
                &times;
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden bg-slate-50/60 p-3">
          {!canEditAttendance && (
            <div className="mb-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">
              View-only mode: Supervisors can view attendance records but cannot edit them.
            </div>
          )}

          <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1">
            <div className="shrink-0 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700">
              Total: {dailyModalOverview.total}
            </div>
            <div className="shrink-0 rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700">
              Assigned: {dailyModalOverview.assigned}
            </div>
            <div className="shrink-0 rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] font-semibold text-gray-700">
              Unassigned: {dailyModalOverview.unassigned}
            </div>
            <div className="shrink-0 rounded-md border border-green-200 bg-green-50 px-2 py-1 text-[11px] font-semibold text-green-700">
              Present: {dailyModalOverview.present}
            </div>
            <div className="shrink-0 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-700">
              Absent: {dailyModalOverview.absent}
            </div>
            <div className="shrink-0 rounded-md border border-purple-200 bg-purple-50 px-2 py-1 text-[11px] font-semibold text-purple-700">
              On Leave: {dailyModalOverview.onLeave}
            </div>
            <div className="shrink-0 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700">
              Late: {dailyModalOverview.late}
            </div>
            <div className="shrink-0 rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-semibold text-rose-700">
              Under/Half: {dailyModalOverview.undertime + dailyModalOverview.halfDay}
            </div>
          </div>

          <div className="mb-2 flex shrink-0 flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white p-2">
            <input
              type="text"
              placeholder="Search personnel..."
              value={dailySearch}
              onChange={(e) => setDailySearch(e.target.value)}
              className="w-56 rounded-lg border border-slate-300 px-3 py-1 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <select
              value={dailyStatusFilter}
              onChange={(e) => setDailyStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">All Status Types</option>
              <option value="None">Unassigned</option>
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="On Leave">On Leave</option>
              <option value="Late">Late</option>
              <option value="Undertime">Undertime</option>
              <option value="Half-Day">Half-Day</option>
            </select>
          </div>

          {canEditAttendance ? (
            <div className="mb-2 flex shrink-0 flex-wrap items-center justify-between gap-2 rounded-lg border border-indigo-100 bg-indigo-50 p-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-indigo-800">
                  Selected: {selectedEmployees.size}
                </span>
                <select
                  value={bulkStatus}
                  onChange={(e) => setBulkStatus(e.target.value)}
                  className="rounded border border-slate-300 px-2 py-1 text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Select --</option>
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                  <option value="On Leave">On Leave</option>
                </select>
                <button
                  onClick={applyBulkStatus}
                  disabled={selectedEmployees.size === 0}
                  className="cursor-pointer rounded bg-indigo-600 px-3 py-1 text-xs font-bold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
                >
                  Apply
                </button>
              </div>
              <button
                onClick={markAllPresent}
                className="cursor-pointer rounded border border-emerald-200 bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 transition-colors hover:bg-emerald-200"
              >
                ✓ Mark Unassigned as Present
              </button>
            </div>
          ) : (
            <div className="mb-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600">
              Bulk update tools are disabled in view-only mode.
            </div>
          )}

          <div className="flex-1 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-xs text-left">
              <thead className="sticky top-0 z-10 bg-slate-100 shadow-sm">
                <tr>
                  <th className="px-3 py-1.5 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={
                        selectedEmployees.size > 0 && selectedEmployees.size === filteredDaily.length
                      }
                      onChange={toggleAllSelected}
                      disabled={!canEditAttendance}
                      className="w-4 h-4 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </th>
                  <th className="px-3 py-1.5 font-semibold text-gray-700 uppercase text-[11px]">
                    Employee
                  </th>
                  <th className="px-3 py-1.5 font-semibold text-gray-700 uppercase text-[11px]">
                    Designation
                  </th>
                  <th className="px-3 py-1.5 font-semibold text-gray-700 uppercase text-[11px]">
                    Primary Status
                  </th>
                  <th className="px-3 py-1.5 font-semibold text-gray-700 uppercase text-[11px]">
                    Secondary (Opt.)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {dailyLoading ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center font-bold text-gray-500">
                      Loading List...
                    </td>
                  </tr>
                ) : (
                  filteredDaily.map((emp, index) => {
                    const isChecked = selectedEmployees.has(emp.emp_id);
                    return (
                      <tr
                        key={`${emp.emp_id}-${index}`}
                        className={`text-xs transition-colors hover:bg-slate-50 ${isChecked ? "bg-indigo-50/60" : ""}`}
                      >
                        <td className="px-3 py-1.5 text-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleEmployeeSelection(emp.emp_id)}
                            disabled={!canEditAttendance}
                            className="w-4 h-4 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                          />
                        </td>
                        <td className="px-3 py-1.5">
                          <p className="font-bold m-0 text-gray-900 text-xs">
                            {emp.first_name} {emp.last_name}
                          </p>
                          <p className="text-[10px] text-gray-500 m-0">{emp.emp_id}</p>
                        </td>
                        <td className="px-3 py-1.5 text-gray-600 text-xs">{emp.emp_status}</td>
                        <td className="px-3 py-1.5">
                          <select
                            value={attendanceForm[emp.emp_id] || ""}
                            onChange={(e) => {
                              if (!canEditAttendance) return;
                              updateAttendanceForm(emp.emp_id, e.target.value);
                            }}
                            disabled={!canEditAttendance}
                            className={`border p-1 rounded outline-none font-semibold max-w-[90px] text-xs disabled:cursor-not-allowed disabled:opacity-60 ${badgeClass[attendanceForm[emp.emp_id]] || badgeClass[""]}`}
                          >
                            <option value="">-- None --</option>
                            <option value="Present">Present</option>
                            <option value="Absent">Absent</option>
                            <option value="On Leave">On Leave</option>
                          </select>
                        </td>
                        <td className="px-3 py-1.5">
                          <select
                            value={secondaryStatusForm[emp.emp_id] || ""}
                            onChange={(e) =>
                              setSecondaryStatusForm(prev => ({ ...prev, [emp.emp_id]: e.target.value }))
                            }
                            disabled={
                              !canEditAttendance || attendanceForm[emp.emp_id] === "Absent"
                            }
                            className={`border p-1 rounded outline-none font-semibold max-w-[90px] text-xs disabled:cursor-not-allowed disabled:opacity-60 ${badgeClass[secondaryStatusForm[emp.emp_id]] || badgeClass[""]}`}
                          >
                            <option value="">-- None --</option>
                            <option value="Late">Late</option>
                            <option value="Undertime">Undertime</option>
                            <option value="Half-Day">Half-Day</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-2 flex shrink-0 justify-end gap-2 border-t border-slate-200 pt-2">
            <button
              onClick={onClose}
              className="cursor-pointer rounded-lg border border-slate-300 px-4 py-1.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100"
            >
              Close
            </button>
            <button
              onClick={handleDailySubmit}
              disabled={!canEditAttendance || saveMutation.isPending}
              className="cursor-pointer rounded-lg border-0 bg-indigo-700 px-4 py-1.5 text-sm font-bold text-white transition-colors hover:bg-indigo-800 disabled:opacity-50"
            >
              {!canEditAttendance ? "View Only" : saveMutation.isPending ? "Saving..." : "Save Attendance"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
