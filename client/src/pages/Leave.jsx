import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import Toast from "../components/Toast";
import { useToast } from "../hooks/useToast";

const leaveTypes = [
  "Birthday Leave",
  "Vacation Leave",
  "Sick Leave",
  "PGT Leave",
];

function isInRange(date, from, to) {
  const d = new Date(date).setHours(0, 0, 0, 0);
  const f = new Date(from).setHours(0, 0, 0, 0);
  const t = new Date(to).setHours(0, 0, 0, 0);
  return d >= f && d <= t;
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function calculateBusinessDays(startDate, endDate) {
  let count = 0;
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
}

const leavePolicy = {
  "Birthday Leave": { maxDays: 1, excludeWeekends: true },
  "Vacation Leave": { maxDays: 20, excludeWeekends: true },
  "Sick Leave": { maxDays: 10, excludeWeekends: true },
  "PGT Leave": { maxDays: 20, excludeWeekends: true },
  "Job Order MAC Leave": { maxDays: 12, excludeWeekends: true },
};

const badgeClass = {
  Approved: "bg-green-100 text-green-800",
  Denied: "bg-red-100 text-red-800",
  Pending: "bg-yellow-100 text-yellow-800",
};

// --- CALENDAR COMPONENT (Updated for Single Employee View) ---
function LeaveCalendar({ leaves, attendance }) {
  const [viewDate, setViewDate] = useState(new Date());
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = new Date(year, month, 1).getDay();
  const monthName = viewDate.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const [selectedDate, setSelectedDate] = useState(null);

  const statusColors = {
    Approved: {
      bg: "bg-green-50",
      border: "border-l-4 border-l-green-500",
      text: "text-green-700",
    },
    Pending: {
      bg: "bg-yellow-50",
      border: "border-l-4 border-l-yellow-500",
      text: "text-yellow-700",
    },
    Denied: {
      bg: "bg-red-50",
      border: "border-l-4 border-l-red-500",
      text: "text-red-700",
    },
  };

  const attendanceColors = {
    Present: "text-green-600 bg-green-50",
    Absent: "text-red-600 bg-red-50",
    Late: "text-orange-600 bg-orange-50",
    Undertime: "text-orange-600 bg-orange-50",
    "Half-Day": "text-purple-600 bg-purple-50",
  };

  function getLeavesForDate(dateStr) {
    return leaves.filter((l) => isInRange(dateStr, l.date_from, l.date_to));
  }

  function getAttendanceForDate(dateStr) {
    return attendance.find((a) => {
      const d = new Date(a.date);
      const formattedDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      return formattedDate === dateStr;
    });
  }

  function pad(n) {
    return n < 10 ? "0" + n : "" + n;
  }

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const selectedDateStr = selectedDate
    ? `${year}-${pad(month + 1)}-${pad(selectedDate)}`
    : null;
  const selectedLeaves = selectedDateStr
    ? getLeavesForDate(selectedDateStr)
    : [];

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 mb-6">
      <div className="mb-6 pb-6 border-b border-gray-200 flex justify-between items-center flex-wrap gap-4">
        <div>
          <h4 className="m-0 text-sm font-semibold text-gray-900 mb-3">
            Leave Status Legend
          </h4>
          <div className="flex gap-6">
            {Object.entries(statusColors).map(([status, colors]) => (
              <div key={status} className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${colors.border.split("border-l-")[1]}`}
                ></div>
                <span className="text-xs font-medium text-gray-700">
                  {status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-5">
        <button
          className="px-4 py-2 bg-transparent border border-gray-300 rounded-lg text-sm font-semibold cursor-pointer text-gray-700 hover:bg-gray-50"
          onClick={prevMonth}
        >
          ◀ Previous
        </button>
        <h3 className="m-0 text-xl font-bold text-gray-900">{monthName}</h3>
        <button
          className="px-4 py-2 bg-transparent border border-gray-300 rounded-lg text-sm font-semibold cursor-pointer text-gray-700 hover:bg-gray-50"
          onClick={nextMonth}
        >
          Next ▶
        </button>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div
            key={d}
            className="text-center text-xs font-bold uppercase tracking-wider text-gray-500 py-2 bg-gray-50 rounded-md"
          >
            {d}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day === null)
            return <div key={"e" + i} className="aspect-square" />;

          const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`;
          const dayLeaves = getLeavesForDate(dateStr);
          const dayAtt = getAttendanceForDate(dateStr);
          const isSelected = day === selectedDate;

          const firstLeaveStatus =
            dayLeaves.length > 0 ? dayLeaves[0].status : null;
          const colorConfig = firstLeaveStatus
            ? statusColors[firstLeaveStatus]
            : null;

          return (
            <button
              key={i}
              type="button"
              className={`min-h-24 flex flex-col items-start justify-start rounded-lg cursor-pointer relative p-2 transition-all duration-150 ${
                dayLeaves.length > 0 && !isSelected
                  ? colorConfig?.border + " " + colorConfig?.bg
                  : "border border-gray-200"
              } ${isSelected ? "bg-purple-600 text-white border-purple-600 shadow-md transform scale-105 z-10" : "hover:border-purple-300 hover:bg-purple-50/30"}`}
              onClick={() => setSelectedDate(day === selectedDate ? null : day)}
            >
              <span
                className={`font-bold text-sm mb-1 ${isSelected ? "text-white" : "text-gray-900"}`}
              >
                {day}
              </span>

              <div className="flex flex-col gap-1.5 w-full mt-1">
                {/* ATTENDANCE BADGE */}
                {dayAtt && dayAtt.status !== "On Leave" && (
                  <span
                    className={`text-[0.60rem] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded flex w-fit ${isSelected ? "bg-white/20 text-white" : attendanceColors[dayAtt.status] || "text-gray-600 bg-gray-100"}`}
                  >
                    {dayAtt.status}
                  </span>
                )}

                {/* LEAVE BADGES */}
                {dayLeaves.map((leave) => (
                  <div
                    key={leave.id}
                    className="flex flex-col gap-0.5 text-left w-full"
                  >
                    <span
                      className={`truncate font-bold text-[0.65rem] leading-tight ${isSelected ? "text-white" : "text-gray-800"}`}
                      title={leave.leave_type}
                    >
                      {leave.leave_type}
                    </span>
                    <span
                      className={`truncate font-semibold text-[0.60rem] uppercase ${isSelected ? "text-purple-200" : statusColors[leave.status]?.text}`}
                    >
                      • {leave.status}
                    </span>
                  </div>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <div className="mt-6 pt-5 border-t border-gray-200 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <h4 className="m-0 mb-4 font-bold text-gray-900 text-lg">
            Details for {monthName.split(" ")[0]} {selectedDate}, {year}
          </h4>
          {selectedLeaves.length === 0 &&
          !getAttendanceForDate(
            `${year}-${pad(month + 1)}-${pad(selectedDate)}`,
          ) ? (
            <p className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg border border-gray-100">
              No leave or attendance records found for this date.
            </p>
          ) : (
            <ul className="list-none m-0 p-0 flex flex-col gap-3">
              {/* Show Attendance if it exists */}
              {getAttendanceForDate(
                `${year}-${pad(month + 1)}-${pad(selectedDate)}`,
              ) && (
                <li className="flex items-center justify-between gap-3 p-4 bg-gray-50 border border-gray-100 rounded-xl">
                  <div>
                    <p className="m-0 font-bold text-gray-900 text-sm">
                      Daily Attendance Record
                    </p>
                    <p className="m-0 text-xs text-gray-500 mt-1">System Log</p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-md px-3 py-1 text-xs font-bold uppercase tracking-wider ${attendanceColors[getAttendanceForDate(`${year}-${pad(month + 1)}-${pad(selectedDate)}`).status] || "bg-gray-200 text-gray-800"}`}
                  >
                    {
                      getAttendanceForDate(
                        `${year}-${pad(month + 1)}-${pad(selectedDate)}`,
                      ).status
                    }
                  </span>
                </li>
              )}

              {/* Show Leaves */}
              {selectedLeaves.map((l) => (
                <li
                  key={l.id}
                  className="flex items-center justify-between gap-3 p-4 bg-white border border-gray-200 shadow-sm rounded-xl"
                >
                  <div>
                    <p className="m-0 font-bold text-gray-900 text-sm">
                      {l.leave_type}
                    </p>
                    <p className="m-0 text-xs text-gray-500 mt-1">
                      {new Date(l.date_from).toLocaleDateString()} to{" "}
                      {new Date(l.date_to).toLocaleDateString()}
                    </p>
                    {l.supervisor_remarks && (
                      <p className="m-0 text-xs text-gray-600 mt-2 italic bg-gray-50 p-2 rounded-md border border-gray-100">
                        "{l.supervisor_remarks}"
                      </p>
                    )}
                  </div>
                  <span
                    className={`inline-flex items-center rounded-md px-3 py-1 text-xs font-bold uppercase tracking-wider ${badgeClass[l.status] || "bg-gray-100"}`}
                  >
                    {l.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// --- MAIN PAGE COMPONENT ---
export default function Leave() {
  const queryClient = useQueryClient();
  const { toast, showToast, clearToast } = useToast();

  const currentUser = JSON.parse(localStorage.getItem("wah_user") || "{}");

  const [activeTab, setActiveTab] = useState("leave");
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState("");

  const [offsetForm, setOffsetForm] = useState({
    date_from: "",
    date_to: "",
    days_applied: "",
  });

  const [formData, setFormData] = useState({
    emp_id: currentUser?.emp_id || "",
    leaveType: "Birthday Leave",
    fromDate: "",
    toDate: "",
    reason: "",
    priority: "Low",
  });

  // --- QUERIES ---
  // 1. Fetch Leaves (Backend is already returning ONLY RankAndFile user's leaves)
  const { data: leaves = [], isLoading: isLoadingLeaves } = useQuery({
    queryKey: ["leaves"],
    queryFn: async () => {
      const res = await apiFetch("/api/employees/leaves");
      if (!res.ok) throw new Error("Failed to fetch leaves");
      return res.json();
    },
  });

  // 2. Filter leaves to strictly the current user just in case
  const myLeaves = leaves.filter((l) => l.emp_id === currentUser?.emp_id);

  // 3. Fetch the current user's full attendance history for the calendar
  const { data: myAttendance = [] } = useQuery({
    queryKey: ["my-attendance", currentUser?.emp_id],
    queryFn: async () => {
      if (!currentUser?.emp_id) return [];
      try {
        // Now calling the dedicated, secure endpoint for personal history!
        const res = await apiFetch(`/api/employees/my-attendance`);
        if (!res.ok) return [];
        return await res.json();
      } catch (err) {
        console.error("Failed to fetch attendance:", err);
        return [];
      }
    },
  });

  const { data: offsetApplications = [], isLoading: isLoadingOffsets } =
    useQuery({
      queryKey: ["offset-applications"],
      queryFn: async () => {
        const res = await apiFetch("/api/employees/offset-applications");
        if (!res.ok) throw new Error("Failed to fetch offset applications");
        return res.json();
      },
    });

  const { data: offsetBalance = {} } = useQuery({
    queryKey: ["offset-balance", currentUser?.emp_id],
    queryFn: async () => {
      if (!currentUser?.emp_id) return {};
      const res = await apiFetch(
        `/api/employees/offset-balance/${currentUser.emp_id}`,
      );
      if (!res.ok) return {};
      return res.json();
    },
  });

  // --- MUTATIONS ---
  const submitLeaveMutation = useMutation({
    mutationFn: async (newLeave) => {
      const res = await apiFetch("/api/employees/leaves", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newLeave),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to submit leave");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["leaves"]);
      showToast("Leave application submitted successfully.");
      setShowForm(false);
      setFormData({ ...formData, fromDate: "", toDate: "", reason: "" });
    },
    onError: (err) => {
      setFormError(err.message);
      showToast(err.message || "Failed to submit leave application.", "error");
    },
  });

  const fileOffsetMutation = useMutation({
    mutationFn: async (offsetData) => {
      const res = await apiFetch("/api/employees/offset-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emp_id: currentUser?.emp_id,
          ...offsetData,
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to file offset");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["offset-applications"]);
      showToast("Offset application filed successfully.");
      setOffsetForm({ date_from: "", date_to: "", days_applied: "" });
      setShowForm(false);
    },
    onError: (err) =>
      showToast(err.message || "Failed to file offset.", "error"),
  });

  // --- HANDLERS ---
  const handleSubmitLeave = (e) => {
    e.preventDefault();
    if (!formData.emp_id || !formData.fromDate || !formData.toDate) {
      setFormError("Please fill all required fields.");
      return;
    }

    submitLeaveMutation.mutate({
      emp_id: formData.emp_id,
      leave_type: formData.leaveType,
      date_from: formData.fromDate,
      date_to: formData.toDate,
      priority: formData.priority,
      supervisor_remarks: formData.reason,
    });
  };

  const handleLeaveTypeChange = (e) => {
    const newLeaveType = e.target.value;
    const newToDate =
      newLeaveType === "Birthday Leave" && formData.fromDate
        ? formData.fromDate
        : "";
    setFormData({ ...formData, leaveType: newLeaveType, toDate: newToDate });
    setFormError("");
  };

  const handleFromDateChange = (e) => {
    const newFromDate = e.target.value;
    const newToDate =
      formData.leaveType === "Birthday Leave" ? newFromDate : "";
    setFormData({ ...formData, fromDate: newFromDate, toDate: newToDate });
    setFormError("");
  };

  const handleToDateChange = (e) => {
    const toDate = e.target.value;
    const policy = leavePolicy[formData.leaveType];
    if (formData.fromDate && toDate) {
      const businessDays = calculateBusinessDays(
        new Date(formData.fromDate),
        new Date(toDate),
      );
      if (businessDays > policy.maxDays) {
        setFormError(
          `Maximum ${policy.maxDays} business day(s) allowed for ${formData.leaveType}`,
        );
        return;
      }
    }
    setFormData({ ...formData, toDate });
    setFormError("");
  };

  const getMaxToDate = () => {
    if (!formData.fromDate) return "";
    const policy = leavePolicy[formData.leaveType];
    const startDate = new Date(formData.fromDate);
    let daysAdded = 0;
    const maxDays = policy.maxDays;
    while (daysAdded < maxDays) {
      startDate.setDate(startDate.getDate() + 1);
      if (startDate.getDay() !== 0 && startDate.getDay() !== 6) daysAdded++;
    }
    return startDate.toISOString().split("T")[0];
  };

  if (isLoadingLeaves || isLoadingOffsets)
    return (
      <div className="p-6 font-bold text-gray-800">Loading your data...</div>
    );

  return (
    <div className="max-w-full">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <h1 className="m-0 text-[1.4rem] font-bold text-gray-900">
          My Leave & Offsets
        </h1>
      </div>

      {/* TAB NAVIGATION */}
      <div className="flex items-center gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("leave")}
          className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "leave"
              ? "border-purple-600 text-purple-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          📅 My Calendar
        </button>
        {currentUser?.role !== "Admin" && (
          <button
            onClick={() => setActiveTab("offset")}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "offset"
                ? "border-purple-600 text-purple-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            ⏱️ Offset / Overtime
          </button>
        )}
      </div>

      {/* LEAVE TAB */}
      {activeTab === "leave" && (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <button
              className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 border-0 text-white text-sm font-bold cursor-pointer hover:opacity-90 shadow-sm"
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? "✕ Cancel Request" : "+ File New Leave"}
            </button>
          </div>

          {showForm && currentUser?.role !== "Admin" && (
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 mb-8 animate-in fade-in slide-in-from-top-2 duration-200">
              <h3 className="m-0 mb-4 text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">
                File a Leave Application
              </h3>
              {formError && (
                <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 font-medium">
                  ⚠️ {formError}
                </div>
              )}
              <form
                onSubmit={handleSubmitLeave}
                className="grid grid-cols-1 md:grid-cols-3 gap-5"
              >
                {/* LOCKED EMPLOYEE FIELD */}
                <div className="flex flex-col gap-2 md:col-span-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Filing As
                  </label>
                  <input
                    type="text"
                    disabled
                    value={`${currentUser.emp_id} - ${currentUser.name}`}
                    className="px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-600 font-bold outline-none cursor-not-allowed"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Leave Type
                  </label>
                  <select
                    value={formData.leaveType}
                    onChange={handleLeaveTypeChange}
                    className="px-4 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  >
                    {leaveTypes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <p className="text-[0.65rem] text-gray-500 font-semibold uppercase mt-1">
                    Max allowed: {leavePolicy[formData.leaveType]?.maxDays}{" "}
                    business day(s)
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    From Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.fromDate}
                    onChange={handleFromDateChange}
                    className="px-4 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    To Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.toDate}
                    onChange={handleToDateChange}
                    disabled={formData.leaveType === "Birthday Leave"}
                    max={getMaxToDate()}
                    min={formData.fromDate}
                    className={`px-4 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-purple-500 ${formData.leaveType === "Birthday Leave" ? "bg-gray-100 cursor-not-allowed text-gray-500" : ""}`}
                  />
                </div>
                <div className="flex flex-col gap-2 md:col-span-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Priority Level
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: e.target.value })
                    }
                    className="px-4 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  >
                    <option value="Low">🟢 Low</option>
                    <option value="Medium">🟡 Medium</option>
                    <option value="High">🔴 High</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2 md:col-span-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Reason for Leave
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Please provide details..."
                    value={formData.reason}
                    onChange={(e) =>
                      setFormData({ ...formData, reason: e.target.value })
                    }
                    className="px-4 py-3 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  />
                </div>
                <div className="mt-2 flex gap-3 justify-end md:col-span-3">
                  <button
                    type="submit"
                    disabled={submitLeaveMutation.isPending}
                    className="px-6 py-2.5 rounded-lg bg-green-600 border-0 text-white text-sm font-bold cursor-pointer hover:bg-green-700 disabled:opacity-50 shadow-sm"
                  >
                    {submitLeaveMutation.isPending
                      ? "Submitting..."
                      : "Submit Request"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* PERMANENT CALENDAR VIEW */}
          <LeaveCalendar leaves={myLeaves} attendance={myAttendance} />
        </div>
      )}

      {/* OFFSET TAB */}
      {activeTab === "offset" && currentUser?.role !== "Admin" && (
        <div>
          <div className="mb-6 p-5 rounded-xl bg-indigo-50 border border-indigo-100 shadow-sm">
            <h3 className="m-0 mb-4 text-base font-bold text-indigo-900 border-b border-indigo-200 pb-2">
              Monthly Offset Balance
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
              <div className="bg-white p-3 rounded-lg border border-indigo-50 text-center shadow-sm">
                <p className="text-indigo-600 font-bold uppercase tracking-wider text-[0.65rem] mb-1">
                  Working Days
                </p>
                <p className="text-indigo-900 font-black text-xl">
                  {Number(offsetBalance.workingDaysCompleted || 0).toFixed(1)}
                </p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-indigo-50 text-center shadow-sm">
                <p className="text-indigo-600 font-bold uppercase tracking-wider text-[0.65rem] mb-1">
                  Baseline
                </p>
                <p className="text-indigo-900 font-black text-xl">
                  {offsetBalance.baselineDays || 22}
                </p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-indigo-50 text-center shadow-sm">
                <p className="text-green-600 font-bold uppercase tracking-wider text-[0.65rem] mb-1">
                  Earned Offsets
                </p>
                <p className="text-green-700 font-black text-xl">
                  +{Number(offsetBalance.offsetEarned || 0).toFixed(2)}
                </p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-indigo-50 text-center shadow-sm">
                <p className="text-purple-600 font-bold uppercase tracking-wider text-[0.65rem] mb-1">
                  End Balance
                </p>
                <p className="text-purple-700 font-black text-xl">
                  {Number(offsetBalance.finalBalance || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="mb-6 flex items-center gap-3">
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 border-0 text-white text-sm font-bold cursor-pointer hover:opacity-90 shadow-sm"
            >
              {showForm ? "✕ Cancel Request" : "+ File Offset Request"}
            </button>
          </div>

          {showForm && (
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 mb-8 animate-in fade-in slide-in-from-top-2 duration-200">
              <h3 className="m-0 mb-4 text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">
                File Offset / Overtime Request
              </h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (
                    !offsetForm.date_from ||
                    !offsetForm.date_to ||
                    !offsetForm.days_applied
                  ) {
                    showToast("Please fill all required fields.", "error");
                    return;
                  }
                  fileOffsetMutation.mutate({
                    date_from: offsetForm.date_from,
                    date_to: offsetForm.date_to,
                    days_applied: parseFloat(offsetForm.days_applied),
                  });
                }}
                className="grid grid-cols-1 md:grid-cols-3 gap-5"
              >
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    From Date
                  </label>
                  <input
                    type="date"
                    required
                    value={offsetForm.date_from}
                    onChange={(e) =>
                      setOffsetForm({
                        ...offsetForm,
                        date_from: e.target.value,
                      })
                    }
                    className="px-4 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    To Date
                  </label>
                  <input
                    type="date"
                    required
                    value={offsetForm.date_to}
                    className="px-4 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                    onChange={(e) =>
                      setOffsetForm({ ...offsetForm, date_to: e.target.value })
                    }
                    min={offsetForm.date_from}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Days Applied
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    required
                    value={offsetForm.days_applied}
                    onChange={(e) =>
                      setOffsetForm({
                        ...offsetForm,
                        days_applied: e.target.value,
                      })
                    }
                    className="px-4 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="mt-2 flex gap-3 justify-end col-span-full">
                  <button
                    type="submit"
                    disabled={fileOffsetMutation.isPending}
                    className="px-6 py-2.5 rounded-lg bg-green-600 border-0 text-white text-sm font-bold cursor-pointer hover:bg-green-700 disabled:opacity-50 shadow-sm"
                  >
                    {fileOffsetMutation.isPending
                      ? "Filing..."
                      : "Submit Request"}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
              <h3 className="m-0 text-lg font-bold text-gray-900">
                My Offset History
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-gray-200 bg-white">
                    <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">
                      From Date
                    </th>
                    <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">
                      To Date
                    </th>
                    <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs text-center">
                      Days
                    </th>
                    <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs text-right">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {offsetApplications.length === 0 ? (
                    <tr>
                      <td
                        colSpan="4"
                        className="px-6 py-10 text-center text-gray-500 font-medium"
                      >
                        You haven't filed any offset requests yet.
                      </td>
                    </tr>
                  ) : (
                    offsetApplications.map((oa) => (
                      <tr
                        key={oa.id}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-6 py-4 text-gray-700 font-medium">
                          {new Date(oa.date_from).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-gray-700 font-medium">
                          {new Date(oa.date_to).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 font-bold text-indigo-700 text-center">
                          {Number(oa.days_applied || 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span
                            className={`inline-flex items-center rounded-md px-3 py-1 text-[0.70rem] font-bold uppercase tracking-wider ${
                              oa.status === "Approved"
                                ? "bg-green-100 text-green-700 border border-green-200"
                                : oa.status === "Denied"
                                  ? "bg-red-100 text-red-700 border border-red-200"
                                  : oa.status === "Partially Approved"
                                    ? "bg-amber-100 text-amber-700 border border-amber-200"
                                    : "bg-yellow-100 text-yellow-700 border border-yellow-200"
                            }`}
                          >
                            {oa.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      <Toast toast={toast} onClose={clearToast} />
    </div>
  );
}
