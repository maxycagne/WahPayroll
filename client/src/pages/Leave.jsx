import { useState } from "react";
import { URL } from "../assets/constant";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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

// Offset Calculation Utilities
function calculateEligibleOffsetDays(workingDays, weekendDays) {
  const REQUIRED_WORKING_DAYS = 22;
  if (workingDays >= REQUIRED_WORKING_DAYS && weekendDays > 0) {
    const extra = workingDays - REQUIRED_WORKING_DAYS;
    return Math.min(extra + weekendDays, 4); // Max 2-4 days
  }
  return 0;
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

// Sample offset data structure
const sampleOffsets = [
  {
    id: 1,
    emp_id: "WAH-001",
    employee_name: "John Doe",
    month: "March 2026",
    working_days: 23,
    weekend_days: 3,
    eligible_offset: 1,
    requested_days: 1,
    approved_days: 1,
    status: "Approved",
    supervisor: "sir pey",
    remarks: "Approved for 1 day offset",
    created_at: "2026-03-15",
  },
  {
    id: 2,
    emp_id: "WAH-002",
    employee_name: "Jane Smith",
    month: "March 2026",
    working_days: 25,
    weekend_days: 4,
    eligible_offset: 3,
    requested_days: 2,
    approved_days: 0,
    status: "Pending",
    supervisor: null,
    remarks: "",
    created_at: "2026-03-16",
  },
];

// --- CALENDAR COMPONENT ---
function LeaveCalendar({ leaves }) {
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

  function getLeavesForDate(dateStr) {
    return leaves.filter((l) => isInRange(dateStr, l.date_from, l.date_to));
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
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-6 mb-6">
      <div className="mb-6 pb-6 border-b border-gray-200">
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

      <div className="flex items-center justify-between mb-5">
        <button
          className="px-4 py-2 bg-transparent border border-gray-300 rounded-lg text-sm cursor-pointer text-gray-700 hover:bg-gray-50"
          onClick={prevMonth}
        >
          ◀ Previous
        </button>
        <h3 className="m-0 text-lg font-semibold text-gray-900">{monthName}</h3>
        <button
          className="px-4 py-2 bg-transparent border border-gray-300 rounded-lg text-sm cursor-pointer text-gray-700 hover:bg-gray-50"
          onClick={nextMonth}
        >
          Next ▶
        </button>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div
            key={d}
            className="text-center text-xs font-semibold text-gray-500 py-2"
          >
            {d}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day === null)
            return <div key={"e" + i} className="aspect-square" />;
          const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`;
          const dayLeaves = getLeavesForDate(dateStr);
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
              className={`min-h-24 flex flex-col items-start justify-start rounded-lg cursor-pointer relative p-1.5 transition-all duration-150 text-[0.65rem] ${
                dayLeaves.length > 0 && !isSelected
                  ? colorConfig?.border + " " + colorConfig?.bg
                  : "border border-gray-200"
              } ${isSelected ? "bg-purple-600 text-white border-purple-600" : "hover:border-gray-300"}`}
              onClick={() => setSelectedDate(day === selectedDate ? null : day)}
            >
              <span
                className={`font-bold text-xs ${isSelected ? "text-white" : "text-black"}`}
              >
                {day}
              </span>
              <div className="flex flex-col gap-1 mt-1 w-full">
                {dayLeaves.slice(0, 2).map((leave) => (
                  <div
                    key={leave.id}
                    className="flex flex-col gap-0.5 text-left"
                  >
                    <span
                      className={`truncate font-semibold text-[0.6rem] ${isSelected ? "text-white" : "text-black"}`}
                    >
                      {leave.first_name} {leave.last_name}
                    </span>
                    <span
                      className={`truncate text-[0.55rem] ${isSelected ? "text-gray-200" : "text-gray-600"}`}
                    >
                      {leave.leave_type}
                    </span>
                    <span
                      className={`truncate font-bold text-[0.55rem] uppercase ${isSelected ? "text-white" : statusColors[leave.status]?.text}`}
                    >
                      • {leave.status}
                    </span>
                  </div>
                ))}
                {dayLeaves.length > 2 && (
                  <span
                    className={`text-[0.55rem] font-semibold ${isSelected ? "text-purple-200" : "text-purple-700"}`}
                  >
                    +{dayLeaves.length - 2} more
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
      {selectedDate && (
        <div className="mt-5 pt-4 border-t border-gray-200">
          <h4 className="m-0 mb-3 font-semibold text-gray-900">
            Leaves on {monthName.split(" ")[0]} {selectedDate}, {year}
          </h4>
          {selectedLeaves.length === 0 ? (
            <p className="text-sm text-gray-500">No leaves on this date.</p>
          ) : (
            <ul className="list-none m-0 p-0 flex flex-col gap-2">
              {selectedLeaves.map((l) => (
                <li
                  key={l.id}
                  className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="m-0 font-semibold text-gray-900 text-sm">
                      {l.first_name} {l.last_name}
                    </p>
                    <p className="m-0 text-xs text-gray-600 mt-0.5">
                      {l.leave_type}
                    </p>
                    <p className="m-0 text-xs text-gray-500 mt-1">
                      {new Date(l.date_from).toLocaleDateString()} to{" "}
                      {new Date(l.date_to).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap ${badgeClass[l.status] || "bg-gray-100"}`}
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
  const [activeTab, setActiveTab] = useState("leave");

  // Grab the currently logged-in user from localStorage
  const currentUser = JSON.parse(localStorage.getItem("wah_user") || "{}");

  // ROLE PERMISSIONS
  // Only these 3 roles can file leaves/offsets
  const canFile = ["Supervisor", "HR", "RankAndFile"].includes(
    currentUser?.role,
  );
  // Only Admin and Supervisor can approve leaves/offsets
  const canApprove = ["Admin", "Supervisor"].includes(currentUser?.role);

  const [showForm, setShowForm] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showOffsetForm, setShowOffsetForm] = useState(false);
  const [formError, setFormError] = useState("");
  const [offsetFormError, setOffsetFormError] = useState("");
  const [offsets, setOffsets] = useState(sampleOffsets);

  // Set the default emp_id to the logged in user
  const [formData, setFormData] = useState({
    emp_id: currentUser?.emp_id || "",
    leaveType: "Birthday Leave",
    fromDate: "",
    toDate: "",
    reason: "",
    priority: "Low",
  });

  const [offsetFormData, setOffsetFormData] = useState({
    emp_id: currentUser?.emp_id || "",
    working_days: 22,
    weekend_days: 0,
    requested_days: 0,
    remarks: "",
  });

  // --- QUERIES ---
  const { data: leaves = [], isLoading: isLoadingLeaves } = useQuery({
    queryKey: ["leaves"],
    queryFn: async () => {
      const res = await fetch(`${URL}/api/employees/leaves`, {
        headers: {
          "ngrok-skip-browser-warning": "69420",
          "bypass-tunnel-reminder": "true",
        },
      });
      if (!res.ok) throw new Error("Failed to fetch leaves");
      return res.json();
    },
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const res = await fetch(`${URL}/api/employees`, {
        headers: {
          "ngrok-skip-browser-warning": "69420",
          "bypass-tunnel-reminder": "true",
        },
      });
      const data = await res.json();
      return data;
    },
  });

  // --- MUTATIONS ---
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const res = await fetch(`${URL}/api/employees/leaves/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "69420",
          "bypass-tunnel-reminder": "true",
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Status update failed");
    },
    onSuccess: () => queryClient.invalidateQueries(["leaves"]),
  });

  const submitLeaveMutation = useMutation({
    mutationFn: async (newLeave) => {
      const res = await fetch(`${URL}/api/employees/leaves`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "69420",
          "bypass-tunnel-reminder": "true",
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
      alert("Leave application submitted successfully!");
      setShowForm(false);
      setFormData({ ...formData, fromDate: "", toDate: "", reason: "" });
    },
    onError: (err) => setFormError(err.message),
  });

  const submitOffsetMutation = useMutation({
    mutationFn: async (newOffset) => {
      return new Promise((resolve) => {
        setTimeout(() => resolve(newOffset), 500);
      });
    },
    onSuccess: (data) => {
      setOffsets([
        ...offsets,
        {
          ...data,
          id: Date.now(),
          status: "Pending",
          created_at: new Date().toISOString().split("T")[0],
        },
      ]);
      alert("Offset request submitted successfully!");
      setShowOffsetForm(false);
      setOffsetFormData({
        ...offsetFormData,
        working_days: 22,
        weekend_days: 0,
        requested_days: 0,
        remarks: "",
      });
      setOffsetFormError("");
    },
    onError: (err) => setOffsetFormError(err.message),
  });

  const approveOffsetMutation = useMutation({
    mutationFn: async ({ id, approved_days, remarks }) => {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ id, approved_days, remarks }), 500);
      });
    },
    onSuccess: (data) => {
      setOffsets(
        offsets.map((o) =>
          o.id === data.id
            ? {
                ...o,
                approved_days: data.approved_days,
                status: "Approved",
                remarks: data.remarks,
                supervisor: "sir pey",
              }
            : o,
        ),
      );
      alert("Offset approved!");
    },
  });

  const denyOffsetMutation = useMutation({
    mutationFn: async ({ id, remarks }) => {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ id, remarks }), 500);
      });
    },
    onSuccess: (data) => {
      setOffsets(
        offsets.map((o) =>
          o.id === data.id
            ? {
                ...o,
                status: "Denied",
                remarks: data.remarks,
                supervisor: "sir pey",
              }
            : o,
        ),
      );
      alert("Offset denied!");
    },
  });

  // --- HANDLERS ---
  const handleUpdateStatus = (id, newStatus) => {
    updateStatusMutation.mutate({ id, status: newStatus });
  };

  const handleSubmitOffsetForm = (e) => {
    e.preventDefault();
    if (!offsetFormData.emp_id || offsetFormData.working_days < 22) {
      setOffsetFormError(
        "Employee ID required and minimum 22 working days needed to file offset.",
      );
      return;
    }

    const eligible = calculateEligibleOffsetDays(
      offsetFormData.working_days,
      offsetFormData.weekend_days,
    );
    if (offsetFormData.requested_days > eligible) {
      setOffsetFormError(
        `Cannot request more than ${eligible} eligible offset day(s).`,
      );
      return;
    }

    submitOffsetMutation.mutate({
      emp_id: offsetFormData.emp_id,
      employee_name: currentUser?.name || "Unknown",
      month: new Date().toLocaleString("default", {
        month: "long",
        year: "numeric",
      }),
      working_days: offsetFormData.working_days,
      weekend_days: offsetFormData.weekend_days,
      eligible_offset: eligible,
      requested_days: offsetFormData.requested_days,
      approved_days: 0,
      remarks: offsetFormData.remarks,
    });
  };

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

  if (isLoadingLeaves)
    return <div className="p-6 font-bold">Loading Leave Data...</div>;

  const offsetBadgeClass = {
    Approved: "bg-green-100 text-green-800",
    Denied: "bg-red-100 text-red-800",
    Pending: "bg-yellow-100 text-yellow-800",
  };

  return (
    <div className="max-w-full">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <h1 className="m-0 text-[1.4rem] font-bold text-gray-900">
          Leave & Offset Management
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("leave")}
          className={`px-4 py-3 font-semibold text-sm border-b-2 transition-colors ${
            activeTab === "leave"
              ? "border-purple-600 text-purple-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Leave Applications
        </button>
        <button
          onClick={() => setActiveTab("offset")}
          className={`px-4 py-3 font-semibold text-sm border-b-2 transition-colors ${
            activeTab === "offset"
              ? "border-purple-600 text-purple-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Offset Balance & Requests
        </button>
      </div>

      {/* LEAVE TAB */}
      {activeTab === "leave" && (
        <>
          <div className="flex items-center justify-end gap-3 mb-6">
            <button
              className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-semibold cursor-pointer text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={() => {
                setShowCalendar(!showCalendar);
                if (showForm) setShowForm(false);
              }}
            >
              {showCalendar ? "✕ Close Calendar" : "📅 View Calendar"}
            </button>

            {/* RESTRICTED FILE LEAVE BUTTON - Hides for Admin */}
            {canFile && (
              <button
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 border-0 text-white text-sm font-semibold cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => {
                  setShowForm(!showForm);
                  if (showCalendar) setShowCalendar(false);
                }}
              >
                {showForm ? "✕ Close" : "+ File Leave"}
              </button>
            )}
          </div>

          {showCalendar && <LeaveCalendar leaves={leaves} />}

          {showForm && canFile && (
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-6 mb-6">
              <h3 className="m-0 mb-4 text-lg font-semibold text-gray-900">
                File a Leave Application
              </h3>
              {formError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {formError}
                </div>
              )}
              <form
                onSubmit={handleSubmitLeave}
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                {/* LOCKED EMPLOYEE FIELD */}
                <div className="flex flex-col gap-2 md:col-span-3">
                  <label className="text-sm font-semibold text-gray-700">
                    Filing Leave As
                  </label>
                  <input
                    type="text"
                    disabled
                    value={
                      currentUser?.name
                        ? `${currentUser.emp_id} - ${currentUser.name}`
                        : "Loading..."
                    }
                    className="px-4 py-2 rounded-lg border border-gray-200 bg-gray-100 text-sm text-gray-600 font-bold outline-none cursor-not-allowed"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Leave Type
                  </label>
                  <select
                    value={formData.leaveType}
                    onChange={handleLeaveTypeChange}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {leaveTypes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Max: {leavePolicy[formData.leaveType]?.maxDays} business
                    day(s)
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-gray-700">
                    From
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.fromDate}
                    onChange={handleFromDateChange}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-gray-700">
                    To
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.toDate}
                    onChange={handleToDateChange}
                    disabled={formData.leaveType === "Birthday Leave"}
                    max={getMaxToDate()}
                    min={formData.fromDate}
                    className={`px-4 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-purple-500 ${formData.leaveType === "Birthday Leave" ? "bg-gray-100 cursor-not-allowed text-gray-500" : ""}`}
                  />
                </div>
                <div className="flex flex-col gap-2 md:col-span-3">
                  <label className="text-sm font-semibold text-gray-700">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: e.target.value })
                    }
                    className="px-4 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2 md:col-span-3">
                  <label className="text-sm font-semibold text-gray-700">
                    Reason
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Reason for leave…"
                    value={formData.reason}
                    onChange={(e) =>
                      setFormData({ ...formData, reason: e.target.value })
                    }
                    className="px-4 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="mt-4 flex gap-3 justify-end md:col-span-3">
                  <button
                    type="button"
                    className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-semibold cursor-pointer text-gray-700 hover:bg-gray-50"
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitLeaveMutation.isPending}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 border-0 text-white text-sm font-semibold cursor-pointer hover:opacity-90"
                  >
                    {submitLeaveMutation.isPending ? "Submitting..." : "Submit"}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden mt-6">
            <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
              <h3 className="m-0 text-lg font-semibold text-gray-900">
                All Leave Requests
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-6 py-3 font-semibold text-gray-700 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-3 font-semibold text-gray-700 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 font-semibold text-gray-700 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 font-semibold text-gray-700 uppercase tracking-wider">
                      From
                    </th>
                    <th className="px-6 py-3 font-semibold text-gray-700 uppercase tracking-wider">
                      To
                    </th>
                    <th className="px-6 py-3 font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    {canApprove && (
                      <th className="px-6 py-3 font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {leaves.map((l) => (
                    <tr
                      key={l.id}
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="px-6 py-3 text-sm font-medium text-gray-900">
                        {l.first_name} {l.last_name}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-700">
                        {l.leave_type}
                      </td>
                      <td className="px-6 py-3 text-sm font-semibold text-gray-600">
                        {l.priority}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-700">
                        {new Date(l.date_from).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-700">
                        {new Date(l.date_to).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3 text-sm">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap ${badgeClass[l.status] || "bg-gray-100 text-gray-800"}`}
                        >
                          {l.status}
                        </span>
                      </td>
                      {canApprove && (
                        <td className="px-6 py-3 text-sm">
                          {l.status === "Pending" && (
                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  handleUpdateStatus(l.id, "Approved")
                                }
                                className="px-3 py-1 rounded-lg bg-green-100 text-green-700 text-xs font-semibold cursor-pointer hover:bg-green-200 border-0"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() =>
                                  handleUpdateStatus(l.id, "Denied")
                                }
                                className="px-3 py-1 rounded-lg bg-red-100 text-red-700 text-xs font-semibold cursor-pointer hover:bg-red-200 border-0"
                              >
                                Deny
                              </button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* OFFSET TAB */}
      {activeTab === "offset" && (
        <>
          <div className="flex items-center justify-end mb-6">
            {canFile && (
              <button
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 border-0 text-white text-sm font-semibold cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setShowOffsetForm(!showOffsetForm)}
              >
                {showOffsetForm ? "✕ Close" : "+ File Offset Request"}
              </button>
            )}
          </div>

          {showOffsetForm && canFile && (
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-6 mb-6">
              <h3 className="m-0 mb-4 text-lg font-semibold text-gray-900">
                File an Offset Request
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                <strong>Note:</strong> Offset is eligible when you have worked
                22+ working days and additional weekend days in a month.
                Requires supervisor approval.
              </p>
              {offsetFormError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {offsetFormError}
                </div>
              )}
              <form
                onSubmit={handleSubmitOffsetForm}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {/* LOCKED EMPLOYEE FIELD FOR OFFSET */}
                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Filing Offset As
                  </label>
                  <input
                    type="text"
                    disabled
                    value={
                      currentUser?.name
                        ? `${currentUser.emp_id} - ${currentUser.name}`
                        : "Loading..."
                    }
                    className="px-4 py-2 rounded-lg border border-gray-200 bg-gray-100 text-sm text-gray-600 font-bold outline-none cursor-not-allowed"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Working Days Completed
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="31"
                    value={offsetFormData.working_days}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      const eligible = calculateEligibleOffsetDays(
                        val,
                        offsetFormData.weekend_days,
                      );
                      setOffsetFormData({
                        ...offsetFormData,
                        working_days: val,
                        requested_days: Math.min(
                          offsetFormData.requested_days,
                          eligible,
                        ),
                      });
                    }}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Weekend Days Worked
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="8"
                    value={offsetFormData.weekend_days}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      const eligible = calculateEligibleOffsetDays(
                        offsetFormData.working_days,
                        val,
                      );
                      setOffsetFormData({
                        ...offsetFormData,
                        weekend_days: val,
                        requested_days: Math.min(
                          offsetFormData.requested_days,
                          eligible,
                        ),
                      });
                    }}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {offsetFormData.working_days >= 22 && (
                  <div className="md:col-span-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-semibold text-blue-900 mb-2">
                      Eligible Offset Days:{" "}
                      <span className="text-lg">
                        {calculateEligibleOffsetDays(
                          offsetFormData.working_days,
                          offsetFormData.weekend_days,
                        )}
                      </span>
                    </p>
                    <p className="text-xs text-blue-800">
                      You can request up to{" "}
                      {calculateEligibleOffsetDays(
                        offsetFormData.working_days,
                        offsetFormData.weekend_days,
                      )}{" "}
                      day(s) of offset for next month.
                    </p>
                  </div>
                )}

                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Requested Offset Days
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={calculateEligibleOffsetDays(
                      offsetFormData.working_days,
                      offsetFormData.weekend_days,
                    )}
                    value={offsetFormData.requested_days}
                    onChange={(e) =>
                      setOffsetFormData({
                        ...offsetFormData,
                        requested_days: parseInt(e.target.value) || 0,
                      })
                    }
                    className="px-4 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Remarks
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Any additional notes…"
                    value={offsetFormData.remarks}
                    onChange={(e) =>
                      setOffsetFormData({
                        ...offsetFormData,
                        remarks: e.target.value,
                      })
                    }
                    className="px-4 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="mt-4 flex gap-3 justify-end md:col-span-2">
                  <button
                    type="button"
                    className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-semibold cursor-pointer text-gray-700 hover:bg-gray-50"
                    onClick={() => setShowOffsetForm(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitOffsetMutation.isPending}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 border-0 text-white text-sm font-semibold cursor-pointer hover:opacity-90"
                  >
                    {submitOffsetMutation.isPending
                      ? "Submitting..."
                      : "Submit Request"}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
              <h3 className="m-0 text-lg font-semibold text-gray-900">
                Offset Requests
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-6 py-3 font-semibold text-gray-700 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-3 font-semibold text-gray-700 uppercase tracking-wider">
                      Month
                    </th>
                    <th className="px-6 py-3 font-semibold text-gray-700 uppercase tracking-wider">
                      Working Days
                    </th>
                    <th className="px-6 py-3 font-semibold text-gray-700 uppercase tracking-wider">
                      Weekend Days
                    </th>
                    <th className="px-6 py-3 font-semibold text-gray-700 uppercase tracking-wider">
                      Eligible
                    </th>
                    <th className="px-6 py-3 font-semibold text-gray-700 uppercase tracking-wider">
                      Requested
                    </th>
                    <th className="px-6 py-3 font-semibold text-gray-700 uppercase tracking-wider">
                      Approved
                    </th>
                    <th className="px-6 py-3 font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    {canApprove && (
                      <th className="px-6 py-3 font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {offsets.map((offset) => (
                    <tr
                      key={offset.id}
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="px-6 py-3 text-sm font-medium text-gray-900">
                        {offset.employee_name}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-700">
                        {offset.month}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-700">
                        {offset.working_days}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-700">
                        {offset.weekend_days}
                      </td>
                      <td className="px-6 py-3 text-sm font-semibold text-gray-900">
                        {offset.eligible_offset}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-700">
                        {offset.requested_days}
                      </td>
                      <td className="px-6 py-3 text-sm font-semibold text-gray-900">
                        {offset.approved_days}
                      </td>
                      <td className="px-6 py-3 text-sm">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap ${offsetBadgeClass[offset.status] || "bg-gray-100 text-gray-800"}`}
                        >
                          {offset.status}
                        </span>
                      </td>
                      {canApprove && (
                        <td className="px-6 py-3 text-sm">
                          {offset.status === "Pending" && (
                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  approveOffsetMutation.mutate({
                                    id: offset.id,
                                    approved_days: offset.requested_days,
                                    remarks: "Approved",
                                  })
                                }
                                className="px-3 py-1 rounded-lg bg-green-100 text-green-700 text-xs font-semibold cursor-pointer hover:bg-green-200 border-0"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() =>
                                  denyOffsetMutation.mutate({
                                    id: offset.id,
                                    remarks: "Denied",
                                  })
                                }
                                className="px-3 py-1 rounded-lg bg-red-100 text-red-700 text-xs font-semibold cursor-pointer hover:bg-red-200 border-0"
                              >
                                Deny
                              </button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                  {offsets.length === 0 && (
                    <tr>
                      <td
                        colSpan="9"
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        No offset requests found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
