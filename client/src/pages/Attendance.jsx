import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import Toast from "../components/Toast";
import { useToast } from "../hooks/useToast";

const badgeClass = {
  Present: "bg-green-100 text-green-800",
  Late: "bg-amber-100 text-amber-800",
  Undertime: "bg-rose-100 text-rose-800",
  "Half-Day": "bg-orange-100 text-orange-800",
  Absent: "bg-red-100 text-red-800",
  "On Leave": "bg-purple-100 text-purple-800",
  Pending: "bg-gray-100 text-gray-500",
};

export default function Attendance() {
  const queryClient = useQueryClient();
  const { toast, showToast, clearToast } = useToast();
  const [search, setSearch] = useState("");

  // Modals State
  const [adjModal, setAdjModal] = useState(null);
  const [adjType, setAdjType] = useState("Subtract");
  const [adjDays, setAdjDays] = useState("");

  const [dailyModalOpen, setDailyModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  // Calendar State
  const [viewDate, setViewDate] = useState(new Date());
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  // Daily Form & Bulk Action State
  const [dailySearch, setDailySearch] = useState("");
  const [attendanceForm, setAttendanceForm] = useState({});
  const [selectedEmployees, setSelectedEmployees] = useState(new Set());
  const [bulkStatus, setBulkStatus] = useState("Present");

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

  const { data: dailyList = [], isLoading: dailyLoading } = useQuery({
    queryKey: ["attendance-daily", selectedDate],
    queryFn: async () => {
      const res = await apiFetch(
        `/api/employees/attendance-daily?date=${selectedDate}`,
      );
      const data = await res.json();

      const initialForm = {};
      data.forEach((emp) => {
        initialForm[emp.emp_id] = emp.attendance_status || "Pending";
      });
      setAttendanceForm(initialForm);
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
      const res = await apiFetch("/api/employees/attendance-bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ date: selectedDate, records }),
      });
      if (!res.ok) throw new Error("Failed to save attendance");
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["attendance"]);
      queryClient.invalidateQueries(["attendance-calendar"]);
      showToast("Attendance saved successfully.");
      setDailyModalOpen(false);
    },
    onError: () => showToast("Failed to save attendance.", "error"),
  });

  // --- HANDLERS ---
  const handleDailySubmit = (e) => {
    e.preventDefault();
    const records = Object.entries(attendanceForm)
      .filter(([_, status]) => status !== "Pending")
      .map(([emp_id, status]) => ({ emp_id, status }));
    saveDailyAttendanceMutation.mutate(records);
  };

  const markAllPresent = () => {
    const updated = { ...attendanceForm };
    dailyList.forEach((emp) => {
      if (updated[emp.emp_id] === "Pending") {
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
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <h1 className="m-0 text-[1.4rem] font-bold text-gray-900">
          Attendance Management
        </h1>
      </div>

      {/* --- INLINE CALENDAR VIEW --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="bg-purple-700 px-6 py-4 text-white">
          <h2 className="text-lg font-bold m-0">
            Select Date to Take Attendance
          </h2>
        </div>
        <div className="p-6 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setViewDate(new Date(year, month - 1, 1))}
              className="px-4 py-2 border rounded bg-white font-medium cursor-pointer hover:bg-gray-100 transition-colors"
            >
              ◀ Prev
            </button>
            <h3 className="m-0 text-xl font-bold">
              {viewDate.toLocaleString("default", {
                month: "long",
                year: "numeric",
              })}
            </h3>
            <button
              onClick={() => setViewDate(new Date(year, month + 1, 1))}
              className="px-4 py-2 border rounded bg-white font-medium cursor-pointer hover:bg-gray-100 transition-colors"
            >
              Next ▶
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div
                key={d}
                className="text-center text-sm font-bold text-gray-500 py-2"
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
                  className={`min-h-[80px] border rounded-lg p-2 flex flex-col items-start bg-white cursor-pointer hover:border-purple-500 hover:shadow-md transition-all ${isToday ? "border-purple-600 bg-purple-50" : "border-gray-200"}`}
                >
                  <span
                    className={`font-bold text-sm ${isToday ? "text-purple-700" : "text-gray-700"}`}
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
      <h2 className="m-0 text-lg font-bold text-gray-900 mb-4">
        Overall Attendance Overview
      </h2>
      <div className="mb-4">
        <input
          type="text"
          className="w-full max-w-[300px] px-4 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="Search by name or ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-left font-semibold text-gray-700 uppercase">
                  Employee ID
                </th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700 uppercase">
                  Name
                </th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700 uppercase">
                  Total Absences
                </th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700 uppercase">
                  Leave Balance
                </th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700 uppercase">
                  Today's Status
                </th>
                <th className="px-6 py-3 text-right font-semibold text-gray-700 uppercase">
                  Admin Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredMain.map((a, index) => (
                <tr key={`${a.emp_id}-${index}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4">{a.emp_id}</td>
                  <td className="px-6 py-4 font-semibold">
                    {a.first_name} {a.last_name}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {a.total_absences || 0}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${getLeaveHighlightColor(a.leave_balance)}`}
                    >
                      {Number(a.leave_balance)} /{" "}
                      {a.emp_status === "Job Order" || a.emp_status === "Casual"
                        ? 12
                        : 27}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center border border-transparent rounded-full px-3 py-1 text-xs font-medium ${badgeClass[a.status] || "bg-gray-100 text-gray-800"}`}
                    >
                      {a.status || "No Data"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setAdjModal(a)}
                      className="px-3 py-1.5 rounded-md bg-purple-100 text-purple-700 text-xs font-bold border-0 cursor-pointer"
                    >
                      Adjust Balance
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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
            <div className="bg-purple-700 px-6 py-4 flex justify-between items-center text-white shrink-0">
              <h2 className="text-lg font-bold m-0">
                Attendance for {selectedDate}
              </h2>
              <button
                onClick={() => setDailyModalOpen(false)}
                className="text-white hover:text-gray-200 text-2xl border-0 bg-transparent cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-6 flex-1 overflow-hidden flex flex-col">
              <div className="flex justify-between items-center mb-4 shrink-0">
                <input
                  type="text"
                  placeholder="Search personnel..."
                  value={dailySearch}
                  onChange={(e) => setDailySearch(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 w-64"
                />
              </div>

              <div className="bg-purple-50 border border-purple-100 rounded-lg p-3 flex flex-wrap items-center justify-between mb-4 shrink-0 gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-purple-800">
                    Selected: {selectedEmployees.size}
                  </span>
                  <select
                    value={bulkStatus}
                    onChange={(e) => setBulkStatus(e.target.value)}
                    className="px-3 py-1.5 rounded border border-gray-300 text-sm font-medium outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="Present">Present</option>
                    <option value="Late">Late</option>
                    <option value="Undertime">Undertime</option>
                    <option value="Absent">Absent</option>
                    <option value="Half-Day">Half-Day</option>
                    <option value="On Leave">On Leave</option>
                  </select>
                  <button
                    onClick={applyBulkStatus}
                    disabled={selectedEmployees.size === 0}
                    className="px-4 py-1.5 bg-purple-600 text-white rounded text-sm font-bold hover:bg-purple-700 disabled:opacity-50 cursor-pointer border-0 transition-opacity"
                  >
                    Apply to Selected
                  </button>
                </div>
                <button
                  onClick={markAllPresent}
                  className="px-4 py-1.5 bg-green-100 text-green-800 font-bold text-sm rounded border border-green-200 hover:bg-green-200 cursor-pointer transition-colors"
                >
                  ✓ Mark Unassigned as Present
                </button>
              </div>

              <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="px-4 py-3 w-12 text-center">
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
                      <th className="px-6 py-3 font-semibold text-gray-700 uppercase">
                        Employee
                      </th>
                      <th className="px-6 py-3 font-semibold text-gray-700 uppercase">
                        Designation
                      </th>
                      <th className="px-6 py-3 font-semibold text-gray-700 uppercase">
                        Status Mark
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {dailyLoading ? (
                      <tr>
                        <td
                          colSpan="4"
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
                            className={`hover:bg-gray-50 transition-colors ${isChecked ? "bg-purple-50" : ""}`}
                          >
                            <td className="px-4 py-3 text-center">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() =>
                                  toggleEmployeeSelection(emp.emp_id)
                                }
                                className="w-4 h-4 cursor-pointer"
                              />
                            </td>
                            <td className="px-6 py-3">
                              <p className="font-bold m-0 text-gray-900">
                                {emp.first_name} {emp.last_name}
                              </p>
                              <p className="text-xs text-gray-500 m-0">
                                {emp.emp_id}
                              </p>
                            </td>
                            <td className="px-6 py-3 text-gray-600">
                              {emp.emp_status}
                            </td>
                            <td className="px-6 py-3">
                              <select
                                value={attendanceForm[emp.emp_id] || "Pending"}
                                onChange={(e) =>
                                  setAttendanceForm({
                                    ...attendanceForm,
                                    [emp.emp_id]: e.target.value,
                                  })
                                }
                                className={`border p-1.5 rounded outline-none font-semibold ${badgeClass[attendanceForm[emp.emp_id]] || badgeClass.Pending}`}
                              >
                                <option value="Pending">-- Select --</option>
                                <option value="Present">Present</option>
                                <option value="Late">Late</option>
                                <option value="Undertime">Undertime</option>
                                <option value="Absent">Absent</option>
                                <option value="Half-Day">Half-Day</option>
                                <option value="On Leave">On Leave</option>
                              </select>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 pt-4 border-t flex justify-end gap-3 shrink-0">
                <button
                  onClick={() => setDailyModalOpen(false)}
                  className="px-5 py-2 border rounded-lg font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Back to Calendar
                </button>
                <button
                  onClick={handleDailySubmit}
                  disabled={saveDailyAttendanceMutation.isPending}
                  className="px-6 py-2 bg-purple-700 text-white rounded-lg font-bold hover:bg-purple-800 cursor-pointer border-0 disabled:opacity-50"
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

      <Toast toast={toast} onClose={clearToast} />
    </div>
  );
}
