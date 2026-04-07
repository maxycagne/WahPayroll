import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import mammoth from "mammoth";
import { apiFetch } from "../lib/api";
import Toast from "../components/Toast";
import { useEmail } from "../hooks/useEmail";
import { useToast } from "../hooks/useToast";

const leaveTypes = [
  "Birthday Leave",
  "Vacation Leave",
  "Sick Leave",
  "PGT Leave",
  "Offset", // ADDED: Offset as a leave type
];

const resignationReasonOptions = [
  "Family and/or personal reasons",
  "Better career opportunity",
  "Pregnancy",
  "Poor health / physical disability",
  "Relocation to another city/country",
  "Termination",
  "Dissatisfaction with salary/allowances",
  "Dissatisfaction with type of work",
  "Conflict with employees/supervisor/manager",
  "Others",
];

const exitInterviewQuestions = [
  "What caused you to start looking for a new job?",
  "Why have you decided to leave the company?",
  "Was a single event responsible for your decision to leave?",
  "What does your new company offer that influenced your decision?",
  "What do you value about this company?",
  "What did you dislike about the company?",
  "How was your relationship with your manager?",
  "What could your supervisor improve in their management style?",
  "What did you like most about your job?",
  "What did you dislike about your job? What would you change?",
  "Did you have the resources and support needed to do your job? If not, what was missing?",
  "Were your goals clear and expectations well defined?",
  "Did you receive adequate feedback on your performance?",
  "Did you feel aligned with the company’s mission and goals?",
  "Any recommendations regarding compensation, benefits, or recognition?",
  "What would make you consider returning? Would you recommend this company to others?",
];

const resignationStepLabels = [
  "Resignation Letter",
  "Employee Resignation Form",
  "Exit Interview Form",
  "Endorsement Form",
  "Submit Application",
];

function safeText(value) {
  const text = String(value || "").trim();
  const lowered = text.toLowerCase();
  if (!text) return "";
  if (
    lowered === "undefined" ||
    lowered === "null" ||
    lowered === "undefined undefined" ||
    lowered === "null null"
  ) {
    return "";
  }
  return text;
}

function toDateInputValue(value) {
  const normalized = safeText(value);
  if (!normalized) return "";
  return normalized.slice(0, 10);
}

function buildEmployeeDisplayName(currentUser) {
  const name = safeText(currentUser?.name);
  if (name) return name;
  return safeText(
    `${safeText(currentUser?.first_name)} ${safeText(currentUser?.last_name)}`,
  );
}

function getDefaultResignationWizardState(currentUser) {
  const today = new Date().toISOString().slice(0, 10);
  return {
    resignation_letter: "",
    request_date: today,
    recipient_name: "Supervisor",
    recipient_emp_id: "",
    employee_name: buildEmployeeDisplayName(currentUser) || "Employee",
    position: safeText(currentUser?.position) || "N/A",
    designation: safeText(currentUser?.designation) || "N/A",
    hired_date: toDateInputValue(currentUser?.hired_date),
    resignation_date: "",
    last_working_day: "",
    leaving_reasons: [],
    leaving_reason_other: "",
    interview_answers: Array(16).fill(""),
    endorsement_file_key: "",
    endorsement_file_name: "",
  };
}

function parseDateOnly(value) {
  if (value instanceof Date)
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  const raw = String(value || "").trim();
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    const [, y, m, d] = match;
    return new Date(Number(y), Number(m) - 1, Number(d));
  }
  const parsed = new Date(raw);
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

function isInRange(date, from, to) {
  const d = parseDateOnly(date).getTime();
  const f = parseDateOnly(from).getTime();
  const t = parseDateOnly(to).getTime();
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
  const from = parseDateOnly(start).getTime();
  const to = parseDateOnly(end).getTime();
  return Math.floor((to - from) / (1000 * 60 * 60 * 24)) + 1;
}

function getDateRangeInclusive(start, end) {
  const dates = [];
  const current = parseDateOnly(start);
  const to = parseDateOnly(end);

  while (current <= to) {
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, "0");
    const day = String(current.getDate()).padStart(2, "0");
    dates.push(`${year}-${month}-${day}`);
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

function getOffsetRequestedDays(item) {
  const rawDays = Number(item?.days_applied);
  if (!Number.isNaN(rawDays) && rawDays > 0) {
    return rawDays;
  }

  const fromDate = item?.date_from;
  const toDate = item?.date_to || fromDate;
  const inferredDays = getDateDiffInclusive(fromDate, toDate);
  return inferredDays > 0 ? inferredDays : 1;
}

const leavePolicy = {
  "Birthday Leave": { maxDays: 1, excludeWeekends: true },
  "Vacation Leave": { maxDays: 20, excludeWeekends: true },
  "Sick Leave": { maxDays: 10, excludeWeekends: true },
  "PGT Leave": { maxDays: 20, excludeWeekends: true },
  "Job Order MAC Leave": { maxDays: 12, excludeWeekends: true },
  Offset: { maxDays: 999, excludeWeekends: false }, // Prevent maxDays error for offsets
};

const badgeClass = {
  Approved: "bg-green-100 text-green-800",
  Denied: "bg-red-100 text-red-800",
  Pending: "bg-yellow-100 text-yellow-800",
  "Pending Approval": "bg-yellow-100 text-yellow-800",
  "Cancellation Requested": "bg-amber-100 text-amber-800",
  Rejected: "bg-red-100 text-red-800",
  "Partially Approved": "bg-amber-100 text-amber-800",
};

function isFutureDateString(dateValue) {
  if (!dateValue) return false;
  const target = new Date(dateValue);
  if (Number.isNaN(target.getTime())) return false;
  target.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return target > today;
}

// --- CALENDAR COMPONENT ---
function LeaveCalendar({
  leaves,
  attendance,
  scopeOptions = [],
  activeScope,
  onScopeChange,
}) {
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

  function normalizeDateString(value) {
    if (!value) return null;
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  function parseApprovedDates(raw) {
    if (!raw) return [];

    let parsed = raw;
    if (typeof raw === "string") {
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = [];
      }
    }

    if (!Array.isArray(parsed)) return [];

    return parsed.map((item) => normalizeDateString(item)).filter(Boolean);
  }

  function getLeaveDateStatus(leave, dateStr) {
    const requestStatus = leave.status || "Pending";

    if (requestStatus === "Approved") return "Approved";
    if (requestStatus === "Denied") return "Denied";
    if (requestStatus === "Pending") return "Pending";

    if (requestStatus === "Partially Approved") {
      const approvedSet = new Set(parseApprovedDates(leave.approved_dates));
      if (approvedSet.size === 0) return "Pending";
      return approvedSet.has(dateStr) ? "Approved" : "Denied";
    }

    return "Pending";
  }

  function getLeavesForDate(dateStr) {
    return leaves
      .filter((l) => isInRange(dateStr, l.date_from, l.date_to))
      .map((leave) => ({
        ...leave,
        calendar_status: getLeaveDateStatus(leave, dateStr),
      }));
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
  const selectedAttendance = selectedDateStr
    ? getAttendanceForDate(selectedDateStr)
    : null;

  return (
    <div className="mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-sky-600 px-4 py-3 text-white">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="m-0 text-base font-bold">Applications Calendar</h4>
            <p className="m-0 mt-1 text-xs text-white/90">
              View leave applications and attendance logs by day.
            </p>
          </div>
          {scopeOptions.length > 1 && (
            <div className="inline-flex rounded-lg border border-white/25 bg-white/10 p-1">
              {scopeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onScopeChange?.(option.value)}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                    activeScope === option.value
                      ? "bg-white text-indigo-700"
                      : "text-white hover:bg-white/15"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-slate-50 p-4">
        <div className="mb-3 flex items-center justify-between">
          <button
            className="cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
            onClick={prevMonth}
          >
            ◀ Prev
          </button>
          <h3 className="m-0 text-base font-bold text-slate-800">
            {monthName}
          </h3>
          <button
            className="cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
            onClick={nextMonth}
          >
            Next ▶
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div
              key={d}
              className="rounded-lg bg-slate-100 py-1.5 text-center text-[11px] font-bold uppercase tracking-wide text-slate-500"
            >
              {d}
            </div>
          ))}
          {cells.map((day, i) => {
            if (day === null)
              return <div key={"e" + i} className="min-h-[90px]" />;

            const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`;
            const dayLeaves = getLeavesForDate(dateStr);
            const dayAtt = getAttendanceForDate(dateStr);
            const isSelected = day === selectedDate;
            const visibleLeaves = dayLeaves.slice(0, 3);
            const extraLeavesCount = Math.max(
              dayLeaves.length - visibleLeaves.length,
              0,
            );

            const firstLeaveStatus =
              dayLeaves.length > 0 ? dayLeaves[0].calendar_status : null;
            const colorConfig = firstLeaveStatus
              ? statusColors[firstLeaveStatus]
              : null;

            return (
              <button
                key={i}
                type="button"
                className={`relative flex min-h-[90px] cursor-pointer flex-col items-start justify-start rounded-xl p-2 text-left transition-all duration-150 ${
                  dayLeaves.length > 0 && !isSelected
                    ? colorConfig?.border + " " + colorConfig?.bg
                    : "border border-slate-200 bg-white"
                } ${isSelected ? "z-10 border-slate-900 bg-slate-900 text-white shadow-md" : "hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-sm"}`}
                onClick={() => setSelectedDate(day)}
              >
                <span
                  className={`mb-0.5 text-xs font-bold ${isSelected ? "text-white" : "text-slate-900"}`}
                >
                  {day}
                </span>

                <div className="mt-0.5 flex w-full flex-col gap-1">
                  {dayAtt && dayAtt.status !== "On Leave" && (
                    <span
                      className={`flex w-fit rounded-md px-1.5 py-0.5 text-[0.55rem] font-bold uppercase tracking-wider ${isSelected ? "bg-white/20 text-white" : attendanceColors[dayAtt.status] || "bg-gray-100 text-gray-600"}`}
                    >
                      {dayAtt.status}
                    </span>
                  )}
                  {visibleLeaves.map((leave) => (
                    <div
                      key={leave.id}
                      className="mt-0.5 flex w-full flex-col gap-0.5 border-t border-gray-100/50 pt-0.5 text-left"
                    >
                      <span
                        className={`truncate text-[0.6rem] font-bold leading-tight ${isSelected ? "text-white" : "text-purple-800"}`}
                      >
                        {leave.first_name} {leave.last_name}
                      </span>
                      <span
                        className={`truncate text-[0.55rem] font-semibold leading-tight ${isSelected ? "text-white/90" : "text-gray-600"}`}
                      >
                        {leave.leave_type}
                      </span>
                      <span
                        className={`truncate text-[0.55rem] font-semibold uppercase ${isSelected ? "text-purple-200" : statusColors[leave.calendar_status]?.text}`}
                      >
                        • {leave.calendar_status}
                      </span>
                    </div>
                  ))}
                  {extraLeavesCount > 0 && (
                    <span
                      className={`mt-0.5 inline-flex w-fit rounded-md px-1.5 py-0.5 text-[0.55rem] font-bold uppercase tracking-wider ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      +{extraLeavesCount} more
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {selectedDate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4"
          onClick={() => setSelectedDate(null)}
        >
          <div
            className="w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-slate-900 to-slate-700 px-5 py-4 text-white">
              <div>
                <h4 className="m-0 text-base font-bold">Date Details</h4>
                <p className="m-0 mt-1 text-xs text-slate-200">
                  {new Date(selectedDateStr).toLocaleDateString(undefined, {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDate(null)}
                className="cursor-pointer rounded-md border border-white/30 bg-white/10 px-2.5 py-1 text-sm font-bold text-white hover:bg-white/20"
              >
                Close
              </button>
            </div>

            <div className="max-h-[72vh] overflow-y-auto bg-slate-50 p-5">
              {!selectedAttendance && selectedLeaves.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                  No leave or attendance records found for this date.
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedAttendance && (
                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="m-0 text-sm font-bold text-slate-900">
                            Daily Attendance Record
                          </p>
                          <p className="m-0 mt-1 text-xs text-slate-500">
                            System Log
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${attendanceColors[selectedAttendance.status] || "bg-gray-200 text-gray-800"}`}
                        >
                          {selectedAttendance.status}
                        </span>
                      </div>
                    </div>
                  )}

                  {selectedLeaves.map((l) => (
                    <div
                      key={l.id}
                      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="m-0 text-sm font-bold text-indigo-700">
                            {l.first_name} {l.last_name}
                          </p>
                          <p className="m-0 mt-1 text-sm font-bold text-slate-900">
                            {l.leave_type}{" "}
                            {l.leave_type === "Offset" &&
                              Number(l.days_applied || 0) > 0 &&
                              `(${Number(l.days_applied || 0).toFixed(2)} days)`}
                          </p>
                          <p className="m-0 mt-1 text-xs text-slate-500">
                            {new Date(l.date_from).toLocaleDateString()} to{" "}
                            {new Date(l.date_to).toLocaleDateString()}
                          </p>
                          {l.supervisor_remarks && (
                            <p className="m-0 mt-2 rounded-md border border-slate-200 bg-slate-50 p-2 text-xs italic text-slate-600">
                              "{l.supervisor_remarks}"
                            </p>
                          )}
                        </div>
                        <span
                          className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${badgeClass[l.calendar_status] || "bg-gray-100"}`}
                        >
                          {l.calendar_status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
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
  const normalizedEmploymentStatus = String(currentUser?.status || "")
    .trim()
    .toLowerCase();
  const isJobOrderEmployee = normalizedEmploymentStatus === "job order";

  const [applicationModalOpen, setApplicationModalOpen] = useState(false);
  const [applicationType, setApplicationType] = useState("leave");
  const [myPendingModalOpen, setMyPendingModalOpen] = useState(false);
  const [pendingModalOpen, setPendingModalOpen] = useState(false);
  const [pendingTypeFilter, setPendingTypeFilter] = useState("all");
  const [formError, setFormError] = useState("");
  const [confirmAction, setConfirmAction] = useState(null);
  const [reviewConfirm, setReviewConfirm] = useState(null);
  const [cancelApprovalConfirm, setCancelApprovalConfirm] = useState(null);
  const [cancelPendingConfirm, setCancelPendingConfirm] = useState(null);

  // Unified Form Data
  const [formData, setFormData] = useState({
    emp_id: currentUser?.emp_id || "",
    leaveType: "Birthday Leave",
    fromDate: "",
    toDate: "",
    daysApplied: "", // ADDED: for Offset requests
    reason: "",
    priority: "Low",
  });

  const [resignationStep, setResignationStep] = useState(1);
  const [resignationInterviewPart, setResignationInterviewPart] = useState(1);
  const [resignationWizard, setResignationWizard] = useState(
    getDefaultResignationWizardState(currentUser),
  );
  const [resignationWizardError, setResignationWizardError] = useState("");
  const [isUploadingEndorsement, setIsUploadingEndorsement] = useState(false);
  const [isUploadingClearanceId, setIsUploadingClearanceId] = useState(null);
  const [resignationSupervisorReview, setResignationSupervisorReview] =
    useState(null);
  const [filePreviewOpen, setFilePreviewOpen] = useState(false);
  const [filePreviewLoading, setFilePreviewLoading] = useState(false);
  const [filePreviewTitle, setFilePreviewTitle] = useState("Document Preview");
  const [filePreviewUrl, setFilePreviewUrl] = useState("");
  const [filePreviewHtml, setFilePreviewHtml] = useState("");
  const [filePreviewError, setFilePreviewError] = useState("");
  const previewBlobUrlRef = useRef("");

  const normalizedRole = String(currentUser?.role || "")
    .trim()
    .toLowerCase();
  const isAdminRole = normalizedRole === "admin";
  const isHRRole = normalizedRole === "hr";
  const isSupervisorRole =
    normalizedRole === "supervisor" || normalizedRole.includes("supervisor");
  const [calendarScope, setCalendarScope] = useState(
    isHRRole || isAdminRole ? "overall" : isSupervisorRole ? "team" : "own",
  );
  const isApprover = isHRRole || isSupervisorRole;
  const [hrNoteConfirm, setHrNoteConfirm] = useState(null);

  const isPendingApprovalStatus = (status) => {
    const normalized = String(status || "")
      .trim()
      .toLowerCase();
    return normalized === "pending" || normalized === "pending approval";
  };

  const parseJsonArray = (rawValue) => {
    if (Array.isArray(rawValue)) return rawValue;
    if (rawValue == null) return [];
    if (typeof rawValue === "string") {
      try {
        const parsed = JSON.parse(rawValue);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  const getResignationProgressPercent = (item) => {
    const totalSteps = resignationStepLabels.length;
    const step = Math.max(
      1,
      Math.min(Number(item?.current_step || totalSteps), totalSteps),
    );
    return {
      step,
      percent: Math.round((step / totalSteps) * 100),
      totalSteps,
    };
  };

  const availableLeaveTypes = isJobOrderEmployee
    ? leaveTypes.filter((type) => type !== "PGT Leave")
    : leaveTypes;

  const [hasLoadedResignationDraft, setHasLoadedResignationDraft] =
    useState(false);
  const lastSavedResignationDraftRef = useRef("");

  const { data: resignationRecipient = null } = useQuery({
    queryKey: ["resignation-recipient", currentUser?.emp_id],
    queryFn: async () => {
      const res = await apiFetch("/api/employees/resignations/recipient");
      if (!res.ok) return null;
      return res.json();
    },
    enabled: Boolean(currentUser?.emp_id),
  });

  const { data: resignationDraftData = null } = useQuery({
    queryKey: ["resignation-draft", currentUser?.emp_id],
    queryFn: async () => {
      const res = await apiFetch("/api/employees/resignations/draft");
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(result.message || "Failed to load resignation draft");
      }
      return result?.draft || null;
    },
    enabled:
      Boolean(currentUser?.emp_id) &&
      applicationModalOpen &&
      applicationType === "resignation",
    refetchOnWindowFocus: false,
  });

  const saveResignationDraftMutation = useMutation({
    mutationFn: async ({ payload, step, interviewPart }) => {
      const res = await apiFetch("/api/employees/resignations/draft", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload, step, interviewPart }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(result.message || "Failed to save resignation draft");
      }
      return result;
    },
    onError: (err) =>
      showToast(err.message || "Failed to auto-save draft.", "error"),
  });

  useEffect(() => {
    if (!resignationRecipient) return;
    const recipientName = safeText(resignationRecipient.recipient_name);
    setResignationWizard((prev) => ({
      ...prev,
      request_date: resignationRecipient.request_date || prev.request_date,
      recipient_name: recipientName || prev.recipient_name || "Supervisor",
      recipient_emp_id:
        resignationRecipient.recipient_emp_id || prev.recipient_emp_id,
    }));
  }, [resignationRecipient]);

  useEffect(() => {
    if (!applicationModalOpen || applicationType !== "resignation") {
      setHasLoadedResignationDraft(false);
      return;
    }

    setHasLoadedResignationDraft(false);
  }, [applicationModalOpen, applicationType]);

  useEffect(() => {
    if (!applicationModalOpen || applicationType !== "resignation") return;
    if (hasLoadedResignationDraft) return;

    if (resignationDraftData?.payload) {
      const loadedStep = Number(resignationDraftData.step) || 1;
      const loadedInterviewPart =
        Number(resignationDraftData.interviewPart) || 1;

      setResignationWizard((prev) => ({
        ...prev,
        ...resignationDraftData.payload,
      }));
      setResignationStep(loadedStep);
      setResignationInterviewPart(loadedInterviewPart);
      lastSavedResignationDraftRef.current = JSON.stringify({
        payload: resignationDraftData.payload,
        step: loadedStep,
        interviewPart: loadedInterviewPart,
      });
    }

    setHasLoadedResignationDraft(true);
  }, [
    applicationModalOpen,
    applicationType,
    hasLoadedResignationDraft,
    resignationDraftData,
  ]);

  useEffect(() => {
    if (!applicationModalOpen || applicationType !== "resignation") return;
    if (!hasLoadedResignationDraft) return;

    const draftPayload = {
      payload: resignationWizard,
      step: resignationStep,
      interviewPart: resignationInterviewPart,
    };
    const draftSignature = JSON.stringify(draftPayload);

    if (lastSavedResignationDraftRef.current === draftSignature) return;

    const timer = setTimeout(() => {
      saveResignationDraftMutation.mutate(draftPayload, {
        onSuccess: () => {
          lastSavedResignationDraftRef.current = draftSignature;
        },
      });
    }, 400);

    return () => clearTimeout(timer);
  }, [
    applicationModalOpen,
    applicationType,
    hasLoadedResignationDraft,
    resignationWizard,
    resignationStep,
    resignationInterviewPart,
    saveResignationDraftMutation,
  ]);

  // --- QUERIES ---
  const { data: leaves = [], isLoading: isLoadingLeaves } = useQuery({
    queryKey: ["leaves"],
    queryFn: async () => {
      const res = await apiFetch("/api/employees/leaves");
      if (!res.ok) throw new Error("Failed to fetch leaves");
      return res.json();
    },
  });

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
        if (!res.ok) return [];
        return result;
      },
    });

  const myOwnResignations = myResignations.filter(
    (r) => String(r.emp_id) === String(currentUser?.emp_id),
  );

  // --- UNIFIED CALENDAR DATA ---
  // Merge Leaves and Offsets so they both show on the calendar view
  const myLeaves = leaves.filter((l) => l.emp_id === currentUser?.emp_id);
  const myOffsets = offsetApplications.filter(
    (o) => o.emp_id === currentUser?.emp_id,
  );

  const myPendingRequests = [
    ...myLeaves
      .filter((l) => isPendingApprovalStatus(l.status))
      .map((l) => ({
        ...l,
        request_group: "leave",
        unified_type: l.leave_type,
      })),
    ...myOffsets
      .filter((o) => isPendingApprovalStatus(o.status))
      .map((o) => ({
        ...o,
        request_group: "offset",
        unified_type: "Offset",
      })),
    ...myOwnResignations
      .filter((r) => isPendingApprovalStatus(r.status))
      .map((r) => ({
        ...r,
        request_group: "resignation",
        unified_type: r.resignation_type || "Resignation",
      })),
  ].sort(
    (a, b) =>
      new Date(b.created_at || 0).getTime() -
      new Date(a.created_at || 0).getTime(),
  );

  const myApprovedFutureRequests = [
    ...myLeaves
      .filter(
        (l) =>
          ["Approved", "Partially Approved"].includes(l.status) &&
          !l.cancellation_requested_at &&
          isFutureDateString(l.date_from),
      )
      .map((l) => ({
        ...l,
        request_group: "leave",
        unified_type: l.leave_type,
      })),
    ...myOffsets
      .filter(
        (o) =>
          ["Approved", "Partially Approved"].includes(o.status) &&
          !o.cancellation_requested_at &&
          isFutureDateString(o.date_from),
      )
      .map((o) => ({
        ...o,
        request_group: "offset",
        unified_type: "Offset",
      })),
    ...myOwnResignations
      .filter(
        (r) =>
          r.status === "Approved" &&
          !r.cancellation_requested_at &&
          isFutureDateString(r.effective_date),
      )
      .map((r) => ({
        ...r,
        request_group: "resignation",
        unified_type: r.resignation_type || "Resignation",
      })),
  ].sort(
    (a, b) =>
      new Date(b.created_at || 0).getTime() -
      new Date(a.created_at || 0).getTime(),
  );

  const myCancellationRequestsPending = [
    ...myLeaves
      .filter((l) => Boolean(l.cancellation_requested_at))
      .map((l) => ({
        ...l,
        request_group: "leave",
        unified_type: l.leave_type,
      })),
    ...myOffsets
      .filter((o) => Boolean(o.cancellation_requested_at))
      .map((o) => ({
        ...o,
        request_group: "offset",
        unified_type: "Offset",
      })),
    ...myOwnResignations
      .filter((r) => Boolean(r.cancellation_requested_at))
      .map((r) => ({
        ...r,
        request_group: "resignation",
        unified_type: r.resignation_type || "Resignation",
      })),
  ].sort(
    (a, b) =>
      new Date(b.cancellation_requested_at || b.created_at || 0).getTime() -
      new Date(a.cancellation_requested_at || a.created_at || 0).getTime(),
  );

  const myRequestRows = [
    ...myPendingRequests.map((item) => ({
      ...item,
      row_action: "cancel_pending",
      row_status: item.status,
    })),
    ...myApprovedFutureRequests.map((item) => ({
      ...item,
      row_action: "request_cancel_approval",
      row_status: item.status,
    })),
    ...myCancellationRequestsPending.map((item) => ({
      ...item,
      row_action: "cancel_waiting_approval",
      row_status: "Cancellation Requested",
    })),
  ].sort(
    (a, b) =>
      new Date(
        b.cancellation_requested_at || b.updated_at || b.created_at || 0,
      ).getTime() -
      new Date(
        a.cancellation_requested_at || a.updated_at || a.created_at || 0,
      ).getTime(),
  );

  const myRequestHistory = [
    ...myLeaves.map((l) => ({
      id: `leave-${l.id}`,
      request_type: l.leave_type,
      schedule: `${new Date(l.date_from).toLocaleDateString()} - ${new Date(l.date_to).toLocaleDateString()}`,
      filed_at: l.created_at,
      final_status: l.cancellation_requested_at
        ? "Cancellation Requested"
        : l.status,
    })),
    ...myOffsets.map((o) => ({
      id: `offset-${o.id}`,
      request_type:
        Number(o.days_applied || 0) > 0
          ? `Offset (${Number(o.days_applied || 0).toFixed(2)} days)`
          : "Offset",
      schedule: `${new Date(o.date_from).toLocaleDateString()} - ${new Date(o.date_to).toLocaleDateString()}`,
      filed_at: o.created_at,
      final_status: o.cancellation_requested_at
        ? "Cancellation Requested"
        : o.status,
    })),
    ...myOwnResignations.map((r) => ({
      id: `resignation-${r.id}`,
      request_type: `Resignation - ${r.resignation_type || "Resignation"}`,
      schedule: r.effective_date
        ? new Date(r.effective_date).toLocaleDateString()
        : "N/A",
      filed_at: r.created_at,
      final_status: r.cancellation_requested_at
        ? "Cancellation Requested"
        : r.status,
    })),
  ].sort(
    (a, b) =>
      new Date(b.filed_at || 0).getTime() - new Date(a.filed_at || 0).getTime(),
  );

  const unifiedMyLeaves = [
    ...myLeaves,
    ...myOffsets.map((o) => ({
      ...o,
      leave_type: "Offset",
      first_name: currentUser?.name || currentUser?.first_name,
      last_name: "",
    })),
  ];

  const unifiedAllLeaves = [
    ...leaves,
    ...offsetApplications.map((o) => ({ ...o, leave_type: "Offset" })),
  ];

  const isSupervisorTeamMember = (item) => {
    return String(item?.emp_id) !== String(currentUser?.emp_id);
  };

  const canApproverReviewRecord = (item) => {
    if (!item) return false;
    if (String(item.emp_id) === String(currentUser?.emp_id)) return false;

    const roleValue = String(item.requester_role || "")
      .trim()
      .toLowerCase();

    if (isHRRole) {
      return true;
    }

    if (isAdminRole) {
      return roleValue !== "admin";
    }

    if (isSupervisorRole) {
      return isSupervisorTeamMember(item);
    }

    return false;
  };

  const unifiedTeamLeaves = unifiedAllLeaves.filter((item) =>
    isSupervisorTeamMember(item),
  );

  const calendarScopeOptions = isAdminRole
    ? [{ value: "overall", label: "Overall Calendar" }]
    : isHRRole
      ? [
          { value: "own", label: "Own Calendar" },
          { value: "overall", label: "Overall Calendar" },
        ]
      : isSupervisorRole
        ? [
            { value: "own", label: "Own Calendar" },
            { value: "team", label: "Team Calendar" },
          ]
        : [{ value: "own", label: "Own Calendar" }];

  const calendarLeaves =
    calendarScope === "overall"
      ? unifiedAllLeaves
      : calendarScope === "team"
        ? unifiedTeamLeaves
        : unifiedMyLeaves;

  // --- UNIFIED APPROVAL DATA ---
  // Merge Pending Leaves and Pending Offsets into one single table
  const pendingLeaveApprovals = isApprover
    ? leaves.filter(
        (l) =>
          (isPendingApprovalStatus(l.status) ||
            (l.cancellation_requested_at &&
              ["Approved", "Partially Approved"].includes(l.status))) &&
          canApproverReviewRecord(l),
      )
    : [];

  const pendingOffsetApprovals = isApprover
    ? offsetApplications.filter(
        (oa) =>
          (isPendingApprovalStatus(oa.status) ||
            (oa.cancellation_requested_at &&
              ["Approved", "Partially Approved"].includes(oa.status))) &&
          canApproverReviewRecord(oa),
      )
    : [];

  const unifiedPending = [
    ...pendingLeaveApprovals.map((l) => ({
      ...l,
      unified_type: l.leave_type,
      isOffset: false,
    })),
    ...pendingOffsetApprovals.map((o) => ({
      ...o,
      unified_type: "Offset",
      isOffset: true,
    })),
  ].sort(
    (a, b) =>
      new Date(b.created_at || 0).getTime() -
      new Date(a.created_at || 0).getTime(),
  );

  const pendingResignationApprovals = isApprover
    ? myResignations.filter(
        (r) =>
          (isPendingApprovalStatus(r.status) ||
            (r.cancellation_requested_at && r.status === "Approved")) &&
          canApproverReviewRecord(r),
      )
    : [];

  const allPendingRequests = [
    ...unifiedPending.map((item) => ({
      ...item,
      request_group: "leave_offset",
    })),
    ...pendingResignationApprovals.map((item) => ({
      ...item,
      request_group: "resignation",
      unified_type: item.resignation_type || "Resignation",
      isOffset: false,
    })),
  ].sort(
    (a, b) =>
      new Date(b.created_at || 0).getTime() -
      new Date(a.created_at || 0).getTime(),
  );
  const totalPendingCount = allPendingRequests.length;

  const filteredPendingRequests = allPendingRequests.filter((item) => {
    if (pendingTypeFilter === "all") return true;
    if (pendingTypeFilter === "resignation") {
      return item.request_group === "resignation";
    }
    if (pendingTypeFilter === "offset") {
      return item.request_group === "leave_offset" && item.isOffset;
    }
    if (pendingTypeFilter === "leave") {
      return item.request_group === "leave_offset" && !item.isOffset;
    }
    return true;
  });

  const canHrDirectDecision = (item) => {
    const roleValue = String(item?.requester_role || "")
      .trim()
      .toLowerCase();
    return roleValue === "supervisor";
  };

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
      setApplicationModalOpen(false);
      setFormData({
        ...formData,
        fromDate: "",
        toDate: "",
        reason: "",
        daysApplied: "",
      });
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
      setApplicationModalOpen(false);
      setFormData({
        ...formData,
        fromDate: "",
        toDate: "",
        reason: "",
        daysApplied: "",
      });
    },
    onError: (err) =>
      showToast(err.message || "Failed to file offset.", "error"),
  });

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
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(result.message || "Failed to file resignation");
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["resignations"]);
      queryClient.invalidateQueries(["dashboardSummary"]);
      queryClient.invalidateQueries(["resignation-draft", currentUser?.emp_id]);
      showToast("Resignation filed successfully.");
      setResignationWizard(getDefaultResignationWizardState(currentUser));
      setResignationStep(1);
      setResignationInterviewPart(1);
      setResignationWizardError("");
      lastSavedResignationDraftRef.current = "";
      setApplicationModalOpen(false);
    },
    onError: (err) =>
      showToast(err.message || "Error filing resignation.", "error"),
  });

  const uploadResignationClearanceMutation = useMutation({
    mutationFn: async ({ id, clearance_file_key }) => {
      const res = await apiFetch(
        `/api/employees/resignations/${id}/clearance`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clearance_file_key }),
        },
      );
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(result.message || "Failed to upload clearance form");
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["resignations"]);
      showToast("Clearance form uploaded successfully.");
    },
    onError: (err) =>
      showToast(err.message || "Error uploading clearance form.", "error"),
  });

  const reviewLeaveMutation = useMutation({
    mutationFn: async ({ id, item, ...payload }) => {
      const res = await apiFetch(`/api/employees/leaves/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload), // Only sends status/remarks to backend
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Failed to update leave");
      return result;
    },

    // 2. Trigger email only on successful database update
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(["leaves"]);
      showToast("Leave request updated successfully.");

      handleSendUpdate(
        variables.item,
        variables.status,
        variables.supervisor_remarks,
      );
    },
    onError: (err) =>
      showToast(err.message || "Error updating leave.", "error"),
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
    mutationFn: async ({ id, ...payload }) => {
      const res = await apiFetch(`/api/employees/resignations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
    onError: (err) => showToast(err.message || "Failed to update.", "error"),
  });

  const cancelMyPendingRequestMutation = useMutation({
    mutationFn: async (item) => {
      let endpoint = "";
      if (item.request_group === "leave") {
        endpoint = `/api/employees/leaves/${item.id}/cancel`;
      } else if (item.request_group === "offset") {
        endpoint = `/api/employees/offset-applications/${item.id}/cancel`;
      } else if (item.request_group === "resignation") {
        endpoint = `/api/employees/resignations/${item.id}/cancel`;
      } else {
        throw new Error("Unsupported request type");
      }

      const res = await apiFetch(endpoint, { method: "DELETE" });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || "Failed to cancel request");
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["leaves"]);
      queryClient.invalidateQueries(["offset-applications"]);
      queryClient.invalidateQueries(["resignations"]);
      showToast("Pending request cancelled successfully.");
    },
    onError: (err) =>
      showToast(err.message || "Failed to cancel pending request.", "error"),
  });

  const requestCancellationApprovalMutation = useMutation({
    mutationFn: async ({ item, cancellationReason }) => {
      let endpoint = "";
      if (item.request_group === "leave") {
        endpoint = `/api/employees/leaves/${item.id}/request-cancel`;
      } else if (item.request_group === "offset") {
        endpoint = `/api/employees/offset-applications/${item.id}/request-cancel`;
      } else if (item.request_group === "resignation") {
        endpoint = `/api/employees/resignations/${item.id}/request-cancel`;
      } else {
        throw new Error("Unsupported request type");
      }

      const res = await apiFetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cancellation_reason: cancellationReason }),
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(
          result.message || "Failed to request cancellation approval",
        );
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["leaves"]);
      queryClient.invalidateQueries(["offset-applications"]);
      queryClient.invalidateQueries(["resignations"]);
      showToast("Cancellation request submitted for approval.");
    },
    onError: (err) =>
      showToast(
        err.message || "Failed to submit cancellation request.",
        "error",
      ),
  });

  const addHrNoteMutation = useMutation({
    mutationFn: async ({ module, id, note }) => {
      const res = await apiFetch(
        `/api/employees/pending-requests/${module}/${id}/hr-note`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hr_note: note }),
        },
      );
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || "Failed to save HR note");
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["leaves"]);
      queryClient.invalidateQueries(["offset-applications"]);
      queryClient.invalidateQueries(["resignations"]);
      showToast("HR note saved and supervisors notified.");
    },
    onError: (err) =>
      showToast(err.message || "Failed to save HR note.", "error"),
  });

  const uploadRequiredFile = async (file) => {
    const form = new FormData();
    form.append("requiredFiles", file);

    const res = await apiFetch("/api/file/upload", {
      method: "POST",
      body: form,
    });

    const result = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(result.message || "File upload failed");
    }

    const uploaded = Array.isArray(result.files) ? result.files[0] : null;
    if (!uploaded?.key) {
      throw new Error("Upload succeeded but no file key was returned");
    }

    return uploaded;
  };

  const clearPreviewBlobUrl = () => {
    if (previewBlobUrlRef.current) {
      URL.revokeObjectURL(previewBlobUrlRef.current);
      previewBlobUrlRef.current = "";
    }
  };

  const closeFilePreview = () => {
    clearPreviewBlobUrl();
    setFilePreviewOpen(false);
    setFilePreviewLoading(false);
    setFilePreviewTitle("Document Preview");
    setFilePreviewUrl("");
    setFilePreviewHtml("");
    setFilePreviewError("");
  };

  const renderPreviewFromBlob = async (blob, fileName, mimeType) => {
    const normalizedName = String(fileName || "document").trim();
    const normalizedMime = String(mimeType || blob.type || "").toLowerCase();
    const lowerName = normalizedName.toLowerCase();

    setFilePreviewTitle(normalizedName || "Document Preview");
    setFilePreviewError("");
    setFilePreviewHtml("");
    setFilePreviewUrl("");

    const isDocx =
      lowerName.endsWith(".docx") ||
      normalizedMime.includes(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      );

    const isPdf = lowerName.endsWith(".pdf") || normalizedMime.includes("pdf");

    if (isDocx) {
      const arrayBuffer = await blob.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      setFilePreviewHtml(result.value || "<p>No preview available.</p>");
      return;
    }

    if (isPdf || lowerName.endsWith(".doc")) {
      clearPreviewBlobUrl();
      const objectUrl = URL.createObjectURL(blob);
      previewBlobUrlRef.current = objectUrl;
      setFilePreviewUrl(objectUrl);
      return;
    }

    setFilePreviewError(
      "This file type cannot be previewed inline. Please upload PDF or DOCX.",
    );
  };

  useEffect(() => {
    return () => {
      clearPreviewBlobUrl();
    };
  }, []);

  const openUploadedFileByKey = async (fileKey) => {
    const normalizedKey = String(fileKey || "").trim();
    if (!normalizedKey) return;

    setFilePreviewOpen(true);
    setFilePreviewLoading(true);
    setFilePreviewError("");
    setFilePreviewHtml("");
    setFilePreviewUrl("");

    try {
      const res = await apiFetch(
        `/api/file/get?filename=${encodeURIComponent(normalizedKey)}`,
      );
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(result.message || "Failed to retrieve file link");
      }

      if (result?.base64Content) {
        const base64 = String(result.base64Content || "");
        const mimeType = String(result.mimeType || "application/octet-stream");
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i += 1) {
          bytes[i] = binary.charCodeAt(i);
        }

        const blob = new Blob([bytes], { type: mimeType });
        await renderPreviewFromBlob(
          blob,
          result.fileName || normalizedKey,
          mimeType,
        );
        return;
      }

      if (!result?.url) {
        throw new Error("Failed to retrieve file link");
      }

      const remoteResponse = await fetch(result.url);
      if (!remoteResponse.ok) {
        throw new Error("Failed to load uploaded file for preview");
      }

      const remoteBlob = await remoteResponse.blob();
      await renderPreviewFromBlob(
        remoteBlob,
        result.fileName || normalizedKey,
        remoteBlob.type,
      );
    } catch (error) {
      setFilePreviewError(error.message || "Failed to preview file");
      throw error;
    } finally {
      setFilePreviewLoading(false);
    }
  };

  const validateResignationStep = (step) => {
    if (step === 1) {
      if (!String(resignationWizard.resignation_letter || "").trim()) {
        return "Resignation letter body is required.";
      }
      return "";
    }

    if (step === 2) {
      if (
        !resignationWizard.resignation_date ||
        !resignationWizard.last_working_day
      ) {
        return "Resignation date and last working day are required.";
      }

      if (resignationWizard.leaving_reasons.length === 0) {
        return "Select at least one reason for leaving.";
      }

      if (
        resignationWizard.leaving_reasons.includes("Others") &&
        !String(resignationWizard.leaving_reason_other || "").trim()
      ) {
        return "Please provide details for Others.";
      }

      return "";
    }

    if (step === 3) {
      const hasBlankAnswer = (resignationWizard.interview_answers || []).some(
        (answer) => !String(answer || "").trim(),
      );
      if (hasBlankAnswer) {
        return "All 16 exit interview answers are required.";
      }
      return "";
    }

    if (step === 4) {
      if (!String(resignationWizard.endorsement_file_key || "").trim()) {
        return "Upload your completed endorsement form before continuing.";
      }
      return "";
    }

    return "";
  };

  const goToNextResignationStep = async () => {
    const validationError = validateResignationStep(resignationStep);
    if (validationError) {
      setResignationWizardError(validationError);
      return;
    }

    try {
      await saveResignationDraftMutation.mutateAsync({
        payload: resignationWizard,
        step: resignationStep,
        interviewPart: resignationInterviewPart,
      });
      lastSavedResignationDraftRef.current = JSON.stringify({
        payload: resignationWizard,
        step: resignationStep,
        interviewPart: resignationInterviewPart,
      });
    } catch {
      // Keep the wizard usable even if draft save fails.
    }

    setResignationWizardError("");
    setResignationStep((prev) => Math.min(prev + 1, 5));
  };

  const goToPreviousResignationStep = () => {
    setResignationWizardError("");
    setResignationStep((prev) => Math.max(prev - 1, 1));
  };

  const submitResignationWizard = async () => {
    const validationError =
      validateResignationStep(1) ||
      validateResignationStep(2) ||
      validateResignationStep(3) ||
      validateResignationStep(4);

    if (validationError) {
      setResignationWizardError(validationError);
      return;
    }

    const reasons = resignationWizard.leaving_reasons;
    const reasonSummary = reasons.includes("Others")
      ? `${reasons.filter((item) => item !== "Others").join(", ")}; Others: ${String(resignationWizard.leaving_reason_other || "").trim()}`
      : reasons.join(", ");

    try {
      await saveResignationDraftMutation.mutateAsync({
        payload: resignationWizard,
        step: resignationStep,
        interviewPart: resignationInterviewPart,
      });
      lastSavedResignationDraftRef.current = JSON.stringify({
        payload: resignationWizard,
        step: resignationStep,
        interviewPart: resignationInterviewPart,
      });
    } catch {
      // Proceed to submit even if draft save fails right before final submit.
    }

    fileResignationMutation.mutate({
      emp_id: currentUser?.emp_id,
      resignation_type: "Voluntary Resignation",
      effective_date: resignationWizard.last_working_day,
      reason: reasonSummary,
      resignation_letter: resignationWizard.resignation_letter,
      recipient_name: resignationWizard.recipient_name,
      recipient_emp_id: resignationWizard.recipient_emp_id || null,
      resignation_date: resignationWizard.resignation_date,
      last_working_day: resignationWizard.last_working_day,
      leaving_reasons: resignationWizard.leaving_reasons,
      leaving_reason_other: resignationWizard.leaving_reason_other,
      exit_interview_answers: resignationWizard.interview_answers,
      endorsement_file_key: resignationWizard.endorsement_file_key,
    });
  };

  // --- HANDLERS ---
  const handleSubmitLeave = (e) => {
    e.preventDefault();
    if (!formData.emp_id || !formData.fromDate) {
      setFormError("Please fill all required fields.");
      return;
    }

    const trimmedReason = String(formData.reason || "").trim();
    if (!trimmedReason) {
      setFormError("Reason is required.");
      return;
    }

    const effectiveToDate = formData.toDate || formData.fromDate;

    // Automatically calculate the days for Offset since the manual input was removed
    let computedDays = formData.daysApplied;
    if (formData.leaveType === "Offset") {
      computedDays = Math.max(
        getDateDiffInclusive(formData.fromDate, effectiveToDate),
        1,
      );
    }

    setConfirmAction({
      type: "leave",
      leaveType: formData.leaveType,
      fromDate: formData.fromDate,
      toDate: effectiveToDate,
      daysApplied: computedDays,
      reason: trimmedReason,
    });
  };

  const handleLeaveTypeChange = (e) => {
    const newLeaveType = e.target.value;
    const newToDate =
      newLeaveType === "Birthday Leave" && formData.fromDate
        ? formData.fromDate
        : "";
    setFormData({
      ...formData,
      leaveType: newLeaveType,
      toDate: newToDate,
      daysApplied: "",
    });
    setFormError("");
  };

  const submitCancellationRequest = (item, cancellationReason) => {
    const trimmedReason = String(cancellationReason || "").trim();
    if (!trimmedReason) {
      showToast("Cancellation reason is required.", "error");
      return;
    }

    requestCancellationApprovalMutation.mutate({
      item,
      cancellationReason: trimmedReason,
    });
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
    if (!toDate) {
      setFormData({ ...formData, toDate: "" });
      setFormError("");
      return;
    }

    if (formData.leaveType !== "Offset") {
      const policy = leavePolicy[formData.leaveType];
      if (formData.fromDate && toDate && policy) {
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
    }
    setFormData({ ...formData, toDate });
    setFormError("");
  };

  const getMaxToDate = () => {
    if (!formData.fromDate || formData.leaveType === "Offset") return "";
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

  const openLeaveDecisionConfirm = (
    item,
    status,
    decisionMode = "application",
  ) => {
    const totalDays = getDateDiffInclusive(item.date_from, item.date_to);
    const requestedDates = getDateRangeInclusive(item.date_from, item.date_to);
    const isMultiDay = totalDays > 1;

    setReviewConfirm({
      module: "leave",
      status,
      decisionMode,
      item,
      isMultiDay,
      totalDays,
      selectedDates: status === "Approved" ? requestedDates : [],
      remarks: "",
    });
  };

  const openOffsetDecisionConfirm = (
    item,
    status,
    decisionMode = "application",
  ) => {
    const totalDays = getOffsetRequestedDays(item);
    const isMultiDay = totalDays > 1;

    setReviewConfirm({
      module: "offset",
      status,
      decisionMode,
      item,
      isMultiDay,
      isPartial: false,
      approvedDays: totalDays,
      remarks: "",
    });
  };

  const openResignationDecisionConfirm = (
    item,
    status,
    decisionMode = "application",
  ) => {
    setReviewConfirm({
      module: "resignation",
      status,
      decisionMode,
      item,
      remarks: "",
    });
  };

  const openResignationSupervisorReview = (item) => {
    const leavingReasons = parseJsonArray(item?.leaving_reasons_json);
    const interviewAnswers = parseJsonArray(item?.exit_interview_answers_json);
    setResignationSupervisorReview({
      item,
      leavingReasons,
      interviewAnswers,
    });
  };

  const keepResignationPendingUnderReview = () => {
    setResignationSupervisorReview(null);
    showToast("Application kept as Pending (Under Review).");
  };

  const approveResignationFromReview = () => {
    if (!resignationSupervisorReview?.item?.id) return;
    reviewResignationMutation.mutate({
      id: resignationSupervisorReview.item.id,
      status: "Approved",
    });
    setResignationSupervisorReview(null);
  };

  const toggleLeaveApprovedDate = (date) => {
    if (!reviewConfirm || reviewConfirm.module !== "leave") return;
    const selected = new Set(reviewConfirm.selectedDates || []);
    if (selected.has(date)) selected.delete(date);
    else selected.add(date);
    setReviewConfirm({
      ...reviewConfirm,
      selectedDates: Array.from(selected).sort(),
    });
  };

  //TODO:
  const { sendLeaveStatusEmail } = useEmail();

  const handleSendUpdate = async (item, status, remarks) => {
    const header =
      status === "Denied"
        ? "Your leave request was not approved at this time."
        : "Your leave request has been approved. Please ensure proper task endorsement before your leave.";

    const finalContent = remarks ? `${header} \n\nReason: ${remarks}` : header;

    await sendLeaveStatusEmail(item, status, finalContent);
  };

  const submitReviewDecision = () => {
    if (!reviewConfirm) return;

    const trimmedRemarks = String(reviewConfirm.remarks || "").trim();
    const isDenyDecision = reviewConfirm.status === "Denied";

    if (isDenyDecision && !trimmedRemarks) {
      showToast("Reason is required for denial.", "error");
      return;
    }

    if (reviewConfirm.module === "leave") {
      if (reviewConfirm.decisionMode === "cancellation") {
        reviewLeaveMutation.mutate({
          id: reviewConfirm.item.id,
          item: reviewConfirm.item,
          status: reviewConfirm.status,
          decision_mode: "cancellation",
          supervisor_remarks: isDenyDecision ? trimmedRemarks : undefined,
        });
        setReviewConfirm(null);
        return;
      }

      const requestedDates = getDateRangeInclusive(
        reviewConfirm.item.date_from,
        reviewConfirm.item.date_to,
      );
      const selectedDates = reviewConfirm.selectedDates || [];

      if (
        reviewConfirm.status === "Approved" &&
        reviewConfirm.isMultiDay &&
        selectedDates.length === 0
      ) {
        showToast("Select at least one day to approve.", "error");
        return;
      }

      const isPartialApproval =
        reviewConfirm.status === "Approved" &&
        reviewConfirm.isMultiDay &&
        selectedDates.length < requestedDates.length;

      // FINAL MUTATE CALL
      reviewLeaveMutation.mutate({
        id: reviewConfirm.item.id,
        item: reviewConfirm.item,
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
        supervisor_remarks: isDenyDecision ? trimmedRemarks : undefined,
      });

      setReviewConfirm(null);
      return;
    }

    if (reviewConfirm.module === "offset") {
      if (reviewConfirm.decisionMode === "cancellation") {
        reviewOffsetMutation.mutate({
          id: reviewConfirm.item.id,
          item: reviewConfirm.item,
          status: reviewConfirm.status,
          decision_mode: "cancellation",
          supervisor_remarks: isDenyDecision ? trimmedRemarks : undefined,
        });
        setReviewConfirm(null);
        return;
      }

      if (reviewConfirm.status === "Approved") {
        const approvedDays = Number(reviewConfirm.approvedDays || 0);
        const totalDays = getOffsetRequestedDays(reviewConfirm.item);
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
          supervisor_remarks: undefined,
        });
      } else {
        reviewOffsetMutation.mutate({
          id: reviewConfirm.item.id,
          status: "Denied",
          supervisor_remarks: trimmedRemarks,
        });
      }
      setReviewConfirm(null);
      return;
    }

    if (reviewConfirm.module === "resignation") {
      reviewResignationMutation.mutate({
        id: reviewConfirm.item.id,
        status: reviewConfirm.status === "Denied" ? "Rejected" : "Approved",
        review_remarks: isDenyDecision ? trimmedRemarks : undefined,
        decision_mode:
          reviewConfirm.decisionMode === "cancellation"
            ? "cancellation"
            : undefined,
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
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {currentUser?.role !== "Admin" && (
          <button
            className="cursor-pointer rounded-lg border-0 bg-gradient-to-r from-indigo-600 to-indigo-700 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:opacity-95"
            onClick={() => {
              setApplicationType("leave");
              setApplicationModalOpen(true);
            }}
          >
            + File New Application
          </button>
        )}

        {!isAdminRole && (
          <button
            className="cursor-pointer rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50"
            onClick={() => setMyPendingModalOpen(true)}
          >
            My Pending Requests
            {myRequestRows.length > 0 && (
              <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-black text-slate-800">
                {myRequestRows.length}
              </span>
            )}
          </button>
        )}

        {isApprover && (
          <button
            className="cursor-pointer rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-800 shadow-sm hover:bg-amber-100"
            onClick={() => setPendingModalOpen(true)}
          >
            Pending Approval Requests
            {totalPendingCount > 0 && (
              <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-amber-200 px-1.5 py-0.5 text-[10px] font-black text-amber-900">
                {totalPendingCount}
              </span>
            )}
          </button>
        )}
      </div>

      <LeaveCalendar
        leaves={calendarLeaves}
        attendance={isAdminRole ? [] : myAttendance}
        scopeOptions={calendarScopeOptions}
        activeScope={calendarScope}
        onScopeChange={setCalendarScope}
      />

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-indigo-100 bg-indigo-50 shadow-sm">
          <div className="border-b border-indigo-200 px-4 py-3">
            <h3 className="m-0 text-sm font-bold text-indigo-900">
              Monthly Offset Balance
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-3 p-4 text-sm md:grid-cols-4">
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

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
            <h3 className="m-0 text-sm font-bold text-gray-900">
              History of Leave / Offset / Resignation
            </h3>
          </div>
          <div className="max-h-72 overflow-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-gray-200 bg-white">
                  <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    Request Type
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    Schedule / Effective Date
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    Date Filed
                  </th>
                  <th className="px-4 py-2.5 text-right text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {myRequestHistory.length === 0 ? (
                  <tr>
                    <td
                      colSpan="4"
                      className="px-4 py-6 text-center text-sm font-medium text-gray-500"
                    >
                      No request history records.
                    </td>
                  </tr>
                ) : (
                  myRequestHistory.map((entry) => (
                    <tr
                      key={entry.id}
                      className="transition-colors hover:bg-gray-50/50"
                    >
                      <td className="px-4 py-2.5 text-sm font-semibold text-gray-800">
                        {entry.request_type}
                      </td>
                      <td className="px-4 py-2.5 text-sm font-medium text-gray-700">
                        {entry.schedule}
                      </td>
                      <td className="px-4 py-2.5 text-sm font-medium text-gray-700">
                        {entry.filed_at
                          ? new Date(entry.filed_at).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <span
                          className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider ${badgeClass[entry.final_status] || "bg-gray-100 text-gray-700"}`}
                        >
                          {entry.final_status}
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

      {myOwnResignations.length > 0 && (
        <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
            <h3 className="m-0 text-sm font-bold text-gray-900">
              Resignation Clearance Handling
            </h3>
          </div>
          <div className="space-y-3 p-4">
            {myOwnResignations
              .slice()
              .sort(
                (a, b) =>
                  new Date(b.created_at || 0).getTime() -
                  new Date(a.created_at || 0).getTime(),
              )
              .map((resignation) => {
                const isApproved = resignation.status === "Approved";
                const isPending = isPendingApprovalStatus(resignation.status);

                return (
                  <div
                    key={resignation.id}
                    className="rounded-lg border border-gray-200 bg-gray-50 p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="m-0 text-sm font-semibold text-gray-800">
                        {resignation.resignation_type || "Resignation"} ·
                        Effective{" "}
                        {resignation.effective_date
                          ? new Date(
                              resignation.effective_date,
                            ).toLocaleDateString()
                          : "N/A"}
                      </p>
                      <span
                        className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider ${badgeClass[resignation.status] || "bg-gray-100 text-gray-700"}`}
                      >
                        {resignation.status}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <a
                        href="/forms/Resignee_Exit-Clearance-Form.docx"
                        download
                        className={`rounded-md px-3 py-2 text-xs font-bold no-underline ${isApproved ? "bg-blue-600 text-white hover:bg-blue-700" : "pointer-events-none bg-blue-100 text-blue-400"}`}
                      >
                        Download Clearance Form (DOC)
                      </a>

                      <label
                        className={`rounded-md px-3 py-2 text-xs font-bold ${isApproved ? "cursor-pointer bg-emerald-600 text-white hover:bg-emerald-700" : "cursor-not-allowed bg-emerald-100 text-emerald-400"}`}
                      >
                        Upload Clearance Form
                        <input
                          type="file"
                          accept=".doc,.docx,.pdf"
                          disabled={
                            !isApproved ||
                            isUploadingClearanceId === resignation.id
                          }
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file || !isApproved) return;
                            setIsUploadingClearanceId(resignation.id);
                            try {
                              const uploaded = await uploadRequiredFile(file);
                              await uploadResignationClearanceMutation.mutateAsync(
                                {
                                  id: resignation.id,
                                  clearance_file_key: uploaded.key,
                                },
                              );
                            } catch (error) {
                              showToast(
                                error.message ||
                                  "Failed to upload clearance form.",
                                "error",
                              );
                            } finally {
                              setIsUploadingClearanceId(null);
                              e.target.value = "";
                            }
                          }}
                          className="hidden"
                        />
                      </label>

                      {isPending && (
                        <span className="text-xs font-semibold text-amber-700">
                          Clearance upload is visible but disabled while pending
                          review.
                        </span>
                      )}

                      {!isPending && !isApproved && (
                        <span className="text-xs font-semibold text-gray-600">
                          Clearance upload will be available once resignation is
                          approved.
                        </span>
                      )}
                    </div>

                    {resignation.clearance_file_key && (
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <p className="m-0 text-xs font-medium text-emerald-700">
                          Uploaded clearance key:{" "}
                          {resignation.clearance_file_key}
                        </p>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await openUploadedFileByKey(
                                resignation.clearance_file_key,
                              );
                            } catch (error) {
                              showToast(
                                error.message ||
                                  "Failed to open uploaded clearance form.",
                                "error",
                              );
                            }
                          }}
                          className="cursor-pointer rounded-md border border-gray-300 bg-white px-2.5 py-1 text-[11px] font-bold text-gray-700 hover:bg-gray-50"
                        >
                          View Uploaded File
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {applicationModalOpen && currentUser?.role !== "Admin" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-3xl overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
              <h3 className="m-0 text-base font-bold text-gray-900">
                File New Application
              </h3>
              <button
                onClick={() => setApplicationModalOpen(false)}
                className="cursor-pointer rounded-md border-0 bg-transparent px-2 py-1 text-lg text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
            </div>

            <div className="px-4 pt-3">
              <div className="mb-3 inline-flex rounded-lg border border-gray-200 bg-white p-1">
                <button
                  onClick={() => setApplicationType("leave")}
                  className={`rounded-md px-3 py-1.5 text-xs font-bold ${applicationType === "leave" ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  Leave / Offset
                </button>
                <button
                  onClick={() => setApplicationType("resignation")}
                  className={`rounded-md px-3 py-1.5 text-xs font-bold ${applicationType === "resignation" ? "bg-red-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  Resignation
                </button>
              </div>
            </div>

            <div className="max-h-[72vh] overflow-auto p-4 pt-0">
              {applicationType === "leave" ? (
                <>
                  {formError && (
                    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                      {formError}
                    </div>
                  )}
                  <form
                    onSubmit={handleSubmitLeave}
                    className="grid grid-cols-1 gap-4 md:grid-cols-3"
                  >
                    <div className="flex flex-col gap-2 md:col-span-3">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        Filing As
                      </label>
                      <input
                        type="text"
                        disabled
                        value={`${currentUser.emp_id} - ${currentUser.name}`}
                        className="cursor-not-allowed rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-bold text-gray-600 outline-none"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        Leave Type
                      </label>
                      <select
                        value={formData.leaveType}
                        onChange={handleLeaveTypeChange}
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        {availableLeaveTypes.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
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
                        className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        To Date
                      </label>
                      <input
                        type="date"
                        value={formData.toDate}
                        onChange={handleToDateChange}
                        disabled={formData.leaveType === "Birthday Leave"}
                        max={getMaxToDate()}
                        min={formData.fromDate}
                        className={`rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500 ${formData.leaveType === "Birthday Leave" ? "cursor-not-allowed bg-gray-100 text-gray-500" : ""}`}
                      />
                    </div>

                    {formData.leaveType !== "Offset" && (
                      <div className="flex flex-col gap-2 md:col-span-3">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                          Priority Level
                        </label>
                        <select
                          value={formData.priority}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              priority: e.target.value,
                            })
                          }
                          className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                        </select>
                      </div>
                    )}

                    <div className="flex flex-col gap-2 md:col-span-3">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        Reason / Details <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={3}
                        value={formData.reason}
                        onChange={(e) =>
                          setFormData({ ...formData, reason: e.target.value })
                        }
                        className="resize-none rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Please provide a reason for this request"
                        required
                      />
                    </div>

                    <div className="mt-1 flex justify-end gap-2 md:col-span-3">
                      <button
                        type="button"
                        onClick={() => setApplicationModalOpen(false)}
                        className="cursor-pointer rounded-lg bg-gray-200 px-5 py-2 text-sm font-bold text-gray-700 hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="cursor-pointer rounded-lg bg-green-600 px-5 py-2 text-sm font-bold text-white hover:bg-green-700"
                      >
                        Review Application
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-gray-500">
                          Resignation Progress
                        </p>
                        <p className="mt-1 text-sm font-semibold text-gray-900">
                          Step {resignationStep} of{" "}
                          {resignationStepLabels.length}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-gray-500">
                          {resignationStepLabels[resignationStep - 1]}
                        </p>
                        <p className="text-sm font-bold text-red-600">
                          {Math.round(
                            (resignationStep / resignationStepLabels.length) *
                              100,
                          )}
                          %
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-red-500 via-rose-500 to-orange-400 transition-all duration-300"
                        style={{
                          width: `${Math.max(
                            8,
                            (resignationStep / resignationStepLabels.length) *
                              100,
                          )}%`,
                        }}
                      />
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-5">
                      {resignationStepLabels.map((label, index) => {
                        const stepNumber = index + 1;
                        const isCurrent = stepNumber === resignationStep;
                        const isCompleted = stepNumber < resignationStep;

                        return (
                          <div
                            key={label}
                            className={`rounded-lg border px-3 py-2 text-center text-xs font-semibold transition-colors ${
                              isCurrent
                                ? "border-red-200 bg-red-50 text-red-700"
                                : isCompleted
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                  : "border-gray-200 bg-gray-50 text-gray-500"
                            }`}
                          >
                            <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.22em]">
                              Step {stepNumber}
                            </div>
                            <div className="leading-tight">{label}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {resignationWizardError && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                      {resignationWizardError}
                    </div>
                  )}

                  {resignationStep === 1 && (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="flex flex-col gap-2">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                          Current Date
                        </label>
                        <input
                          type="date"
                          value={resignationWizard.request_date}
                          disabled
                          className="cursor-not-allowed rounded-md border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-600"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                          Recipient (Supervisor)
                        </label>
                        <input
                          type="text"
                          value={resignationWizard.recipient_name}
                          disabled
                          className="cursor-not-allowed rounded-md border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-600"
                        />
                      </div>
                      <div className="flex flex-col gap-2 md:col-span-2">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                          Resignation Letter Body
                        </label>
                        <textarea
                          rows={8}
                          value={resignationWizard.resignation_letter}
                          onChange={(e) =>
                            setResignationWizard((prev) => ({
                              ...prev,
                              resignation_letter: e.target.value,
                            }))
                          }
                          placeholder="Write your resignation letter here..."
                          className="w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>
                    </div>
                  )}

                  {resignationStep === 2 && (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="flex flex-col gap-2">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                          Name
                        </label>
                        <input
                          type="text"
                          value={resignationWizard.employee_name}
                          disabled
                          className="cursor-not-allowed rounded-md border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-600"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                          Position
                        </label>
                        <input
                          type="text"
                          value={resignationWizard.position}
                          disabled
                          className="cursor-not-allowed rounded-md border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-600"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                          Department / Designation
                        </label>
                        <input
                          type="text"
                          value={resignationWizard.designation}
                          disabled
                          className="cursor-not-allowed rounded-md border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-600"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                          Date of Joining
                        </label>
                        <input
                          type="date"
                          value={resignationWizard.hired_date}
                          disabled
                          className="cursor-not-allowed rounded-md border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-600"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                          Resignation Date
                        </label>
                        <input
                          type="date"
                          value={resignationWizard.resignation_date}
                          onChange={(e) =>
                            setResignationWizard((prev) => ({
                              ...prev,
                              resignation_date: e.target.value,
                            }))
                          }
                          className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                          Last Working Day
                        </label>
                        <input
                          type="date"
                          value={resignationWizard.last_working_day}
                          onChange={(e) =>
                            setResignationWizard((prev) => ({
                              ...prev,
                              last_working_day: e.target.value,
                            }))
                          }
                          className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <p className="m-0 mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                          Reason for Leaving (Select one or more)
                        </p>
                        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                          {resignationReasonOptions.map((reasonOption) => {
                            const checked =
                              resignationWizard.leaving_reasons.includes(
                                reasonOption,
                              );
                            return (
                              <label
                                key={reasonOption}
                                className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() =>
                                    setResignationWizard((prev) => {
                                      const exists =
                                        prev.leaving_reasons.includes(
                                          reasonOption,
                                        );
                                      return {
                                        ...prev,
                                        leaving_reasons: exists
                                          ? prev.leaving_reasons.filter(
                                              (item) => item !== reasonOption,
                                            )
                                          : [
                                              ...prev.leaving_reasons,
                                              reasonOption,
                                            ],
                                      };
                                    })
                                  }
                                />
                                <span>{reasonOption}</span>
                              </label>
                            );
                          })}
                        </div>
                        {resignationWizard.leaving_reasons.includes(
                          "Others",
                        ) && (
                          <input
                            type="text"
                            value={resignationWizard.leaving_reason_other}
                            onChange={(e) =>
                              setResignationWizard((prev) => ({
                                ...prev,
                                leaving_reason_other: e.target.value,
                              }))
                            }
                            placeholder="Specify other reason"
                            className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500"
                          />
                        )}
                      </div>
                    </div>
                  )}

                  {resignationStep === 3 && (
                    <div className="space-y-3">
                      <div className="rounded-md border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm text-indigo-900">
                        <p className="m-0 font-semibold">Instructions:</p>
                        <p className="m-0 mt-1">
                          Please answer each question honestly. Your responses
                          will help Human Resources improve services and
                          employee experience. All answers will remain
                          confidential.
                        </p>
                      </div>

                      <div className="flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600">
                        <span>
                          Exit Interview Part {resignationInterviewPart} of 2
                        </span>
                        <span>
                          Q{resignationInterviewPart === 1 ? "1-8" : "9-16"}
                        </span>
                      </div>

                      <div className="space-y-3">
                        {exitInterviewQuestions
                          .slice(
                            resignationInterviewPart === 1 ? 0 : 8,
                            resignationInterviewPart === 1 ? 8 : 16,
                          )
                          .map((question, idx) => {
                            const questionIndex =
                              (resignationInterviewPart === 1 ? 0 : 8) + idx;
                            return (
                              <div key={question} className="space-y-1">
                                <label className="block text-xs font-bold text-gray-600">
                                  {questionIndex + 1}. {question}
                                </label>
                                <textarea
                                  rows={3}
                                  value={
                                    resignationWizard.interview_answers[
                                      questionIndex
                                    ] || ""
                                  }
                                  onChange={(e) =>
                                    setResignationWizard((prev) => {
                                      const nextAnswers = [
                                        ...prev.interview_answers,
                                      ];
                                      nextAnswers[questionIndex] =
                                        e.target.value;
                                      return {
                                        ...prev,
                                        interview_answers: nextAnswers,
                                      };
                                    })
                                  }
                                  className="w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500"
                                />
                              </div>
                            );
                          })}
                      </div>

                      <div className="flex justify-end">
                        {resignationInterviewPart === 1 ? (
                          <button
                            type="button"
                            onClick={() => setResignationInterviewPart(2)}
                            className="cursor-pointer rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700"
                          >
                            Proceed to Part 2
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setResignationInterviewPart(1)}
                            className="cursor-pointer rounded-lg bg-gray-200 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-300"
                          >
                            Back to Part 1
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {resignationStep === 4 && (
                    <div className="space-y-3">
                      <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                        Download the endorsement form, complete it offline, then
                        upload the signed copy.
                      </div>
                      <a
                        href="/forms/Resignee_Endorsement-Form.docx"
                        download
                        className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-bold text-white no-underline hover:bg-blue-700"
                      >
                        Download Endorsement Form (DOC)
                      </a>

                      <div className="rounded-md border border-gray-200 bg-white p-3">
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">
                          Upload Completed Endorsement Form
                        </label>
                        <input
                          type="file"
                          accept=".doc,.docx,.pdf"
                          disabled={isUploadingEndorsement}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setIsUploadingEndorsement(true);
                            try {
                              const uploaded = await uploadRequiredFile(file);
                              setResignationWizard((prev) => ({
                                ...prev,
                                endorsement_file_key: uploaded.key,
                                endorsement_file_name:
                                  uploaded.fileName || file.name,
                              }));
                              setResignationWizardError("");
                              showToast("Endorsement form uploaded.");
                            } catch (error) {
                              showToast(
                                error.message ||
                                  "Failed to upload endorsement form.",
                                "error",
                              );
                            } finally {
                              setIsUploadingEndorsement(false);
                              e.target.value = "";
                            }
                          }}
                          className="block w-full text-sm"
                        />
                        {resignationWizard.endorsement_file_key && (
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <p className="m-0 text-xs font-medium text-emerald-700">
                              Uploaded:{" "}
                              {resignationWizard.endorsement_file_name}
                            </p>
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  await openUploadedFileByKey(
                                    resignationWizard.endorsement_file_key,
                                  );
                                } catch (error) {
                                  showToast(
                                    error.message ||
                                      "Failed to open uploaded endorsement form.",
                                    "error",
                                  );
                                }
                              }}
                              className="cursor-pointer rounded-md border border-gray-300 bg-white px-2.5 py-1 text-[11px] font-bold text-gray-700 hover:bg-gray-50"
                            >
                              View Uploaded File
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {resignationStep === 5 && (
                    <div className="space-y-3">
                      <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                        Review your details below, then click Submit Application
                        for supervisor approval.
                      </div>
                      <div className="rounded-md border border-gray-200 bg-white p-3 text-sm">
                        <p className="m-0">
                          <span className="font-semibold">Recipient:</span>{" "}
                          {resignationWizard.recipient_name}
                        </p>
                        <p className="m-0 mt-1">
                          <span className="font-semibold">
                            Resignation Date:
                          </span>{" "}
                          {resignationWizard.resignation_date || "-"}
                        </p>
                        <p className="m-0 mt-1">
                          <span className="font-semibold">
                            Last Working Day:
                          </span>{" "}
                          {resignationWizard.last_working_day || "-"}
                        </p>
                        <p className="m-0 mt-1">
                          <span className="font-semibold">
                            Reasons Selected:
                          </span>{" "}
                          {resignationWizard.leaving_reasons.join(", ") || "-"}
                        </p>
                        <p className="m-0 mt-1">
                          <span className="font-semibold">Endorsement:</span>{" "}
                          {resignationWizard.endorsement_file_name ||
                            "Not uploaded"}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="mt-2 flex justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (resignationStep === 1) {
                          setApplicationModalOpen(false);
                        } else {
                          goToPreviousResignationStep();
                        }
                      }}
                      className="cursor-pointer rounded-lg bg-gray-200 px-5 py-2 text-sm font-bold text-gray-700 hover:bg-gray-300"
                    >
                      {resignationStep === 1 ? "Cancel" : "Back"}
                    </button>

                    {resignationStep < 5 ? (
                      <button
                        type="button"
                        onClick={goToNextResignationStep}
                        className="cursor-pointer rounded-lg bg-red-600 px-5 py-2 text-sm font-bold text-white hover:bg-red-700"
                      >
                        Next
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={fileResignationMutation.isPending}
                        onClick={submitResignationWizard}
                        className="cursor-pointer rounded-lg bg-red-600 px-5 py-2 text-sm font-bold text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
                      >
                        Submit Application
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {pendingModalOpen && isApprover && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-5xl overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
              <div>
                <h3 className="m-0 text-base font-bold text-gray-900">
                  Pending Approval Requests
                </h3>
              </div>
              <button
                onClick={() => setPendingModalOpen(false)}
                className="cursor-pointer rounded-md border-0 bg-transparent px-2 py-1 text-lg text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
            </div>
            <div className="max-h-[72vh] overflow-auto">
              <div className="sticky top-0 z-20 flex flex-wrap gap-1.5 border-b border-gray-200 bg-white px-4 py-2">
                <button
                  type="button"
                  onClick={() => setPendingTypeFilter("all")}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors ${pendingTypeFilter === "all" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
                >
                  All ({allPendingRequests.length})
                </button>
                <button
                  type="button"
                  onClick={() => setPendingTypeFilter("leave")}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors ${pendingTypeFilter === "leave" ? "bg-indigo-600 text-white" : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"}`}
                >
                  Leave ({pendingLeaveApprovals.length})
                </button>
                <button
                  type="button"
                  onClick={() => setPendingTypeFilter("offset")}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors ${pendingTypeFilter === "offset" ? "bg-sky-600 text-white" : "bg-sky-50 text-sky-700 hover:bg-sky-100"}`}
                >
                  Offset ({pendingOffsetApprovals.length})
                </button>
                <button
                  type="button"
                  onClick={() => setPendingTypeFilter("resignation")}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors ${pendingTypeFilter === "resignation" ? "bg-amber-600 text-white" : "bg-amber-50 text-amber-700 hover:bg-amber-100"}`}
                >
                  Resignation ({pendingResignationApprovals.length})
                </button>
              </div>
              <table className="w-full text-sm text-left">
                <thead className="sticky top-[43px] z-10 bg-white">
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      Employee
                    </th>
                    <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      Request Type
                    </th>
                    <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      Schedule
                    </th>
                    <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      Cancellation Reason / HR Note
                    </th>
                    <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      Cancel Requested At
                    </th>
                    <th className="px-4 py-2.5 text-right text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredPendingRequests.length === 0 ? (
                    <tr>
                      <td
                        colSpan="6"
                        className="px-4 py-8 text-center text-sm font-medium text-gray-500"
                      >
                        No pending requests for the selected filter.
                      </td>
                    </tr>
                  ) : (
                    filteredPendingRequests.map((item) => {
                      const isCancellationRequest =
                        Boolean(item.cancellation_requested_at) &&
                        !isPendingApprovalStatus(item.status);
                      const canDirectDecision =
                        !isHRRole || canHrDirectDecision(item);

                      return (
                        <tr
                          key={`${item.request_group}-${item.isOffset ? "offset" : "leave"}-${item.id}`}
                          className="transition-colors hover:bg-gray-50/50"
                        >
                          <td className="px-4 py-2.5 text-sm font-semibold text-gray-800">
                            {item.first_name} {item.last_name}
                          </td>
                          <td className="px-4 py-2.5 text-sm font-bold text-indigo-700">
                            {item.request_group === "resignation"
                              ? `${isCancellationRequest ? "Cancellation • " : "Resignation • "}${item.unified_type}`
                              : `${isCancellationRequest ? "Cancellation • " : ""}${item.unified_type}${item.isOffset && Number(item.days_applied || 0) > 0 ? ` (${Number(item.days_applied || 0).toFixed(2)} days)` : ""}`}
                          </td>
                          <td className="px-4 py-2.5 text-sm text-gray-700">
                            {item.request_group === "resignation"
                              ? item.effective_date
                                ? new Date(
                                    item.effective_date,
                                  ).toLocaleDateString()
                                : "N/A"
                              : `${new Date(item.date_from).toLocaleDateString()} - ${new Date(item.date_to).toLocaleDateString()}`}
                          </td>
                          <td className="max-w-[260px] px-4 py-2.5 text-xs text-gray-700">
                            {isCancellationRequest
                              ? item.cancellation_reason || "-"
                              : item.hr_note || "-"}
                          </td>
                          <td className="px-4 py-2.5 text-xs font-medium text-gray-600">
                            {item.cancellation_requested_at
                              ? new Date(
                                  item.cancellation_requested_at,
                                ).toLocaleString()
                              : "-"}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            {canDirectDecision ? (
                              item.request_group === "resignation" &&
                              !isCancellationRequest ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    openResignationSupervisorReview(item);
                                    setPendingModalOpen(false);
                                  }}
                                  className="rounded-md border border-amber-200 bg-amber-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-800 hover:bg-amber-200"
                                >
                                  Review Application
                                </button>
                              ) : (
                                <div className="inline-flex gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const decisionMode = isCancellationRequest
                                        ? "cancellation"
                                        : "application";
                                      if (
                                        item.request_group === "resignation"
                                      ) {
                                        openResignationDecisionConfirm(
                                          item,
                                          "Approved",
                                          decisionMode,
                                        );
                                        setPendingModalOpen(false);
                                        return;
                                      }
                                      item.isOffset
                                        ? openOffsetDecisionConfirm(
                                            item,
                                            "Approved",
                                            decisionMode,
                                          )
                                        : openLeaveDecisionConfirm(
                                            item,
                                            "Approved",
                                            decisionMode,
                                          );
                                      setPendingModalOpen(false);
                                    }}
                                    className="rounded-md border border-green-200 bg-green-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-green-700 hover:bg-green-200"
                                  >
                                    {isCancellationRequest
                                      ? "Approve Cancel"
                                      : "Approve"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const decisionMode = isCancellationRequest
                                        ? "cancellation"
                                        : "application";
                                      if (
                                        item.request_group === "resignation"
                                      ) {
                                        openResignationDecisionConfirm(
                                          item,
                                          "Denied",
                                          decisionMode,
                                        );
                                        setPendingModalOpen(false);
                                        return;
                                      }
                                      item.isOffset
                                        ? openOffsetDecisionConfirm(
                                            item,
                                            "Denied",
                                            decisionMode,
                                          )
                                        : openLeaveDecisionConfirm(
                                            item,
                                            "Denied",
                                            decisionMode,
                                          );
                                      setPendingModalOpen(false);
                                    }}
                                    className="rounded-md border border-red-200 bg-red-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-red-700 hover:bg-red-200"
                                  >
                                    {isCancellationRequest
                                      ? "Keep Request"
                                      : "Deny"}
                                  </button>
                                </div>
                              )
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  setHrNoteConfirm({
                                    item,
                                    note: item.hr_note || "",
                                    module:
                                      item.request_group === "resignation"
                                        ? "resignation"
                                        : item.isOffset
                                          ? "offset"
                                          : "leave",
                                  })
                                }
                                className="rounded-md border border-indigo-200 bg-indigo-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-indigo-700 hover:bg-indigo-200"
                              >
                                Add HR Note
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {myPendingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-4xl overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
              <h3 className="m-0 text-base font-bold text-gray-900">
                My Pending Requests
              </h3>
              <button
                onClick={() => setMyPendingModalOpen(false)}
                className="cursor-pointer rounded-md border-0 bg-transparent px-2 py-1 text-lg text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
            </div>

            <div className="max-h-[72vh] overflow-auto">
              <table className="w-full text-sm text-left">
                <thead className="sticky top-0 z-10 bg-white">
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      Request Type
                    </th>
                    <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      Schedule
                    </th>
                    <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      Status
                    </th>
                    <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      Cancel Requested At
                    </th>
                    <th className="px-4 py-2.5 text-right text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {myRequestRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-4 py-8 text-center text-sm font-medium text-gray-500"
                      >
                        You have no active request actions.
                      </td>
                    </tr>
                  ) : (
                    myRequestRows.map((item) => (
                      <tr
                        key={`${item.request_group}-${item.id}`}
                        className="transition-colors hover:bg-gray-50/50"
                      >
                        <td className="px-4 py-2.5 text-sm font-semibold text-gray-800">
                          {item.request_group === "resignation"
                            ? `Resignation - ${item.unified_type}`
                            : item.request_group === "offset"
                              ? Number(item.days_applied || 0) > 0
                                ? `Offset (${Number(item.days_applied || 0).toFixed(2)} days)`
                                : "Offset"
                              : item.unified_type}
                        </td>
                        <td className="px-4 py-2.5 text-sm text-gray-700">
                          {item.request_group === "resignation"
                            ? item.effective_date
                              ? new Date(
                                  item.effective_date,
                                ).toLocaleDateString()
                              : "N/A"
                            : `${new Date(item.date_from).toLocaleDateString()} - ${new Date(item.date_to).toLocaleDateString()}`}
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider ${badgeClass[item.row_status] || "bg-yellow-100 text-yellow-800"}`}
                          >
                            {item.row_status}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-xs font-medium text-gray-600">
                          {item.cancellation_requested_at
                            ? new Date(
                                item.cancellation_requested_at,
                              ).toLocaleString()
                            : "-"}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          {item.row_action === "cancel_pending" && (
                            <button
                              type="button"
                              disabled={
                                cancelMyPendingRequestMutation.isPending
                              }
                              onClick={() => setCancelPendingConfirm(item)}
                              className="rounded-md border border-red-200 bg-red-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-red-700 hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Cancel Request
                            </button>
                          )}
                          {item.row_action === "request_cancel_approval" && (
                            <button
                              type="button"
                              disabled={
                                requestCancellationApprovalMutation.isPending
                              }
                              onClick={() => {
                                setCancelApprovalConfirm({
                                  item,
                                  reason: "",
                                });
                              }}
                              className="rounded-md border border-amber-200 bg-amber-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-800 hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Request Cancellation Approval
                            </button>
                          )}
                          {item.row_action === "cancel_waiting_approval" && (
                            <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-700">
                              Awaiting Approval
                            </span>
                          )}
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

      {confirmAction && confirmAction.type === "leave" && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="m-0 text-lg font-semibold text-gray-900 mb-4">
              Confirm Application
            </h2>
            <div className="mb-6 space-y-3 text-sm">
              <div>
                <p className="m-0 text-gray-600 font-medium">Type:</p>
                <p className="m-0 text-purple-700 font-bold">
                  {confirmAction.leaveType}
                </p>
              </div>
              <div>
                <p className="m-0 text-gray-600 font-medium">Dates:</p>
                <p className="m-0 text-gray-900 font-semibold">
                  {new Date(confirmAction.fromDate).toLocaleDateString()} to{" "}
                  {new Date(confirmAction.toDate).toLocaleDateString()}
                </p>
              </div>
              {confirmAction.leaveType === "Offset" && (
                <div>
                  <p className="m-0 text-gray-600 font-medium">
                    Applied Amount:
                  </p>
                  <p className="m-0 text-gray-900 font-semibold">
                    {confirmAction.daysApplied} Days/Hours
                  </p>
                </div>
              )}
            </div>
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
                  if (confirmAction.leaveType === "Offset") {
                    fileOffsetMutation.mutate({
                      date_from: confirmAction.fromDate,
                      date_to: confirmAction.toDate,
                      days_applied: parseFloat(confirmAction.daysApplied),
                      reason: confirmAction.reason,
                    });
                  } else {
                    submitLeaveMutation.mutate({
                      emp_id: formData.emp_id,
                      leave_type: formData.leaveType,
                      date_from: formData.fromDate,
                      date_to: formData.toDate,
                      priority: formData.priority,
                      supervisor_remarks: confirmAction.reason,
                    });
                  }
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
              {reviewConfirm.decisionMode === "cancellation"
                ? reviewConfirm.status === "Denied"
                  ? "Decline Cancellation Request"
                  : "Approve Cancellation Request"
                : reviewConfirm.status === "Denied"
                  ? "Confirm Denial"
                  : "Confirm Approval"}
            </h2>
            <p className="m-0 mb-4 text-sm text-gray-600">
              {reviewConfirm.item.first_name} {reviewConfirm.item.last_name}
              {reviewConfirm.module === "resignation"
                ? ` • ${reviewConfirm.item.resignation_type}`
                : ` • ${new Date(reviewConfirm.item.date_from).toLocaleDateString()} - ${new Date(reviewConfirm.item.date_to).toLocaleDateString()}`}
            </p>

            {reviewConfirm.decisionMode === "cancellation" && (
              <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
                <p className="m-0 text-[10px] font-bold uppercase tracking-wider text-amber-800">
                  Submitted Cancellation Reason
                </p>
                <p className="m-0 mt-1 text-sm text-amber-900">
                  {reviewConfirm.item.cancellation_reason ||
                    "No reason provided."}
                </p>
              </div>
            )}

            {reviewConfirm.item.hr_note && (
              <div className="mb-4 rounded-md border border-indigo-200 bg-indigo-50 px-3 py-2">
                <p className="m-0 text-[10px] font-bold uppercase tracking-wider text-indigo-800">
                  HR Note
                </p>
                <p className="m-0 mt-1 text-sm text-indigo-900">
                  {reviewConfirm.item.hr_note}
                </p>
              </div>
            )}

            {(reviewConfirm.item.supervisor_remarks ||
              reviewConfirm.item.reason) &&
              reviewConfirm.decisionMode !== "cancellation" && (
                <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 px-3 py-2">
                  <p className="m-0 text-[10px] font-bold uppercase tracking-wider text-blue-800">
                    Reason for Submission
                  </p>
                  <p className="m-0 mt-1 text-sm text-blue-900">
                    {reviewConfirm.item.supervisor_remarks ||
                      reviewConfirm.item.reason}
                  </p>
                </div>
              )}
            {reviewConfirm.module === "leave" &&
              reviewConfirm.decisionMode !== "cancellation" &&
              reviewConfirm.status === "Approved" &&
              reviewConfirm.isMultiDay && (
                <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="m-0 mb-2 text-xs font-bold uppercase tracking-wider text-amber-800">
                    Select specific days to approve
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
                          checked={(reviewConfirm.selectedDates || []).includes(
                            date,
                          )}
                          onChange={() => toggleLeaveApprovedDate(date)}
                        />
                        <span>{parseDateOnly(date).toLocaleDateString()}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

            {reviewConfirm.module === "offset" &&
              reviewConfirm.decisionMode !== "cancellation" &&
              reviewConfirm.status === "Approved" &&
              reviewConfirm.isMultiDay && (
                <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="m-0 mb-2 text-xs font-bold uppercase tracking-wider text-amber-800">
                    Set approved offset days
                  </p>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    max={getOffsetRequestedDays(reviewConfirm.item)}
                    value={reviewConfirm.approvedDays}
                    onChange={(e) =>
                      setReviewConfirm({
                        ...reviewConfirm,
                        approvedDays: e.target.value,
                      })
                    }
                    className="w-full rounded-md border border-amber-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              )}

            {reviewConfirm.status === "Denied" && (
              <div className="mb-5">
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">
                  Reason (required)
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
                />
              </div>
            )}

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
                className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${reviewConfirm.status === "Denied" ? "bg-red-600" : "bg-green-600"}`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {resignationSupervisorReview && (
        <div className="fixed inset-0 z-[72] flex items-center justify-center bg-black/55 p-4">
          <div className="flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-5 py-3">
              <div>
                <h3 className="m-0 text-base font-bold text-gray-900">
                  Resignation Supervisor Review
                </h3>
                <p className="m-0 mt-1 text-xs font-medium text-gray-600">
                  {resignationSupervisorReview.item.first_name}{" "}
                  {resignationSupervisorReview.item.last_name} •{" "}
                  {resignationSupervisorReview.item.resignation_type ||
                    "Resignation"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setResignationSupervisorReview(null)}
                className="cursor-pointer rounded-md border-0 bg-transparent px-2 py-1 text-lg text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-auto p-5">
              {(() => {
                const progress = getResignationProgressPercent(
                  resignationSupervisorReview.item,
                );
                return (
                  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="m-0 text-sm font-semibold text-gray-800">
                        Current Progress: Step {progress.step} of{" "}
                        {progress.totalSteps}
                      </p>
                      <span
                        className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${badgeClass[resignationSupervisorReview.item.status] || "bg-gray-100 text-gray-700"}`}
                      >
                        {resignationSupervisorReview.item.status ||
                          "Pending Approval"}
                      </span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500"
                        style={{ width: `${progress.percent}%` }}
                      />
                    </div>
                  </div>
                );
              })()}

              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <p className="m-0 text-xs font-bold uppercase tracking-wider text-gray-500">
                  Step 1 • Resignation Letter
                </p>
                <p className="m-0 mt-2 whitespace-pre-wrap text-sm text-gray-800">
                  {resignationSupervisorReview.item.resignation_letter ||
                    "No resignation letter provided."}
                </p>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <p className="m-0 text-xs font-bold uppercase tracking-wider text-gray-500">
                  Step 2 • Employee Resignation Form
                </p>
                <div className="mt-2 grid grid-cols-1 gap-2 text-sm text-gray-800 md:grid-cols-2">
                  <p className="m-0">
                    <span className="font-semibold">Recipient:</span>{" "}
                    {resignationSupervisorReview.item.recipient_name || "-"}
                  </p>
                  <p className="m-0">
                    <span className="font-semibold">Resignation Date:</span>{" "}
                    {resignationSupervisorReview.item.resignation_date
                      ? new Date(
                          resignationSupervisorReview.item.resignation_date,
                        ).toLocaleDateString()
                      : "-"}
                  </p>
                  <p className="m-0">
                    <span className="font-semibold">Last Working Day:</span>{" "}
                    {resignationSupervisorReview.item.last_working_day
                      ? new Date(
                          resignationSupervisorReview.item.last_working_day,
                        ).toLocaleDateString()
                      : "-"}
                  </p>
                  <p className="m-0">
                    <span className="font-semibold">Effective Date:</span>{" "}
                    {resignationSupervisorReview.item.effective_date
                      ? new Date(
                          resignationSupervisorReview.item.effective_date,
                        ).toLocaleDateString()
                      : "-"}
                  </p>
                </div>

                <div className="mt-3">
                  <p className="m-0 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Reasons for Leaving
                  </p>
                  {resignationSupervisorReview.leavingReasons.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {resignationSupervisorReview.leavingReasons.map(
                        (reason) => (
                          <span
                            key={reason}
                            className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-800"
                          >
                            {reason}
                          </span>
                        ),
                      )}
                    </div>
                  ) : (
                    <p className="m-0 mt-2 text-sm text-gray-600">-</p>
                  )}
                  {resignationSupervisorReview.item.leaving_reason_other && (
                    <p className="m-0 mt-2 text-sm text-gray-700">
                      <span className="font-semibold">Others:</span>{" "}
                      {resignationSupervisorReview.item.leaving_reason_other}
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <p className="m-0 text-xs font-bold uppercase tracking-wider text-gray-500">
                  Step 3 • Exit Interview Responses
                </p>
                <p className="m-0 mt-2 text-sm text-gray-700">
                  Completed answers:{" "}
                  {
                    resignationSupervisorReview.interviewAnswers.filter(
                      (answer) => String(answer || "").trim(),
                    ).length
                  }
                  /16
                </p>
                <div className="mt-3 space-y-2">
                  {exitInterviewQuestions.map((question, index) => (
                    <div
                      key={question}
                      className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2"
                    >
                      <p className="m-0 text-xs font-semibold text-gray-700">
                        {index + 1}. {question}
                      </p>
                      <p className="m-0 mt-1 whitespace-pre-wrap text-sm text-gray-800">
                        {resignationSupervisorReview.interviewAnswers[index] ||
                          "No response."}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <p className="m-0 text-xs font-bold uppercase tracking-wider text-gray-500">
                  Step 4 • Endorsement Form Submission
                </p>
                <p className="m-0 mt-2 text-sm text-gray-800">
                  <span className="font-semibold">File Key:</span>{" "}
                  {resignationSupervisorReview.item.endorsement_file_key ||
                    "Not uploaded"}
                </p>
                {resignationSupervisorReview.item.endorsement_file_key && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await openUploadedFileByKey(
                          resignationSupervisorReview.item.endorsement_file_key,
                        );
                      } catch (error) {
                        showToast(
                          error.message ||
                            "Failed to preview uploaded endorsement form.",
                          "error",
                        );
                      }
                    }}
                    className="mt-2 rounded-md border border-indigo-200 bg-indigo-100 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-indigo-700 hover:bg-indigo-200"
                  >
                    Preview Endorsement File
                  </button>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-gray-200 bg-gray-50 px-5 py-3">
              <button
                type="button"
                onClick={keepResignationPendingUnderReview}
                className="rounded-md border border-amber-300 bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-200"
              >
                Keep Pending (Under Review)
              </button>
              <button
                type="button"
                disabled={reviewResignationMutation.isPending}
                onClick={approveResignationFromReview}
                className="rounded-md border border-emerald-700 bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Final Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {cancelApprovalConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-xl">
            <div className="border-b border-gray-200 px-4 py-3">
              <h3 className="m-0 text-base font-bold text-gray-900">
                Confirm Cancellation Request
              </h3>
            </div>
            <div className="space-y-3 px-4 py-3">
              <p className="m-0 text-sm text-gray-700">
                Submit this cancellation request for approver review?
              </p>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">
                  Reason (required)
                </label>
                <textarea
                  rows={3}
                  value={cancelApprovalConfirm.reason}
                  onChange={(e) =>
                    setCancelApprovalConfirm({
                      ...cancelApprovalConfirm,
                      reason: e.target.value,
                    })
                  }
                  className="w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Enter cancellation reason"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-200 bg-gray-50 px-4 py-3">
              <button
                type="button"
                onClick={() => setCancelApprovalConfirm(null)}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              <button
                type="button"
                disabled={requestCancellationApprovalMutation.isPending}
                onClick={() => {
                  submitCancellationRequest(
                    cancelApprovalConfirm.item,
                    cancelApprovalConfirm.reason,
                  );
                  if (String(cancelApprovalConfirm.reason || "").trim()) {
                    setCancelApprovalConfirm(null);
                  }
                }}
                className="rounded-md border border-amber-700 bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Confirm Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {cancelPendingConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-xl">
            <div className="border-b border-gray-200 px-4 py-3">
              <h3 className="m-0 text-base font-bold text-gray-900">
                Confirm Request Cancellation
              </h3>
            </div>
            <div className="space-y-2 px-4 py-3">
              <p className="m-0 text-sm text-gray-700">
                Are you sure you want to cancel this pending request?
              </p>
              <p className="m-0 text-xs text-gray-500">
                This action will remove the pending request.
              </p>
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-200 bg-gray-50 px-4 py-3">
              <button
                type="button"
                onClick={() => setCancelPendingConfirm(null)}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              <button
                type="button"
                disabled={cancelMyPendingRequestMutation.isPending}
                onClick={() => {
                  cancelMyPendingRequestMutation.mutate(cancelPendingConfirm);
                  setCancelPendingConfirm(null);
                }}
                className="rounded-md border border-red-700 bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {hrNoteConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-xl">
            <div className="border-b border-gray-200 px-4 py-3">
              <h3 className="m-0 text-base font-bold text-gray-900">
                Add HR Note for Supervisor
              </h3>
            </div>
            <div className="space-y-3 px-4 py-3">
              <p className="m-0 text-sm text-gray-700">
                Add guidance so supervisors under this designation can review
                this request.
              </p>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">
                  HR Note (required)
                </label>
                <textarea
                  rows={3}
                  value={hrNoteConfirm.note}
                  onChange={(e) =>
                    setHrNoteConfirm({
                      ...hrNoteConfirm,
                      note: e.target.value,
                    })
                  }
                  className="w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter HR note for supervisor review"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-200 bg-gray-50 px-4 py-3">
              <button
                type="button"
                onClick={() => setHrNoteConfirm(null)}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              <button
                type="button"
                disabled={addHrNoteMutation.isPending}
                onClick={() => {
                  const trimmedNote = String(hrNoteConfirm.note || "").trim();
                  if (!trimmedNote) {
                    showToast("HR note is required.", "error");
                    return;
                  }
                  addHrNoteMutation.mutate({
                    module: hrNoteConfirm.module,
                    id: hrNoteConfirm.item.id,
                    note: trimmedNote,
                  });
                  setHrNoteConfirm(null);
                }}
                className="rounded-md border border-indigo-700 bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Save & Notify
              </button>
            </div>
          </div>
        </div>
      )}

      {filePreviewOpen && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/60 p-4">
          <div className="flex h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
              <h3 className="m-0 text-sm font-bold text-gray-900">
                {filePreviewTitle || "Document Preview"}
              </h3>
              <button
                type="button"
                onClick={closeFilePreview}
                className="cursor-pointer rounded-md border-0 bg-transparent px-2 py-1 text-lg text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-auto bg-white p-4">
              {filePreviewLoading && (
                <div className="flex h-full items-center justify-center text-sm font-semibold text-gray-600">
                  Loading preview...
                </div>
              )}

              {!filePreviewLoading && filePreviewError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {filePreviewError}
                </div>
              )}

              {!filePreviewLoading && !filePreviewError && filePreviewHtml && (
                <div className="docx-preview rounded-lg border border-gray-200 bg-white p-4 text-sm leading-relaxed text-gray-800">
                  <div dangerouslySetInnerHTML={{ __html: filePreviewHtml }} />
                </div>
              )}

              {!filePreviewLoading &&
                !filePreviewError &&
                !filePreviewHtml &&
                filePreviewUrl && (
                  <iframe
                    title="Uploaded document preview"
                    src={filePreviewUrl}
                    className="h-full min-h-[68vh] w-full rounded-lg border border-gray-200"
                  />
                )}
            </div>
          </div>
        </div>
      )}

      <Toast toast={toast} onClose={clearToast} />
    </div>
  );
}
