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

const resignationTypes = [
  "Voluntary Resignation",
  "Health Reasons",
  "Relocation",
  "Career Change",
  "Further Education",
  "Other",
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

function getDateDiffInclusive(start, end) {
  const from = new Date(start).setHours(0, 0, 0, 0);
  const to = new Date(end).setHours(0, 0, 0, 0);
  return Math.floor((to - from) / (1000 * 60 * 60 * 24)) + 1;
}

function getDateRangeInclusive(start, end) {
  const dates = [];
  const current = new Date(start);
  const to = new Date(end);

  // Normalize both dates to the start of the day
  current.setHours(0, 0, 0, 0);
  to.setHours(0, 0, 0, 0);

  while (current <= to) {
    // SAFE LOCAL DATE FORMATTING (YYYY-MM-DD)
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, "0");
    const day = String(current.getDate()).padStart(2, "0");
    dates.push(`${year}-${month}-${day}`);

    current.setDate(current.getDate() + 1);
  }

  return dates;
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
  "Pending Approval": "bg-yellow-100 text-yellow-800",
  Rejected: "bg-red-100 text-red-800",
  "Partially Approved": "bg-amber-100 text-amber-800",
};

// --- CALENDAR COMPONENT ---
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
    "Partially Approved": {
      bg: "bg-amber-50",
      border: "border-l-4 border-l-amber-500",
      text: "text-amber-700",
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
    <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-3">
        <div>
          <h4 className="m-0 mb-2 text-xs font-semibold text-gray-900">
            Leave Status Legend
          </h4>
          <div className="flex flex-wrap gap-4">
            {Object.entries(statusColors).map(([status, colors]) => (
              <div key={status} className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${colors.border.split("border-l-")[1]}`}
                ></div>
                <span className="text-[11px] font-medium text-gray-700">
                  {status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between">
        <button
          className="cursor-pointer rounded-md border border-gray-300 bg-transparent px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          onClick={prevMonth}
        >
          ◀ Previous
        </button>
        <h3 className="m-0 text-lg font-bold text-gray-900">{monthName}</h3>
        <button
          className="cursor-pointer rounded-md border border-gray-300 bg-transparent px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          onClick={nextMonth}
        >
          Next ▶
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div
            key={d}
            className="rounded-md bg-gray-50 py-1.5 text-center text-[11px] font-bold uppercase tracking-wider text-gray-500"
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
              className={`relative flex min-h-18 cursor-pointer flex-col items-start justify-start rounded-md p-1.5 transition-all duration-150 ${
                dayLeaves.length > 0 && !isSelected
                  ? colorConfig?.border + " " + colorConfig?.bg
                  : "border border-gray-200"
              } ${isSelected ? "z-10 border-purple-600 bg-purple-600 text-white shadow-md" : "hover:border-purple-300 hover:bg-purple-50/30"}`}
              onClick={() => setSelectedDate(day === selectedDate ? null : day)}
            >
              <span
                className={`mb-0.5 text-xs font-bold ${isSelected ? "text-white" : "text-gray-900"}`}
              >
                {day}
              </span>

              <div className="mt-0.5 flex w-full flex-col gap-1">
                {/* ATTENDANCE BADGE */}
                {dayAtt && dayAtt.status !== "On Leave" && (
                  <span
                    className={`flex w-fit rounded px-1 py-0.5 text-[0.55rem] font-bold uppercase tracking-wider ${isSelected ? "bg-white/20 text-white" : attendanceColors[dayAtt.status] || "bg-gray-100 text-gray-600"}`}
                  >
                    {dayAtt.status}
                  </span>
                )}

                {/* LEAVE BADGES */}
                {dayLeaves.map((leave) => (
                  <div
                    key={leave.id}
                    className="mt-0.5 flex w-full flex-col gap-0.5 border-t border-gray-100/50 pt-0.5 text-left"
                  >
                    <span
                      className={`truncate text-[0.6rem] font-bold leading-tight ${isSelected ? "text-white" : "text-purple-800"}`}
                      title={`${leave.first_name} ${leave.last_name}`}
                    >
                      {leave.first_name} {leave.last_name}
                    </span>
                    <span
                      className={`truncate text-[0.55rem] font-semibold leading-tight ${isSelected ? "text-white/90" : "text-gray-600"}`}
                    >
                      {leave.leave_type}
                    </span>
                    <span
                      className={`truncate text-[0.55rem] font-semibold uppercase ${isSelected ? "text-purple-200" : statusColors[leave.status]?.text}`}
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
        <div className="mt-4 animate-in border-t border-gray-200 pt-3 fade-in slide-in-from-bottom-2 duration-200">
          <h4 className="m-0 mb-3 text-base font-bold text-gray-900">
            Details for {monthName.split(" ")[0]} {selectedDate}, {year}
          </h4>
          {selectedLeaves.length === 0 &&
          !getAttendanceForDate(
            `${year}-${pad(month + 1)}-${pad(selectedDate)}`,
          ) ? (
            <p className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-xs text-gray-500">
              No leave or attendance records found for this date.
            </p>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {/* Show Attendance if it exists */}
              {getAttendanceForDate(
                `${year}-${pad(month + 1)}-${pad(selectedDate)}`,
              ) && (
                <li className="flex items-center justify-between gap-2 rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <div>
                    <p className="m-0 font-bold text-gray-900 text-sm">
                      Daily Attendance Record
                    </p>
                    <p className="m-0 mt-1 text-[11px] text-gray-500">
                      System Log
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${attendanceColors[getAttendanceForDate(`${year}-${pad(month + 1)}-${pad(selectedDate)}`).status] || "bg-gray-200 text-gray-800"}`}
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
              {/* Show Leaves */}
              {selectedLeaves.map((l) => (
                <li
                  key={l.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white p-3 shadow-sm"
                >
                  <div>
                    <p className="m-0 font-bold text-purple-700 text-sm">
                      {l.first_name} {l.last_name}
                    </p>
                    <p className="m-0 font-bold text-gray-900 text-sm mt-0.5">
                      {l.leave_type}
                    </p>
                    <p className="m-0 mt-1 text-[11px] text-gray-500">
                      {new Date(l.date_from).toLocaleDateString()} to{" "}
                      {new Date(l.date_to).toLocaleDateString()}
                    </p>
                    {l.supervisor_remarks && (
                      <p className="m-0 mt-1.5 rounded-md border border-gray-100 bg-gray-50 p-1.5 text-[11px] italic text-gray-600">
                        "{l.supervisor_remarks}"
                      </p>
                    )}
                  </div>
                  <span
                    className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${badgeClass[l.status] || "bg-gray-100"}`}
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
  const [confirmAction, setConfirmAction] = useState(null);
  const [reviewConfirm, setReviewConfirm] = useState(null);

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

  // Resignation Form State
  const [resignationForm, setResignationForm] = useState({
    resignation_type: "Voluntary Resignation",
    effective_date: "",
    reason: "",
  });

  const approverRoles = ["Supervisor", "HR"];
  const isApprover = approverRoles.includes(currentUser?.role);

  // --- QUERIES ---
  const { data: leaves = [], isLoading: isLoadingLeaves } = useQuery({
    queryKey: ["leaves"],
    queryFn: async () => {
      const res = await apiFetch("/api/employees/leaves");
      if (!res.ok) throw new Error("Failed to fetch leaves");
      return res.json();
    },
  });

  const myLeaves = leaves.filter((l) => l.emp_id === currentUser?.emp_id);

  const { data: myAttendance = [] } = useQuery({
    queryKey: ["my-attendance", currentUser?.emp_id],
    queryFn: async () => {
      if (!currentUser?.emp_id) return [];
      try {
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

  const { data: myResignations = [], isLoading: isLoadingResignations } =
    useQuery({
      queryKey: ["resignations"],
      queryFn: async () => {
        const res = await apiFetch(`/api/employees/resignations`);
        const result = await res.json();

        if (!res.ok) {
          // This will now print the REAL SQL error (e.g., "Table 'resignations' doesn't exist")
          console.error("REAL BACKEND ERROR:", result.message);
          return [];
        }
        return result;
      },
    });

  const pendingLeaveApprovals = isApprover
    ? leaves.filter(
        (l) =>
          l.status === "Pending" &&
          String(l.emp_id) !== String(currentUser?.emp_id),
      )
    : [];

  const pendingOffsetApprovals = isApprover
    ? offsetApplications.filter(
        (oa) =>
          oa.status === "Pending" &&
          String(oa.emp_id) !== String(currentUser?.emp_id),
      )
    : [];

  const pendingResignationApprovals = isApprover
    ? myResignations.filter(
        (r) =>
          r.status === "Pending Approval" &&
          String(r.emp_id) !== String(currentUser?.emp_id),
      )
    : [];

  const leaveTabPendingCount = pendingLeaveApprovals.length;
  const offsetTabPendingCount = pendingOffsetApprovals.length;
  const resignationTabPendingCount = pendingResignationApprovals.length;

  // --- MUTATIONS ---
  const submitLeaveMutation = useMutation({
    mutationFn: async (newLeave) => {
      const res = await apiFetch("/api/employees/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

  // New Mutation: File Resignation
  const fileResignationMutation = useMutation({
    mutationFn: async (resignationData) => {
      const res = await apiFetch("/api/employees/resignations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emp_id: currentUser?.emp_id,
          ...resignationData,
        }),
      });
      if (!res.ok) throw new Error("Failed to file resignation");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["resignations"]);
      showToast("Resignation filed successfully.");
      setResignationForm({
        resignation_type: "Voluntary Resignation",
        effective_date: "",
        reason: "",
      });
      setShowForm(false);
    },
    onError: () => showToast("Error filing resignation.", "error"),
  });

  const reviewLeaveMutation = useMutation({
    mutationFn: async ({ id, ...payload }) => {
      const res = await apiFetch(`/api/employees/leaves/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Failed to update leave");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["leaves"]);
      showToast("Leave request updated successfully.");
    },
    onError: (err) =>
      showToast(err.message || "Failed to update leave request.", "error"),
  });

  const reviewOffsetMutation = useMutation({
    mutationFn: async ({ id, ...payload }) => {
      const res = await apiFetch(`/api/employees/offset-applications/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok)
        throw new Error(result.message || "Failed to update offset request");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["offset-applications"]);
      showToast("Offset request updated successfully.");
    },
    onError: (err) =>
      showToast(err.message || "Failed to update offset request.", "error"),
  });

  const reviewResignationMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const res = await apiFetch(`/api/employees/resignations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const result = await res.json();
      if (!res.ok)
        throw new Error(result.message || "Failed to update resignation");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["resignations"]);
      showToast("Resignation request updated successfully.");
    },
    onError: (err) =>
      showToast(err.message || "Failed to update resignation.", "error"),
  });

  // --- HANDLERS ---
  const handleSubmitLeave = (e) => {
    e.preventDefault();
    if (!formData.emp_id || !formData.fromDate || !formData.toDate) {
      setFormError("Please fill all required fields.");
      return;
    }

    // Show confirmation modal instead of directly submitting
    setConfirmAction({
      type: "leave",
      leaveType: formData.leaveType,
      fromDate: formData.fromDate,
      toDate: formData.toDate,
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

  // Helper for changing tabs cleanly
  const switchTab = (tab) => {
    setActiveTab(tab);
    setShowForm(false);
    setFormError("");
  };

  const openLeaveDecisionConfirm = (item, status) => {
    const totalDays = getDateDiffInclusive(item.date_from, item.date_to);
    const requestedDates = getDateRangeInclusive(item.date_from, item.date_to);
    const isMultiDay = totalDays > 1;

    setReviewConfirm({
      module: "leave",
      status,
      item,
      isMultiDay,
      totalDays,
      selectedDates: status === "Approved" ? requestedDates : [],
      remarks: "",
    });
  };

  const openOffsetDecisionConfirm = (item, status) => {
    const totalDays = Number(item.days_applied || 0);
    const isMultiDay = totalDays > 1;

    setReviewConfirm({
      module: "offset",
      status,
      item,
      isMultiDay,
      isPartial: false,
      approvedDays: totalDays,
      remarks: "",
    });
  };

  const openResignationDecisionConfirm = (item, status) => {
    setReviewConfirm({
      module: "resignation",
      status,
      item,
      remarks: "",
    });
  };

  const toggleLeaveApprovedDate = (date) => {
    if (!reviewConfirm || reviewConfirm.module !== "leave") return;

    const selected = new Set(reviewConfirm.selectedDates || []);
    if (selected.has(date)) {
      selected.delete(date);
    } else {
      selected.add(date);
    }

    setReviewConfirm({
      ...reviewConfirm,
      selectedDates: Array.from(selected).sort(),
    });
  };

  const submitReviewDecision = () => {
    if (!reviewConfirm) return;

    if (reviewConfirm.module === "leave") {
      const requestedDates = getDateRangeInclusive(
        reviewConfirm.item.date_from,
        reviewConfirm.item.date_to,
      );
      const selectedDates = reviewConfirm.selectedDates || [];

      if (reviewConfirm.status === "Approved" && reviewConfirm.isMultiDay) {
        if (selectedDates.length === 0) {
          showToast("Select at least one day to approve.", "error");
          return;
        }
      }

      const isPartialApproval =
        reviewConfirm.status === "Approved" &&
        reviewConfirm.isMultiDay &&
        selectedDates.length < requestedDates.length;

      reviewLeaveMutation.mutate({
        id: reviewConfirm.item.id,
        status:
          reviewConfirm.status === "Denied"
            ? "Denied"
            : isPartialApproval
              ? "Partially Approved"
              : "Approved",
        approved_days:
          reviewConfirm.status === "Denied" ? null : selectedDates.length,
        approved_dates:
          reviewConfirm.status === "Denied" ? null : selectedDates,
        supervisor_remarks: reviewConfirm.remarks?.trim() || undefined,
      });

      setReviewConfirm(null);
      return;
    }

    if (reviewConfirm.module === "offset") {
      if (reviewConfirm.status === "Approved") {
        const approvedDays = Number(reviewConfirm.approvedDays || 0);
        const totalDays = Number(reviewConfirm.item.days_applied || 0);

        if (!approvedDays || approvedDays <= 0 || approvedDays > totalDays) {
          showToast(
            "Approved days must be between 0 and requested days.",
            "error",
          );
          return;
        }

        const isPartial = approvedDays < totalDays;

        reviewOffsetMutation.mutate({
          id: reviewConfirm.item.id,
          status: isPartial ? "Partially Approved" : "Approved",
          approved_days: isPartial ? approvedDays : null,
          supervisor_remarks: reviewConfirm.remarks?.trim() || undefined,
        });
      } else {
        reviewOffsetMutation.mutate({
          id: reviewConfirm.item.id,
          status: "Denied",
          supervisor_remarks: reviewConfirm.remarks?.trim() || undefined,
        });
      }

      setReviewConfirm(null);
      return;
    }

    if (reviewConfirm.module === "resignation") {
      reviewResignationMutation.mutate({
        id: reviewConfirm.item.id,
        status: reviewConfirm.status === "Denied" ? "Denied" : "Approved",
      });

      setReviewConfirm(null);
    }
  };

  if (isLoadingLeaves || isLoadingOffsets || isLoadingResignations)
    return (
      <div className="p-6 font-bold text-gray-800">Loading your data...</div>
    );

  return (
    <div className="max-w-full">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <h1 className="m-0 text-[1.4rem] font-bold text-gray-900">
          My Application
        </h1>
      </div>

      {/* TAB NAVIGATION */}
      <div className="flex items-center gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => switchTab("leave")}
          className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "leave"
              ? "border-purple-600 text-purple-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          <span className="inline-flex items-center gap-1.5">
            <span>📅 My Calendar</span>
            {isApprover && leaveTabPendingCount > 0 && (
              <span className="inline-flex min-w-4 items-center justify-center rounded-full bg-yellow-100 px-1.5 py-0.5 text-[10px] font-bold text-yellow-800">
                {leaveTabPendingCount}
              </span>
            )}
          </span>
        </button>
        {currentUser?.role !== "Admin" && (
          <>
            <button
              onClick={() => switchTab("offset")}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === "offset"
                  ? "border-purple-600 text-purple-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                <span>⏱️ Offset / Overtime</span>
                {isApprover && offsetTabPendingCount > 0 && (
                  <span className="inline-flex min-w-4 items-center justify-center rounded-full bg-yellow-100 px-1.5 py-0.5 text-[10px] font-bold text-yellow-800">
                    {offsetTabPendingCount}
                  </span>
                )}
              </span>
            </button>
            <button
              onClick={() => switchTab("resignation")}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === "resignation"
                  ? "border-red-600 text-red-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                <span>🚪 Resignation</span>
                {isApprover && resignationTabPendingCount > 0 && (
                  <span className="inline-flex min-w-4 items-center justify-center rounded-full bg-yellow-100 px-1.5 py-0.5 text-[10px] font-bold text-yellow-800">
                    {resignationTabPendingCount}
                  </span>
                )}
              </span>
            </button>
          </>
        )}
      </div>

      {/* LEAVE TAB */}
      {activeTab === "leave" && (
        <div>
          {isApprover && (
            <div className="mb-4 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
                <h3 className="m-0 text-sm font-bold text-gray-900">
                  Pending Leave Approval Requests
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-gray-200 bg-white">
                      <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                        Employee
                      </th>
                      <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                        Leave Type
                      </th>
                      <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                        Dates
                      </th>
                      <th className="px-4 py-2.5 text-right text-[11px] font-bold uppercase tracking-wider text-gray-500">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pendingLeaveApprovals.length === 0 ? (
                      <tr>
                        <td
                          colSpan="4"
                          className="px-4 py-6 text-center text-sm font-medium text-gray-500"
                        >
                          No pending leave requests for your approval.
                        </td>
                      </tr>
                    ) : (
                      pendingLeaveApprovals.map((item) => (
                        <tr
                          key={item.id}
                          className="transition-colors hover:bg-gray-50/50"
                        >
                          <td className="px-4 py-2.5 text-sm font-semibold text-gray-800">
                            {item.first_name} {item.last_name}
                          </td>
                          <td className="px-4 py-2.5 text-sm text-gray-700">
                            {item.leave_type}
                          </td>
                          <td className="px-4 py-2.5 text-sm text-gray-700">
                            {new Date(item.date_from).toLocaleDateString()} -{" "}
                            {new Date(item.date_to).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <div className="inline-flex gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  openLeaveDecisionConfirm(item, "Approved")
                                }
                                disabled={reviewLeaveMutation.isPending}
                                className="rounded-md border border-green-200 bg-green-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-green-700 hover:bg-green-200 disabled:opacity-50"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  openLeaveDecisionConfirm(item, "Denied")
                                }
                                disabled={reviewLeaveMutation.isPending}
                                className="rounded-md border border-red-200 bg-red-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-red-700 hover:bg-red-200 disabled:opacity-50"
                              >
                                Deny
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
          )}

          {/* FIX: Hide the File Leave button for Admins */}
          {currentUser?.role !== "Admin" && (
            <div className="flex items-center gap-3 mb-6">
              <button
                className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 border-0 text-white text-sm font-bold cursor-pointer hover:opacity-90 shadow-sm"
                onClick={() => setShowForm(!showForm)}
              >
                {showForm ? "✕ Cancel Request" : "+ File New Leave"}
              </button>
            </div>
          )}

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
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setFormData({
                        ...formData,
                        fromDate: "",
                        toDate: "",
                        reason: "",
                      });
                      setFormError("");
                    }}
                    className="px-6 py-2.5 rounded-lg bg-gray-200 border-0 text-gray-700 text-sm font-bold cursor-pointer hover:bg-gray-300 shadow-sm"
                  >
                    Cancel
                  </button>
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

          {/* Confirmation Modal */}
          {confirmAction && confirmAction.type === "leave" && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
              <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                <h2 className="m-0 text-lg font-semibold text-gray-900 mb-4">
                  Confirm Leave Application
                </h2>
                <div className="mb-6 space-y-3 text-sm">
                  <div>
                    <p className="m-0 text-gray-600 font-medium">Leave Type:</p>
                    <p className="m-0 text-gray-900 font-semibold">
                      {confirmAction.leaveType}
                    </p>
                  </div>
                  <div>
                    <p className="m-0 text-gray-600 font-medium">From Date:</p>
                    <p className="m-0 text-gray-900 font-semibold">
                      {new Date(confirmAction.fromDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="m-0 text-gray-600 font-medium">To Date:</p>
                    <p className="m-0 text-gray-900 font-semibold">
                      {new Date(confirmAction.toDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <p className="m-0 text-sm text-gray-600 mb-6">
                  Are you sure you want to submit this leave application?
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => setConfirmAction(null)}
                    className="px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-medium cursor-pointer hover:bg-gray-50 shadow-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      submitLeaveMutation.mutate({
                        emp_id: formData.emp_id,
                        leave_type: formData.leaveType,
                        date_from: formData.fromDate,
                        date_to: formData.toDate,
                        priority: formData.priority,
                        supervisor_remarks: formData.reason,
                      });
                      setConfirmAction(null);
                    }}
                    className="px-4 py-2.5 rounded-lg bg-green-600 border-0 text-white text-sm font-medium cursor-pointer hover:bg-green-700 shadow-sm"
                  >
                    Submit Application
                  </button>
                </div>
              </div>
            </div>
          )}

          {reviewConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-lg">
                <h2 className="m-0 mb-2 text-lg font-semibold text-gray-900">
                  {reviewConfirm.status === "Denied"
                    ? "Confirm Denial"
                    : "Confirm Approval"}
                </h2>
                <p className="m-0 mb-4 text-sm text-gray-600">
                  {reviewConfirm.item.first_name} {reviewConfirm.item.last_name}
                  {reviewConfirm.module === "resignation"
                    ? ` • ${reviewConfirm.item.resignation_type} • Effective ${reviewConfirm.item.effective_date ? new Date(reviewConfirm.item.effective_date).toLocaleDateString() : "N/A"}`
                    : ` • ${new Date(reviewConfirm.item.date_from).toLocaleDateString()} - ${new Date(reviewConfirm.item.date_to).toLocaleDateString()}`}
                </p>

                <p className="m-0 mb-4 text-sm text-gray-700">
                  Are you sure you want to {reviewConfirm.status.toLowerCase()}{" "}
                  this {reviewConfirm.module} request?
                </p>

                {reviewConfirm.module === "leave" &&
                  reviewConfirm.status === "Approved" &&
                  reviewConfirm.isMultiDay && (
                    <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
                      <p className="m-0 mb-2 text-xs font-bold uppercase tracking-wider text-amber-800">
                        Multi-day request: select specific days to approve
                      </p>
                      <div className="grid max-h-40 grid-cols-2 gap-2 overflow-y-auto pr-1">
                        {getDateRangeInclusive(
                          reviewConfirm.item.date_from,
                          reviewConfirm.item.date_to,
                        ).map((date) => (
                          <label
                            key={date}
                            className="flex cursor-pointer items-center gap-2 rounded-md border border-amber-200 bg-white px-2 py-1.5 text-xs text-gray-700"
                          >
                            <input
                              type="checkbox"
                              checked={(
                                reviewConfirm.selectedDates || []
                              ).includes(date)}
                              onChange={() => toggleLeaveApprovedDate(date)}
                            />
                            <span>{new Date(date).toLocaleDateString()}</span>
                          </label>
                        ))}
                      </div>
                      <p className="m-0 mt-2 text-xs font-semibold text-amber-800">
                        Selected: {(reviewConfirm.selectedDates || []).length}{" "}
                        day(s)
                      </p>
                    </div>
                  )}

                {reviewConfirm.module === "offset" &&
                  reviewConfirm.status === "Approved" &&
                  reviewConfirm.isMultiDay && (
                    <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
                      <p className="m-0 mb-2 text-xs font-bold uppercase tracking-wider text-amber-800">
                        Multi-day request: set approved days
                      </p>
                      <input
                        type="number"
                        min="0.5"
                        step="0.5"
                        max={Number(reviewConfirm.item.days_applied || 0)}
                        value={reviewConfirm.approvedDays}
                        onChange={(e) =>
                          setReviewConfirm({
                            ...reviewConfirm,
                            approvedDays: e.target.value,
                          })
                        }
                        className="w-full rounded-md border border-amber-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      <p className="m-0 mt-2 text-xs text-amber-800">
                        Requested:{" "}
                        {Number(reviewConfirm.item.days_applied || 0).toFixed(
                          2,
                        )}{" "}
                        day(s)
                      </p>
                    </div>
                  )}

                <div className="mb-5">
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">
                    Remarks (optional)
                  </label>
                  <textarea
                    rows={3}
                    value={reviewConfirm.remarks}
                    onChange={(e) =>
                      setReviewConfirm({
                        ...reviewConfirm,
                        remarks: e.target.value,
                      })
                    }
                    className="w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Add remarks for this decision"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewConfirm(null)}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={submitReviewDecision}
                    disabled={
                      reviewLeaveMutation.isPending ||
                      reviewOffsetMutation.isPending ||
                      reviewResignationMutation.isPending
                    }
                    className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${reviewConfirm.status === "Denied" ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"} disabled:opacity-50`}
                  >
                    {reviewConfirm.status === "Denied"
                      ? "Confirm Denial"
                      : "Confirm Approval"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* PERMANENT CALENDAR VIEW */}
          <LeaveCalendar
            leaves={currentUser?.role === "RankAndFile" ? myLeaves : leaves}
            attendance={myAttendance}
          />
        </div>
      )}

      {/* OFFSET TAB */}
      {activeTab === "offset" && currentUser?.role !== "Admin" && (
        <div>
          {isApprover && (
            <div className="mb-4 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
                <h3 className="m-0 text-sm font-bold text-gray-900">
                  Pending Offset Approval Requests
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-gray-200 bg-white">
                      <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                        Employee
                      </th>
                      <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                        Date Range
                      </th>
                      <th className="px-4 py-2.5 text-center text-[11px] font-bold uppercase tracking-wider text-gray-500">
                        Days
                      </th>
                      <th className="px-4 py-2.5 text-right text-[11px] font-bold uppercase tracking-wider text-gray-500">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pendingOffsetApprovals.length === 0 ? (
                      <tr>
                        <td
                          colSpan="4"
                          className="px-4 py-6 text-center text-sm font-medium text-gray-500"
                        >
                          No pending offset requests for your approval.
                        </td>
                      </tr>
                    ) : (
                      pendingOffsetApprovals.map((item) => (
                        <tr
                          key={item.id}
                          className="transition-colors hover:bg-gray-50/50"
                        >
                          <td className="px-4 py-2.5 text-sm font-semibold text-gray-800">
                            {item.first_name} {item.last_name}
                          </td>
                          <td className="px-4 py-2.5 text-sm text-gray-700">
                            {new Date(item.date_from).toLocaleDateString()} -{" "}
                            {new Date(item.date_to).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-2.5 text-center text-sm font-bold text-indigo-700">
                            {Number(item.days_applied || 0).toFixed(2)}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <div className="inline-flex gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  openOffsetDecisionConfirm(item, "Approved")
                                }
                                disabled={reviewOffsetMutation.isPending}
                                className="rounded-md border border-green-200 bg-green-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-green-700 hover:bg-green-200 disabled:opacity-50"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  openOffsetDecisionConfirm(item, "Denied")
                                }
                                disabled={reviewOffsetMutation.isPending}
                                className="rounded-md border border-red-200 bg-red-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-red-700 hover:bg-red-200 disabled:opacity-50"
                              >
                                Deny
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
          )}

          <div className="mb-4 rounded-xl border border-indigo-100 bg-indigo-50 p-4 shadow-sm">
            <h3 className="m-0 mb-3 border-b border-indigo-200 pb-2 text-sm font-bold text-indigo-900">
              Monthly Offset Balance
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
              <div className="rounded-lg border border-indigo-50 bg-white p-2.5 text-center shadow-sm">
                <p className="mb-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-indigo-600">
                  Working Days
                </p>
                <p className="text-lg font-black text-indigo-900">
                  {Number(offsetBalance.workingDaysCompleted || 0).toFixed(1)}
                </p>
              </div>
              <div className="rounded-lg border border-indigo-50 bg-white p-2.5 text-center shadow-sm">
                <p className="mb-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-indigo-600">
                  Baseline
                </p>
                <p className="text-lg font-black text-indigo-900">
                  {offsetBalance.baselineDays || 22}
                </p>
              </div>
              <div className="rounded-lg border border-indigo-50 bg-white p-2.5 text-center shadow-sm">
                <p className="mb-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-green-600">
                  Earned Offsets
                </p>
                <p className="text-lg font-black text-green-700">
                  +{Number(offsetBalance.offsetEarned || 0).toFixed(2)}
                </p>
              </div>
              <div className="rounded-lg border border-indigo-50 bg-white p-2.5 text-center shadow-sm">
                <p className="mb-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-purple-600">
                  End Balance
                </p>
                <p className="text-lg font-black text-purple-700">
                  {Number(offsetBalance.finalBalance || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="mb-4 flex items-center gap-3">
            <button
              onClick={() => setShowForm(!showForm)}
              className="cursor-pointer rounded-lg border-0 bg-gradient-to-r from-purple-600 to-purple-700 px-4 py-2 text-xs font-bold text-white shadow-sm hover:opacity-90"
            >
              {showForm ? "✕ Cancel Request" : "+ File Offset Request"}
            </button>
          </div>

          {showForm && (
            <div className="mb-6 animate-in rounded-xl border border-gray-200 bg-white p-4 shadow-sm fade-in slide-in-from-top-2 duration-200">
              <h3 className="m-0 mb-3 border-b border-gray-100 pb-2 text-base font-bold text-gray-900">
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
                className="grid grid-cols-1 gap-3 md:grid-cols-3"
              >
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
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
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    To Date
                  </label>
                  <input
                    type="date"
                    required
                    value={offsetForm.date_to}
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                    onChange={(e) =>
                      setOffsetForm({ ...offsetForm, date_to: e.target.value })
                    }
                    min={offsetForm.date_from}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
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
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="col-span-full mt-1 flex justify-end gap-2">
                  <button
                    type="submit"
                    disabled={fileOffsetMutation.isPending}
                    className="cursor-pointer rounded-md border-0 bg-green-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-green-700 disabled:opacity-50"
                  >
                    {fileOffsetMutation.isPending
                      ? "Filing..."
                      : "Submit Request"}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
              <h3 className="m-0 text-base font-bold text-gray-900">
                My Offset History
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-gray-200 bg-white">
                    <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      From Date
                    </th>
                    <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      To Date
                    </th>
                    <th className="px-4 py-2.5 text-center text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      Days
                    </th>
                    <th className="px-4 py-2.5 text-right text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {offsetApplications.length === 0 ? (
                    <tr>
                      <td
                        colSpan="4"
                        className="px-4 py-8 text-center text-sm font-medium text-gray-500"
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
                        <td className="px-4 py-2.5 text-sm font-medium text-gray-700">
                          {new Date(oa.date_from).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2.5 text-sm font-medium text-gray-700">
                          {new Date(oa.date_to).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2.5 text-center text-sm font-bold text-indigo-700">
                          {Number(oa.days_applied || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <span
                            className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider ${
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

      {/* RESIGNATION TAB */}
      {activeTab === "resignation" && currentUser?.role !== "Admin" && (
        <div>
          {isApprover && (
            <div className="mb-4 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
                <h3 className="m-0 text-sm font-bold text-gray-900">
                  Pending Resignation Approval Requests
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-gray-200 bg-white">
                      <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                        Employee
                      </th>
                      <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                        Type
                      </th>
                      <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                        Effective Date
                      </th>
                      <th className="px-4 py-2.5 text-right text-[11px] font-bold uppercase tracking-wider text-gray-500">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pendingResignationApprovals.length === 0 ? (
                      <tr>
                        <td
                          colSpan="4"
                          className="px-4 py-6 text-center text-sm font-medium text-gray-500"
                        >
                          No pending resignation requests for your approval.
                        </td>
                      </tr>
                    ) : (
                      pendingResignationApprovals.map((item) => (
                        <tr
                          key={item.id}
                          className="transition-colors hover:bg-gray-50/50"
                        >
                          <td className="px-4 py-2.5 text-sm font-semibold text-gray-800">
                            {item.first_name} {item.last_name}
                          </td>
                          <td className="px-4 py-2.5 text-sm text-gray-700">
                            {item.resignation_type}
                          </td>
                          <td className="px-4 py-2.5 text-sm text-gray-700">
                            {item.effective_date
                              ? new Date(
                                  item.effective_date,
                                ).toLocaleDateString()
                              : "N/A"}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <div className="inline-flex gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  openResignationDecisionConfirm(
                                    item,
                                    "Approved",
                                  )
                                }
                                disabled={reviewResignationMutation.isPending}
                                className="rounded-md border border-green-200 bg-green-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-green-700 hover:bg-green-200 disabled:opacity-50"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  openResignationDecisionConfirm(item, "Denied")
                                }
                                disabled={reviewResignationMutation.isPending}
                                className="rounded-md border border-red-200 bg-red-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-red-700 hover:bg-red-200 disabled:opacity-50"
                              >
                                Deny
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
          )}

          <div className="mb-4 flex items-center gap-3">
            <button
              onClick={() => setShowForm(!showForm)}
              className="cursor-pointer rounded-lg border-0 bg-gradient-to-r from-red-600 to-red-700 px-4 py-2 text-xs font-bold text-white shadow-sm hover:opacity-90"
            >
              {showForm ? "✕ Cancel" : "+ File Resignation"}
            </button>
          </div>

          {showForm && (
            <div className="mb-6 animate-in rounded-xl border border-red-200 bg-white p-4 shadow-sm fade-in slide-in-from-top-2 duration-200">
              <h3 className="m-0 mb-3 border-b border-gray-100 pb-2 text-base font-bold text-gray-900">
                File Notice of Resignation
              </h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (
                    !resignationForm.effective_date ||
                    !resignationForm.reason
                  ) {
                    showToast("Please fill all required fields.", "error");
                    return;
                  }
                  fileResignationMutation.mutate(resignationForm);
                }}
                className="grid grid-cols-1 gap-3 md:grid-cols-2"
              >
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    Resignation Type
                  </label>
                  <select
                    required
                    value={resignationForm.resignation_type}
                    onChange={(e) =>
                      setResignationForm({
                        ...resignationForm,
                        resignation_type: e.target.value,
                      })
                    }
                    className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500"
                  >
                    {resignationTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    Effective Date
                  </label>
                  <input
                    type="date"
                    required
                    value={resignationForm.effective_date}
                    onChange={(e) =>
                      setResignationForm({
                        ...resignationForm,
                        effective_date: e.target.value,
                      })
                    }
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <p className="mt-0.5 text-[0.6rem] font-semibold uppercase text-gray-500">
                    Typically 30 days from today.
                  </p>
                </div>
                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    Reason / Comments
                  </label>
                  <textarea
                    rows="4"
                    required
                    placeholder="Please provide your reason for leaving..."
                    value={resignationForm.reason}
                    onChange={(e) =>
                      setResignationForm({
                        ...resignationForm,
                        reason: e.target.value,
                      })
                    }
                    className="w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div className="md:col-span-2 mt-1 flex justify-end gap-2">
                  <button
                    type="submit"
                    disabled={fileResignationMutation.isPending}
                    className="cursor-pointer rounded-md border-0 bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
                  >
                    {fileResignationMutation.isPending
                      ? "Submitting..."
                      : "Submit Resignation"}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
              <h3 className="m-0 text-base font-bold text-gray-900">
                My Resignation History
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-gray-200 bg-white">
                    <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      Date Filed
                    </th>
                    <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      Effective Date
                    </th>
                    <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      Type
                    </th>
                    <th className="px-4 py-2.5 text-right text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {myResignations.length === 0 ? (
                    <tr>
                      <td
                        colSpan="4"
                        className="px-4 py-8 text-center text-sm font-medium text-gray-500"
                      >
                        You have not filed a resignation.
                      </td>
                    </tr>
                  ) : (
                    myResignations.map((r) => (
                      <tr
                        key={r.id}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-4 py-2.5 text-sm font-medium text-gray-700">
                          {new Date(r.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2.5 text-sm font-medium text-gray-700">
                          {r.effective_date
                            ? new Date(r.effective_date).toLocaleDateString()
                            : "N/A"}
                        </td>
                        <td className="px-4 py-2.5 text-sm font-medium text-gray-800">
                          {r.resignation_type}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <span
                            className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider ${
                              r.status === "Approved"
                                ? "bg-green-100 text-green-700 border border-green-200"
                                : r.status === "Denied"
                                  ? "bg-red-100 text-red-700 border border-red-200"
                                  : "bg-yellow-100 text-yellow-700 border border-yellow-200"
                            }`}
                          >
                            {r.status}
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
