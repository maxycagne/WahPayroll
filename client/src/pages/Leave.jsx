import { useState, useEffect } from "react";
import { URL } from "../assets/constant";

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

// --- UPDATED CALENDAR COMPONENT ---
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

  // Now color-coded by STATUS instead of Leave Type
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

  // We no longer filter out 'Denied' leaves so they show up on the calendar in Red
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
      {/* Updated Legend */}
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

          // Get the status of the first leave on this day to color the cell
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
                    {/* Explicitly Show Approve/Deny/Pending inside the cell */}
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
  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [formData, setFormData] = useState({
    emp_id: "",
    leaveType: "Birthday Leave",
    fromDate: "",
    toDate: "",
    reason: "",
    priority: "Low",
  });
  const [formError, setFormError] = useState("");

  const fetchLeaves = async () => {
    try {
      const res = await fetch(`${URL}/api/employees/leaves`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "69420",
        },
      });
      const data = await res.json();
      setLeaves(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch(`${URL}/api/employees`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "69420",
        },
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setEmployees(data);
        if (data.length > 0)
          setFormData((prev) => ({ ...prev, emp_id: data[0].emp_id }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLeaves();
    fetchEmployees();
  }, []);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const res = await fetch(`${URL}/api/employees/leaves/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) fetchLeaves();
    } catch (error) {
      console.error("Error updating status", error);
    }
  };

  const handleSubmitLeave = async (e) => {
    e.preventDefault();
    if (!formData.emp_id || !formData.fromDate || !formData.toDate) {
      setFormError("Please fill all required fields.");
      return;
    }

    try {
      const res = await fetch(`${URL}/api/employees/leaves`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "69420",
        },
        body: JSON.stringify({
          emp_id: formData.emp_id,
          leave_type: formData.leaveType,
          date_from: formData.fromDate,
          date_to: formData.toDate,
          priority: formData.priority,
          supervisor_remarks: formData.reason,
        }),
      });

      if (res.ok) {
        alert("Leave application submitted successfully!");
        setShowForm(false);
        fetchLeaves();
        setFormData({ ...formData, fromDate: "", toDate: "", reason: "" });
      } else {
        const data = await res.json();
        setFormError(data.message || "Failed to submit leave");
      }
    } catch (error) {
      console.error(error);
      setFormError("Server error occurred.");
    }
  };

  // --- Form Logic Helpers ---
  const handleLeaveTypeChange = (e) => {
    const newLeaveType = e.target.value;

    // If Birthday Leave, auto copy the fromDate to toDate if it exists. Otherwise clear.
    const newToDate =
      newLeaveType === "Birthday Leave" && formData.fromDate
        ? formData.fromDate
        : "";

    setFormData({
      ...formData,
      leaveType: newLeaveType,
      toDate: newToDate,
    });
    setFormError("");
  };

  const handleFromDateChange = (e) => {
    const newFromDate = e.target.value;

    // If Birthday Leave, toDate matches fromDate. Otherwise leave empty for user to pick.
    const newToDate =
      formData.leaveType === "Birthday Leave" ? newFromDate : "";

    setFormData({
      ...formData,
      fromDate: newFromDate,
      toDate: newToDate,
    });
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
      if (startDate.getDay() !== 0 && startDate.getDay() !== 6) {
        daysAdded++;
      }
    }
    return startDate.toISOString().split("T")[0];
  };

  const isToDateDisabled = formData.leaveType === "Birthday Leave";

  if (loading)
    return <div className="p-6 font-bold">Loading Leave Data...</div>;

  return (
    <div className="max-w-full">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <h1 className="m-0 text-[1.4rem] font-bold text-gray-900">
          Leave Applications
        </h1>
        <div className="flex items-center gap-3">
          <button
            className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-semibold cursor-pointer text-gray-700 hover:bg-gray-50 transition-colors"
            onClick={() => {
              setShowCalendar(!showCalendar);
              if (showForm) setShowForm(false);
            }}
          >
            {showCalendar ? "✕ Close Calendar" : "📅 View Calendar"}
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 border-0 text-white text-sm font-semibold cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => {
              setShowForm(!showForm);
              if (showCalendar) setShowCalendar(false);
            }}
          >
            {showForm ? "✕ Close" : "+ File Leave"}
          </button>
        </div>
      </div>

      {showCalendar && <LeaveCalendar leaves={leaves} />}

      {showForm && (
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
            <div className="flex flex-col gap-2 md:col-span-3">
              <label className="text-sm font-semibold text-gray-700">
                Employee
              </label>
              <select
                value={formData.emp_id}
                onChange={(e) =>
                  setFormData({ ...formData, emp_id: e.target.value })
                }
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-purple-500"
              >
                {employees.map((emp) => (
                  <option key={emp.emp_id} value={emp.emp_id}>
                    {emp.emp_id} - {emp.first_name} {emp.last_name}
                  </option>
                ))}
              </select>
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
                Max: {leavePolicy[formData.leaveType]?.maxDays} business day(s)
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
              <label className="text-sm font-semibold text-gray-700">To</label>
              <input
                type="date"
                required
                value={formData.toDate}
                onChange={handleToDateChange}
                disabled={isToDateDisabled}
                max={getMaxToDate()}
                min={formData.fromDate}
                className={`px-4 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-purple-500 ${
                  isToDateDisabled
                    ? "bg-gray-100 cursor-not-allowed text-gray-500"
                    : ""
                }`}
              />
              {isToDateDisabled && (
                <p className="text-xs text-gray-500">Auto-set to same day</p>
              )}
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
                onClick={() => {
                  setShowForm(false);
                  setFormError("");
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 border-0 text-white text-sm font-semibold cursor-pointer hover:opacity-90"
              >
                Submit
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Requests Table */}
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
                <th className="px-6 py-3 font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
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
                  <td className="px-6 py-3 text-sm">
                    {l.status === "Pending" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateStatus(l.id, "Approved")}
                          className="px-3 py-1 rounded-lg bg-green-100 text-green-700 text-xs font-semibold cursor-pointer hover:bg-green-200 border-0"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(l.id, "Denied")}
                          className="px-3 py-1 rounded-lg bg-red-100 text-red-700 text-xs font-semibold cursor-pointer hover:bg-red-200 border-0"
                        >
                          Deny
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
