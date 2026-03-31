import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { apiFetch } from "../lib/api";
import Toast from "../components/Toast";
import { useToast } from "../hooks/useToast";
import axiosInterceptor from "../hooks/interceptor";

const badgeClass = {
  Present: "bg-green-100 text-green-800",
  Late: "bg-amber-100 text-amber-800",
  Undertime: "bg-rose-100 text-rose-800",
  "Half-Day": "bg-orange-100 text-orange-800",
  Absent: "bg-red-100 text-red-800",
  "On Leave": "bg-purple-100 text-purple-800",
  Pending: "bg-gray-100 text-gray-500",
  "": "bg-gray-100 text-gray-500", // Fallback styling for None
};

export default function Attendance({ shortcutMode = false }) {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast, showToast, clearToast } = useToast();
  const [search, setSearch] = useState("");
  const [workweekForm, setWorkweekForm] = useState({
    workweek_type: "5-day",
    effective_from: "",
    effective_to: "",
  });
  const [editingWorkweekId, setEditingWorkweekId] = useState(null);

  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("wah_user") || "null");
    } catch {
      return null;
    }
  }, []);
  const isAdmin = currentUser?.role === "Admin";
  const canConfigureWorkweek =
    currentUser?.role === "Admin" || currentUser?.role === "HR";

  // Modals State
  const [adjModal, setAdjModal] = useState(null);
  const [adjType, setAdjType] = useState("Subtract");
  const [adjDays, setAdjDays] = useState("");

  const [dailyModalOpen, setDailyModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [workweekModalOpen, setWorkweekModalOpen] = useState(false);

  // Calendar State
  const [viewDate, setViewDate] = useState(new Date());
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  // Daily Form & Bulk Action State
  const [dailySearch, setDailySearch] = useState("");
  const [attendanceForm, setAttendanceForm] = useState({});
  const [secondaryStatusForm, setSecondaryStatusForm] = useState({});
  const [selectedEmployees, setSelectedEmployees] = useState(new Set());
  const [bulkStatus, setBulkStatus] = useState("Present");

  useEffect(() => {
    if (!shortcutMode && searchParams.get("open") !== "take-attendance") return;

    const now = new Date();
    const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    setSelectedDate(localDate);
    setDailyModalOpen(true);

    if (shortcutMode) return;

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("open");
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams, shortcutMode]);

  // --- QUERIES ---
  const { data: attendance = [], isLoading } = useQuery({
    queryKey: ["attendance"],
    queryFn: async () => {
      const res = await apiFetch("/api/employees/attendance");
      if (!res.ok) throw new Error("Failed to fetch attendance");
      return res.json();
    },
  });

  const { data: calendarSummary = [] } = useQuery({
    queryKey: ["attendance-calendar", year, month],
    queryFn: async () => {
      const res = await apiFetch(
        `/api/employees/attendance-summary?year=${year}&month=${month + 1}`,
      );
      return res.json();
    },
  });

  const { data: workweekConfigs = [] } = useQuery({
    queryKey: ["workweek-config"],
    queryFn: async () => {
      const res = await apiFetch("/api/employees/workweek-config");
      if (!res.ok) throw new Error("Failed to fetch workweek config");
      return res.json();
    },
  });

  const { data: dailyList = [], isLoading: dailyLoading } = useQuery({
    queryKey: ["attendance-daily", selectedDate],
    queryFn: async () => {
      const res = await apiFetch(
        `/api/employees/attendance-daily?date=${selectedDate}`,
      );
      const data = await res.json();

      const initialForm = {};
      const initialSecondary = {};
      data.forEach((emp) => {
        initialForm[emp.emp_id] = emp.attendance_status || "";
        // FIX: Tell React to load status2 from the database
        initialSecondary[emp.emp_id] = emp.status2 || "";
      });
      setAttendanceForm(initialForm);
      setSecondaryStatusForm(initialSecondary);
      return data;
    },
    enabled: !!selectedDate && dailyModalOpen,
  });

  // --- MUTATIONS ---
  const adjustBalanceMutation = useMutation({
    mutationFn: async ({ empId, amount }) => {
      const res = await apiFetch(`/api/employees/leave-balance/${empId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ adjustment: amount }),
      });
      if (!res.ok) throw new Error("Failed to adjust leave balance");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      showToast("Leave balance updated.");
      setAdjModal(null);
      setAdjDays("");
    },
    onError: () => showToast("Failed to adjust leave balance.", "error"),
  });

  const saveDailyAttendanceMutation = useMutation({
    mutationFn: async (records) => {
      // CHANGED: Use axiosInterceptor instead of apiFetch to guarantee the token is sent
      const res = await axiosInterceptor.post(
        "/api/employees/attendance-bulk",
        {
          date: selectedDate,
          records,
        },
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["attendance"]);
      queryClient.invalidateQueries(["attendance-calendar"]);
      showToast("Attendance saved successfully.");
      setDailyModalOpen(false);
    },
    onError: () => showToast("Failed to save attendance.", "error"),
  });

  const saveWorkweekMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await apiFetch("/api/employees/workweek-config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to save workweek config");
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workweek-config"] });
      showToast("Workweek configuration saved.");
      setWorkweekForm((prev) => ({
        ...prev,
        effective_from: "",
        effective_to: "",
      }));
    },
    onError: (err) =>
      showToast(err.message || "Failed to save config.", "error"),
  });

  const updateWorkweekMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const res = await apiFetch(`/api/employees/workweek-config/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to update workweek config");
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workweek-config"] });
      showToast("Workweek configuration updated.");
      setEditingWorkweekId(null);
      setWorkweekForm({
        workweek_type: "5-day",
        effective_from: "",
        effective_to: "",
      });
    },
    onError: (err) =>
      showToast(err.message || "Failed to update config.", "error"),
  });

  const deleteWorkweekMutation = useMutation({
    mutationFn: async (id) => {
      const res = await apiFetch(`/api/employees/workweek-config/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to delete workweek config");
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workweek-config"] });
      showToast("Workweek configuration deleted.");
    },
    onError: (err) =>
      showToast(err.message || "Failed to delete config.", "error"),
  });

  // --- HANDLERS ---
  const handleDailySubmit = (e) => {
    e.preventDefault();
    const records = Object.entries(attendanceForm)
      .filter(([_, status]) => status !== "" && status !== "Pending")
      .map(([emp_id, status]) => {
        const secondary = secondaryStatusForm[emp_id];

        // FIX: Send them as two separate pieces of data!
        return {
          emp_id,
          status: status,
          status2: secondary || null,
        };
      });
    saveDailyAttendanceMutation.mutate(records);
  };

  const markAllPresent = () => {
    const updated = { ...attendanceForm };
    dailyList.forEach((emp) => {
      // CHANGED: Check for "" (none) as well as "Pending"
      if (!updated[emp.emp_id] || updated[emp.emp_id] === "Pending") {
        updated[emp.emp_id] = "Present";
      }
    });
    setAttendanceForm(updated);
  };

  const filteredDaily = dailyList.filter((a) =>
    `${a.first_name} ${a.last_name} ${a.emp_id}`
      .toLowerCase()
      .includes(dailySearch.toLowerCase()),
  );

  const toggleEmployeeSelection = (empId) => {
    const newSelected = new Set(selectedEmployees);
    if (newSelected.has(empId)) newSelected.delete(empId);
    else newSelected.add(empId);
    setSelectedEmployees(newSelected);
  };

  const toggleAllSelected = () => {
    if (selectedEmployees.size === filteredDaily.length) {
      setSelectedEmployees(new Set());
    } else {
      setSelectedEmployees(new Set(filteredDaily.map((e) => e.emp_id)));
    }
  };

  const applyBulkStatus = () => {
    if (selectedEmployees.size === 0) return;
    const updated = { ...attendanceForm };
    selectedEmployees.forEach((id) => {
      updated[id] = bulkStatus;
    });
    setAttendanceForm(updated);
    setSelectedEmployees(new Set());
  };

  const handleWorkweekSubmit = (e) => {
    e.preventDefault();
    if (!workweekForm.effective_from) {
      showToast("Effective from date is required.", "error");
      return;
    }

    const payload = {
      ...workweekForm,
      effective_to: workweekForm.effective_to || null,
    };

    if (editingWorkweekId) {
      updateWorkweekMutation.mutate({ id: editingWorkweekId, payload });
      return;
    }

    saveWorkweekMutation.mutate(payload);
  };

  const handleEditWorkweek = (cfg) => {
    setEditingWorkweekId(cfg.id);
    setWorkweekForm({
      workweek_type: cfg.workweek_type,
      effective_from: String(cfg.effective_from).slice(0, 10),
      effective_to: cfg.effective_to
        ? String(cfg.effective_to).slice(0, 10)
        : "",
    });
  };

  const handleCancelEditWorkweek = () => {
    setEditingWorkweekId(null);
    setWorkweekForm({
      workweek_type: "5-day",
      effective_from: "",
      effective_to: "",
    });
  };

  const handleDeleteWorkweek = (cfg) => {
    const confirmed = window.confirm(
      `Delete ${cfg.workweek_type} rule effective ${String(cfg.effective_from).slice(0, 10)}?`,
    );
    if (!confirmed) return;
    deleteWorkweekMutation.mutate(cfg.id);
  };

  // --- UI HELPERS ---
  const getLeaveHighlightColor = (remaining) => {
    if (remaining <= 0) return "bg-red-100 text-red-800";
    if (remaining <= 3) return "bg-orange-100 text-orange-800";
    return "bg-blue-100 text-blue-800";
  };

  const pad = (n) => (n < 10 ? "0" + n : "" + n);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const cells = Array(firstDay)
    .fill(null)
    .concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));

  const today = new Date();

  const filteredMain = attendance.filter((a) =>
    `${a.first_name} ${a.last_name} ${a.emp_id}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  if (isLoading)
    return <div className="p-6 font-bold">Loading Attendance...</div>;

  return (
    <div className="max-w-full">
      {!shortcutMode && (
        <>
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            <h1 className="m-0 text-lg font-bold text-gray-900">
              Attendance Management
            </h1>
            {canConfigureWorkweek && (
              <button
                onClick={() => setWorkweekModalOpen(true)}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold text-sm cursor-pointer hover:bg-indigo-700 border-0 transition-colors"
              >
                ⚙️ Workweek Setup
              </button>
            )}
          </div>

          {/* --- INLINE CALENDAR VIEW --- */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
            <div className="bg-purple-700 px-4 py-2 text-white">
              <h2 className="text-base font-bold m-0">
                Select Date to Take Attendance
              </h2>
            </div>
            <div className="p-3 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => setViewDate(new Date(year, month - 1, 1))}
                  className="px-3 py-1 border rounded bg-white font-medium text-sm cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  ◀ Prev
                </button>
                <h3 className="m-0 text-base font-bold">
                  {viewDate.toLocaleString("default", {
                    month: "long",
                    year: "numeric",
                  })}
                </h3>
                <button
                  onClick={() => setViewDate(new Date(year, month + 1, 1))}
                  className="px-3 py-1 border rounded bg-white font-medium text-sm cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  Next ▶
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div
                    key={d}
                    className="text-center text-xs font-bold text-gray-500 py-1"
                  >
                    {d}
                  </div>
                ))}
                {cells.map((day, i) => {
                  if (!day) return <div key={`empty-${i}`} />;
                  const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`;
                  const isToday =
                    today.getFullYear() === year &&
                    today.getMonth() === month &&
                    today.getDate() === day;

                  const dayData = calendarSummary.find((s) => {
                    const dbDate = new Date(s.date);
                    return (
                      dbDate.getFullYear() === year &&
                      dbDate.getMonth() === month &&
                      dbDate.getDate() === day
                    );
                  });

                  return (
                    <button
                      key={i}
                      onClick={() => {
                        setSelectedDate(dateStr);
                        setDailyModalOpen(true);
                        setSelectedEmployees(new Set());
                      }}
                      className={`min-h-[60px] border rounded p-1 flex flex-col items-start bg-white cursor-pointer hover:border-purple-500 hover:shadow-md transition-all ${isToday ? "border-purple-600 bg-purple-50" : "border-gray-200"}`}
                    >
                      <span
                        className={`font-bold text-xs ${isToday ? "text-purple-700" : "text-gray-700"}`}
                      >
                        {day}
                      </span>
                      {dayData && (
                        <div className="mt-auto w-full space-y-0.5 flex flex-col gap-0.5">
                          {/* NEW STATUSES ADDED HERE */}
                          {dayData.present_count > 0 && (
                            <div className="text-[0.6rem] font-bold text-green-700 bg-green-50 rounded px-1 w-full text-left truncate border border-green-100">
                              • {dayData.present_count} Present
                            </div>
                          )}
                          {dayData.late_count > 0 && (
                            <div className="text-[0.6rem] font-bold text-amber-700 bg-amber-50 rounded px-1 w-full text-left truncate border border-amber-100">
                              • {dayData.late_count} Late
                            </div>
                          )}
                          {dayData.undertime_count > 0 && (
                            <div className="text-[0.6rem] font-bold text-rose-700 bg-rose-50 rounded px-1 w-full text-left truncate border border-rose-100">
                              • {dayData.undertime_count} Undertime
                            </div>
                          )}
                          {dayData.halfday_count > 0 && (
                            <div className="text-[0.6rem] font-bold text-orange-700 bg-orange-50 rounded px-1 w-full text-left truncate border border-orange-100">
                              • {dayData.halfday_count} Half-Day
                            </div>
                          )}
                          {dayData.leave_count > 0 && (
                            <div className="text-[0.6rem] font-bold text-purple-700 bg-purple-50 rounded px-1 w-full text-left truncate border border-purple-100">
                              • {dayData.leave_count} On Leave
                            </div>
                          )}
                          {dayData.absent_count > 0 && (
                            <div className="text-[0.6rem] font-bold text-red-700 bg-red-50 rounded px-1 w-full text-left truncate border border-red-100">
                              • {dayData.absent_count} Absent
                            </div>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* --- ALL EMPLOYEES SUMMARY TABLE --- */}
          <h2 className="m-0 text-base font-bold text-gray-900 mb-2">
            Overall Attendance Overview
          </h2>
          <div className="mb-2">
            <input
              type="text"
              className="w-full max-w-[280px] px-3 py-1.5 rounded-lg border border-gray-300 text-xs outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Search by name or ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden mb-4">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-3 py-2 text-left font-semibold text-gray-700 uppercase text-[11px]">
                      Employee ID
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700 uppercase text-[11px]">
                      Name
                    </th>
                    <th className="px-3 py-2 text-center font-semibold text-gray-700 uppercase text-[11px]">
                      Absences
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700 uppercase text-[11px]">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredMain.map((a, index) => (
                    <tr
                      key={`${a.emp_id}-${index}`}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-3 py-2 text-xs">{a.emp_id}</td>
                      <td className="px-3 py-2 font-semibold text-xs">
                        {a.first_name} {a.last_name}
                      </td>
                      <td className="px-3 py-2 text-center text-xs">
                        {a.total_absences || 0}
                      </td>

                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex items-center border border-transparent rounded-full px-2 py-0.5 text-[10px] font-medium ${badgeClass[a.status] || "bg-gray-100 text-gray-800"}`}
                        >
                          {a.status || "No Data"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* --- MODAL: DAILY ATTENDANCE FORM --- */}
      {dailyModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setDailyModalOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-purple-700 px-4 py-3 flex justify-between items-center text-white shrink-0">
              <h2 className="text-base font-bold m-0">
                Attendance for {selectedDate}
              </h2>
              <button
                onClick={() => setDailyModalOpen(false)}
                className="text-white hover:text-gray-200 text-xl border-0 bg-transparent cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-4 flex-1 overflow-hidden flex flex-col">
              <div className="flex justify-between items-center mb-2 shrink-0">
                <input
                  type="text"
                  placeholder="Search personnel..."
                  value={dailySearch}
                  onChange={(e) => setDailySearch(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 w-56 text-sm"
                />
              </div>

              <div className="bg-purple-50 border border-purple-100 rounded-lg p-2 flex flex-wrap items-center justify-between mb-2 shrink-0 gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-purple-800">
                    Selected: {selectedEmployees.size}
                  </span>
                  <select
                    value={bulkStatus}
                    onChange={(e) => setBulkStatus(e.target.value)}
                    className="px-2 py-1 rounded border border-gray-300 text-xs font-medium outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">-- Select --</option>
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                    <option value="On Leave">On Leave</option>
                  </select>
                  <button
                    onClick={applyBulkStatus}
                    disabled={selectedEmployees.size === 0}
                    className="px-3 py-1 bg-purple-600 text-white rounded text-xs font-bold hover:bg-purple-700 disabled:opacity-50 cursor-pointer border-0 transition-opacity"
                  >
                    Apply
                  </button>
                </div>
                <button
                  onClick={markAllPresent}
                  className="px-3 py-1 bg-green-100 text-green-800 font-bold text-xs rounded border border-green-200 hover:bg-green-200 cursor-pointer transition-colors"
                >
                  ✓ Mark Unassigned as Present
                </button>
              </div>

              <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="px-3 py-2 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={
                            selectedEmployees.size > 0 &&
                            selectedEmployees.size === filteredDaily.length
                          }
                          onChange={toggleAllSelected}
                          className="w-4 h-4 cursor-pointer"
                        />
                      </th>
                      <th className="px-3 py-2 font-semibold text-gray-700 uppercase text-[11px]">
                        Employee
                      </th>
                      <th className="px-3 py-2 font-semibold text-gray-700 uppercase text-[11px]">
                        Designation
                      </th>
                      <th className="px-3 py-2 font-semibold text-gray-700 uppercase text-[11px]">
                        Primary Status
                      </th>
                      <th className="px-3 py-2 font-semibold text-gray-700 uppercase text-[11px]">
                        Secondary (Opt.)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {dailyLoading ? (
                      <tr>
                        <td
                          colSpan="5"
                          className="p-4 text-center font-bold text-gray-500"
                        >
                          Loading List...
                        </td>
                      </tr>
                    ) : (
                      filteredDaily.map((emp, index) => {
                        const isChecked = selectedEmployees.has(emp.emp_id);
                        return (
                          <tr
                            key={`${emp.emp_id}-${index}`}
                            className={`hover:bg-gray-50 transition-colors text-xs ${isChecked ? "bg-purple-50" : ""}`}
                          >
                            <td className="px-3 py-2 text-center">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() =>
                                  toggleEmployeeSelection(emp.emp_id)
                                }
                                className="w-4 h-4 cursor-pointer"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <p className="font-bold m-0 text-gray-900 text-xs">
                                {emp.first_name} {emp.last_name}
                              </p>
                              <p className="text-[10px] text-gray-500 m-0">
                                {emp.emp_id}
                              </p>
                            </td>
                            <td className="px-3 py-2 text-gray-600 text-xs">
                              {emp.emp_status}
                            </td>
                            <td className="px-3 py-2">
                              <select
                                // CHANGED: Default is now ""
                                value={attendanceForm[emp.emp_id] || ""}
                                onChange={(e) =>
                                  setAttendanceForm({
                                    ...attendanceForm,
                                    [emp.emp_id]: e.target.value,
                                  })
                                }
                                // CHANGED: Pull fallback style correctly from badgeClass
                                className={`border p-1 rounded outline-none font-semibold max-w-[90px] text-xs ${badgeClass[attendanceForm[emp.emp_id]] || badgeClass[""]}`}
                              >
                                <option value="">-- None --</option>
                                <option value="Present">Present</option>
                                <option value="Absent">Absent</option>
                                <option value="On Leave">On Leave</option>
                              </select>
                            </td>
                            <td className="px-3 py-2">
                              <select
                                value={secondaryStatusForm[emp.emp_id] || ""}
                                onChange={(e) =>
                                  setSecondaryStatusForm({
                                    ...secondaryStatusForm,
                                    [emp.emp_id]: e.target.value,
                                  })
                                }
                                className={`border p-1 rounded outline-none font-semibold max-w-[90px] text-xs ${badgeClass[secondaryStatusForm[emp.emp_id]] || badgeClass[""]}`}
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

              <div className="mt-3 pt-3 border-t flex justify-end gap-2 shrink-0">
                <button
                  onClick={() => setDailyModalOpen(false)}
                  className="px-4 py-1.5 border rounded-lg font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer text-sm"
                >
                  Back
                </button>
                <button
                  onClick={handleDailySubmit}
                  disabled={saveDailyAttendanceMutation.isPending}
                  className="px-4 py-1.5 bg-purple-700 text-white rounded-lg font-bold hover:bg-purple-800 cursor-pointer border-0 disabled:opacity-50 text-sm"
                >
                  {saveDailyAttendanceMutation.isPending
                    ? "Saving..."
                    : "Save Attendance"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Adjustment Modal */}
      {adjModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-purple-800 px-6 py-4 flex justify-between items-center text-white">
              <h2 className="text-lg font-bold m-0">Adjust Leave Balance</h2>
              <button
                onClick={() => {
                  setAdjModal(null);
                  setAdjDays("");
                }}
                className="text-white text-2xl border-0 bg-transparent cursor-pointer"
              >
                &times;
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                adjustBalanceMutation.mutate({
                  empId: adjModal.emp_id,
                  amount:
                    adjType === "Subtract"
                      ? -Math.abs(adjDays)
                      : Math.abs(adjDays),
                });
              }}
              className="p-6"
            >
              <div className="flex flex-col gap-4">
                <select
                  value={adjType}
                  onChange={(e) => setAdjType(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Subtract">Subtract Days (Minus)</option>
                  <option value="Add">Add Days (Plus)</option>
                </select>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  required
                  value={adjDays}
                  onChange={(e) => setAdjDays(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Number of days"
                />
                <button
                  type="submit"
                  disabled={adjustBalanceMutation.isPending}
                  className="w-full py-2 bg-purple-700 text-white rounded-lg font-bold border-0 cursor-pointer hover:bg-purple-800"
                >
                  {adjustBalanceMutation.isPending
                    ? "Saving..."
                    : "Save Adjustment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- WORKWEEK CONFIGURATION MODAL --- */}
      {workweekModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden">
            <div className="bg-indigo-600 px-4 py-3 flex justify-between items-center text-white">
              <h2 className="text-base font-bold m-0">
                Workweek Configuration
              </h2>
              <button
                onClick={() => setWorkweekModalOpen(false)}
                className="text-white text-xl bg-transparent border-0 cursor-pointer hover:text-gray-200"
              >
                &times;
              </button>
            </div>

            <div className="p-4 max-h-[75vh] overflow-y-auto space-y-4">
              <div>
                <form
                  className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end mb-4"
                  onSubmit={handleWorkweekSubmit}
                >
                  <label className="flex flex-col gap-1 text-xs font-semibold text-gray-700 uppercase">
                    Workweek Type
                    <select
                      value={workweekForm.workweek_type}
                      onChange={(e) =>
                        setWorkweekForm((prev) => ({
                          ...prev,
                          workweek_type: e.target.value,
                        }))
                      }
                      className="px-2 py-1.5 rounded-lg border border-gray-300 text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="5-day">5-day (8h, 1.00)</option>
                      <option value="4-day">4-day (10h, 1.25)</option>
                    </select>
                  </label>

                  <label className="flex flex-col gap-1 text-xs font-semibold text-gray-700 uppercase">
                    From
                    <input
                      required
                      type="date"
                      value={workweekForm.effective_from}
                      onChange={(e) =>
                        setWorkweekForm((prev) => ({
                          ...prev,
                          effective_from: e.target.value,
                        }))
                      }
                      className="px-2 py-1.5 rounded-lg border border-gray-300 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </label>

                  <label className="flex flex-col gap-1 text-xs font-semibold text-gray-700 uppercase">
                    To (Opt.)
                    <input
                      type="date"
                      value={workweekForm.effective_to}
                      onChange={(e) =>
                        setWorkweekForm((prev) => ({
                          ...prev,
                          effective_to: e.target.value,
                        }))
                      }
                      className="px-2 py-1.5 rounded-lg border border-gray-300 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={
                      saveWorkweekMutation.isPending ||
                      updateWorkweekMutation.isPending
                    }
                    className="h-9 px-3 rounded-lg border-0 bg-indigo-600 text-white text-xs font-bold cursor-pointer hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {saveWorkweekMutation.isPending ||
                    updateWorkweekMutation.isPending
                      ? "Saving..."
                      : editingWorkweekId
                        ? "Update"
                        : "Save"}
                  </button>
                </form>

                {editingWorkweekId && (
                  <div className="mb-3">
                    <button
                      type="button"
                      onClick={handleCancelEditWorkweek}
                      className="px-3 py-1 text-xs font-semibold rounded-md border border-indigo-300 text-indigo-800 bg-white hover:bg-indigo-50"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <div className="overflow-x-auto rounded-lg border border-gray-200 bg-gray-50">
                <table className="w-full text-xs">
                  <thead className="bg-gray-100 border-b border-gray-200">
                    <tr>
                      <th className="px-3 py-2 text-left font-bold text-gray-700 uppercase text-[10px]">
                        Type
                      </th>
                      <th className="px-3 py-2 text-left font-bold text-gray-700 uppercase text-[10px]">
                        From
                      </th>
                      <th className="px-3 py-2 text-left font-bold text-gray-700 uppercase text-[10px]">
                        To
                      </th>
                      <th className="px-3 py-2 text-left font-bold text-gray-700 uppercase text-[10px]">
                        Hrs/Day
                      </th>
                      <th className="px-3 py-2 text-left font-bold text-gray-700 uppercase text-[10px]">
                        Unit
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {workweekConfigs.length === 0 ? (
                      <tr>
                        <td
                          className="px-3 py-2 text-gray-500 text-xs"
                          colSpan={6}
                        >
                          No rules configured.
                        </td>
                      </tr>
                    ) : (
                      workweekConfigs.map((cfg) => (
                        <tr
                          key={cfg.id}
                          className="border-b border-gray-200 hover:bg-gray-100"
                        >
                          <td className="px-3 py-2 font-semibold text-gray-800 text-xs">
                            {cfg.workweek_type}
                          </td>
                          <td className="px-3 py-2 text-gray-700 text-xs">
                            {String(cfg.effective_from).slice(0, 10)}
                          </td>
                          <td className="px-3 py-2 text-gray-700 text-xs">
                            {cfg.effective_to
                              ? String(cfg.effective_to).slice(0, 10)
                              : "Open"}
                          </td>
                          <td className="px-3 py-2 text-gray-700 text-xs">
                            {Number(cfg.hours_per_day).toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-gray-700 text-xs">
                            {Number(cfg.absence_unit).toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <div className="inline-flex gap-1">
                              <button
                                type="button"
                                onClick={() => handleEditWorkweek(cfg)}
                                className="px-2 py-0.5 text-[10px] font-bold rounded border border-indigo-200 bg-indigo-100 text-indigo-800 hover:bg-indigo-200 cursor-pointer"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteWorkweek(cfg)}
                                disabled={deleteWorkweekMutation.isPending}
                                className="px-2 py-0.5 text-[10px] font-bold rounded border border-red-200 bg-red-100 text-red-800 hover:bg-red-200 disabled:opacity-60 cursor-pointer"
                              >
                                Del
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setWorkweekModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 font-semibold text-sm cursor-pointer hover:bg-gray-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast toast={toast} onClose={clearToast} />
    </div>
  );
}
