import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api";

// ==========================================
// 1. RANK & FILE (EMPLOYEE) DASHBOARD
// ==========================================
function EmployeeDashboard({ currentUser }) {
  const navigate = useNavigate();

  // Fetch Dashboard Summary (For Balances & Missing Docs)
  const { data: dashboardData, isLoading: dashLoading } = useQuery({
    queryKey: ["dashboardSummary"],
    queryFn: async () => {
      const res = await apiFetch("/api/employees/dashboard-summary");
      if (!res.ok) throw new Error("Failed to fetch dashboard data");
      return res.json();
    },
  });

  // Fetch Personal Attendance
  const { data: myAttendance = [], isLoading: attLoading } = useQuery({
    queryKey: ["my-attendance", currentUser?.emp_id],
    queryFn: async () => {
      const res = await apiFetch(`/api/employees/my-attendance`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Fetch Personal Leaves
  const { data: myLeaves = [] } = useQuery({
    queryKey: ["leaves"],
    queryFn: async () => {
      const res = await apiFetch("/api/employees/leaves");
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Fetch Personal Offsets
  const { data: myOffsets = [] } = useQuery({
    queryKey: ["offset-applications"],
    queryFn: async () => {
      const res = await apiFetch("/api/employees/offset-applications");
      if (!res.ok) return [];
      return res.json();
    },
  });

  if (dashLoading || attLoading) {
    return (
      <div className="p-6 font-bold text-gray-800">Loading My Dashboard...</div>
    );
  }

  // Find user's specific data from the summary
  const myBalanceRecord = dashboardData?.balances?.find(
    (b) => String(b.emp_id) === String(currentUser.emp_id),
  );
  const myMissingDocsRecord = dashboardData?.missingDocs?.find(
    (d) => String(d.emp_id) === String(currentUser.emp_id),
  );

  // Compile Pending Requests
  // Compile Pending Requests (FIXED: Added fallbacks so it never says "Invalid Date")
  const pendingRequests = [
    ...myLeaves
      .filter((l) => l.status === "Pending")
      .map((l) => ({
        id: `l-${l.id}`,
        type: "Leave",
        title: l.leave_type,
        date: l.created_at || l.date_from || new Date().toISOString(), // Fallback to date_from
      })),
    ...myOffsets
      .filter((o) => o.status === "Pending")
      .map((o) => ({
        id: `o-${o.id}`,
        type: "Offset",
        title: `${Number(o.days_applied)} Days Applied`,
        date: o.created_at || o.date_from || new Date().toISOString(), // Fallback to date_from
      })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  const badgeClass = {
    Present: "bg-green-100 text-green-800",
    Late: "bg-amber-100 text-amber-800",
    Undertime: "bg-rose-100 text-rose-800",
    "Half-Day": "bg-orange-100 text-orange-800",
    Absent: "bg-red-100 text-red-800",
    "On Leave": "bg-purple-100 text-purple-800",
  };
  console.log("My Logs:", currentUser?.first_name);

  return (
    <div className="max-w-full space-y-6">
      <div>
        <h1 className="m-0 text-[1.5rem] font-bold text-gray-900">
          Welcome back, {currentUser?.first_name || "Employee"}!
        </h1>
        <p className="m-0 text-sm text-gray-500 mt-1">
          Here is what is happening with your account today.
        </p>
      </div>
      {/* ALERT: Missing Documents */}
      {myMissingDocsRecord && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-start gap-3 shadow-sm">
          <span className="text-xl">⚠️</span>
          <div>
            <h3 className="m-0 text-sm font-bold text-red-800 mb-1">
              Action Required: Missing Documents
            </h3>
            <p className="m-0 text-xs text-red-700">
              HR has flagged your profile for missing requirements:{" "}
              <span className="font-bold">
                {myMissingDocsRecord.missing_docs}
              </span>
              . Please submit these as soon as possible.
            </p>
          </div>
        </div>
      )}
      {/* STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm border-t-4 border-t-green-500 flex flex-col justify-between">
          <p className="m-0 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            Leave Balance
          </p>
          <div className="flex items-baseline gap-2">
            <h2 className="m-0 text-4xl font-black text-gray-900">
              {myBalanceRecord?.leave_balance || 0}
            </h2>
            <span className="text-sm font-medium text-gray-500">
              Days Remaining
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm border-t-4 border-t-purple-500 flex flex-col justify-between">
          <p className="m-0 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            Offset Credits
          </p>
          <div className="flex items-baseline gap-2">
            <h2 className="m-0 text-4xl font-black text-gray-900">
              {myBalanceRecord?.offset_credits || 0}
            </h2>
            <span className="text-sm font-medium text-gray-500">
              Earned Credits
            </span>
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => navigate("/leave")}
            className="flex-1 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 flex items-center gap-3 px-4 cursor-pointer transition-colors"
          >
            <span className="text-xl">📅</span>
            <span className="text-sm font-bold text-gray-800">
              File a Leave Request
            </span>
          </button>
          <button
            onClick={() => navigate("/leave")}
            className="flex-1 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 flex items-center gap-3 px-4 cursor-pointer transition-colors"
          >
            <span className="text-xl">⏱️</span>
            <span className="text-sm font-bold text-gray-800">
              File an Offset
            </span>
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* RECENT ATTENDANCE */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="border-b border-gray-200 bg-gray-50 px-5 py-3">
            <h3 className="m-0 text-sm font-bold text-gray-900">
              Recent Attendance (Last 5 Days)
            </h3>
          </div>
          <div className="flex-1 p-5">
            {myAttendance.length === 0 ? (
              <p className="text-sm text-gray-500 italic text-center py-4">
                No recent attendance records found.
              </p>
            ) : (
              <div className="space-y-3">
                {myAttendance.slice(0, 5).map((log, idx) => {
                  // Fallback for compound statuses like "Present, Late"
                  const primaryStatus =
                    log.status?.split(",")[0]?.trim() || "Pending";
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0"
                    >
                      <div>
                        <p className="m-0 text-sm font-semibold text-gray-800">
                          {new Date(log.date).toLocaleDateString(undefined, {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${badgeClass[primaryStatus] || badgeClass["Pending"]}`}
                      >
                        {log.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            <button
              onClick={() => navigate("/attendance")}
              className="w-full mt-4 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-xs font-bold text-gray-600 border border-gray-200 transition-colors cursor-pointer"
            >
              View Full Calendar
            </button>
          </div>
        </div>

        {/* PENDING REQUESTS TRACKER */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="border-b border-gray-200 bg-gray-50 px-5 py-3 flex justify-between items-center">
            <h3 className="m-0 text-sm font-bold text-gray-900">
              My Pending Requests
            </h3>
            <span className="bg-yellow-100 text-yellow-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
              {pendingRequests.length} Pending
            </span>
          </div>
          <div className="flex-1 p-5 overflow-y-auto max-h-[300px]">
            {pendingRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <span className="text-3xl mb-2">🎉</span>
                <p className="m-0 text-sm font-semibold text-gray-700">
                  You are all caught up!
                </p>
                <p className="m-0 text-xs text-gray-500 mt-1">
                  No pending requests waiting for approval.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50/50"
                  >
                    <div className="mt-1">
                      {req.type === "Leave" ? "📅" : "⏱️"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="m-0 text-sm font-bold text-gray-900">
                        {req.type} Request
                      </p>
                      <p className="m-0 text-xs text-gray-600">{req.title}</p>
                      <p className="m-0 text-[10px] text-gray-400 mt-1">
                        Filed on {new Date(req.date).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="bg-yellow-100 text-yellow-800 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                      Pending
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 2. ADMIN / HR / SUPERVISOR DASHBOARD
// ==========================================
function AdminDashboard({ currentUser }) {
  const [activeModal, setActiveModal] = useState(null);
  const [approvedLeaves, setApprovedLeaves] = useState(new Set());

  const fetchDashboardData = async () => {
    const res = await apiFetch("/api/employees/dashboard-summary", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    return await res.json();
  };

  const dashboardQuery = useQuery({
    queryKey: ["dashboardSummary"],
    queryFn: fetchDashboardData,
  });

  const cards = [
    {
      label: "Pending Leave Approval",
      value: dashboardQuery.data?.pendingLeaves?.length || 0,
      borderColor: "#5a1ea2",
      clickable: true,
      modalKey: "pending",
    },
    {
      label: "On Leave",
      value: dashboardQuery.data?.onLeave?.length || 0,
      borderColor: "#d4a017",
      clickable: true,
      modalKey: "leave",
    },
    {
      label: "Absent",
      value: dashboardQuery.data?.absents?.length || 0,
      borderColor: "#c0392b",
      clickable: true,
      modalKey: "absent",
    },
    {
      label: "Recent Activity",
      value: dashboardQuery.data?.recentActivities?.length || 0,
      borderColor: "#0066cc",
      clickable: true,
      modalKey: "recent-activity",
    },
  ];

  const priorityClass = {
    High: "bg-red-100 text-red-800",
    Medium: "bg-yellow-100 text-yellow-800",
    Low: "bg-blue-100 text-blue-800",
  };

  const priorityOrder = { High: 0, Medium: 1, Low: 2 };

  const handleUpdateLeaveStatus = async (id, newStatus) => {
    try {
      const res = await apiFetch(`/api/employees/leaves/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setApprovedLeaves(new Set([...approvedLeaves, id]));
        // Note: For a true refresh, use queryClient.invalidateQueries(["dashboardSummary"])
        // if you import useQueryClient. Otherwise, this visual state handles it.
      } else {
        alert("Failed to update leave request");
      }
    } catch (error) {
      console.error("Error updating leave:", error);
    }
  };

  const closeModal = () => {
    setActiveModal(null);
    setApprovedLeaves(new Set());
  };

  if (dashboardQuery.isLoading)
    return (
      <div className="p-6 text-gray-900 font-bold">Loading Dashboard...</div>
    );

  return (
    <div className="max-w-full">
      <h1 className="m-0 text-[1.4rem] font-bold text-gray-900">Dashboard</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
        {cards.map((c) => (
          <button
            key={c.label}
            type="button"
            onClick={() => c.clickable && setActiveModal(c.modalKey)}
            disabled={!c.clickable}
            className={`group relative rounded-lg border border-gray-200 bg-white shadow-sm transition-all duration-200 ${
              c.clickable
                ? "hover:shadow-md hover:-translate-y-1 cursor-pointer hover:border-gray-300"
                : "cursor-default"
            }`}
            style={{ borderTop: `4px solid ${c.borderColor}` }}
          >
            <div className="p-5 text-left">
              <p className="m-0 text-sm font-medium text-gray-600 mb-2">
                {c.label}
              </p>
              <p
                className="m-0 text-3xl font-bold"
                style={{ color: c.borderColor }}
              >
                {c.value}
              </p>
              {c.clickable && (
                <p className="m-0 text-xs text-gray-400 mt-2 group-hover:text-gray-500">
                  Click to view
                </p>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Modal Dialog */}
      {activeModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          onClick={closeModal}
        >
          <div
            className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-gray-200 bg-white p-0 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:-translate-y-1/2 data-[state=open]:translate-y-[-50%] rounded-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-purple-200 px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-700">
              <h2 className="m-0 text-lg font-semibold text-white">
                {activeModal === "pending"
                  ? `Pending Leave Approvals`
                  : activeModal === "leave"
                    ? `Employees On Leave`
                    : activeModal === "absent"
                      ? `Absent Employees`
                      : `Recent Activity`}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="inline-flex h-8 w-8 items-center justify-center rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 disabled:pointer-events-none text-white/80 hover:text-white"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto px-6 py-4 max-h-[60vh]">
              {activeModal === "pending" && (
                <div className="space-y-3">
                  {[...(dashboardQuery.data.pendingLeaves || [])]
                    .sort(
                      (a, b) =>
                        priorityOrder[a.priority] - priorityOrder[b.priority],
                    )
                    .map((employee) => (
                      <div
                        key={employee.id}
                        className="flex items-start gap-4 rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors duration-150"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-600 font-semibold text-sm">
                          {employee.first_name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="m-0 text-sm font-semibold text-gray-900">
                            {employee.first_name} {employee.last_name}
                          </p>
                          <p className="m-0 text-xs text-gray-600 mt-1">
                            {employee.leave_type}
                          </p>
                          <p className="m-0 text-xs text-gray-500 mt-0.5">
                            Dates:{" "}
                            {new Date(employee.date_from).toLocaleDateString()}{" "}
                            - {new Date(employee.date_to).toLocaleDateString()}
                          </p>
                          <p
                            className={`m-0 text-xs font-medium mt-1 inline-flex items-center rounded-full px-2 py-0.5 ${priorityClass[employee.priority] || "bg-gray-100 text-gray-800"}`}
                          >
                            Priority: {employee.priority}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {!approvedLeaves.has(employee.id) ? (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateLeaveStatus(
                                    employee.id,
                                    "Approved",
                                  )
                                }
                                className="inline-flex items-center rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-green-700 transition-colors duration-150"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateLeaveStatus(employee.id, "Denied")
                                }
                                className="inline-flex items-center rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-red-700 transition-colors duration-150"
                              >
                                Deny
                              </button>
                            </>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 whitespace-nowrap">
                              Processed
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {activeModal === "leave" && (
                <div className="space-y-3">
                  {dashboardQuery.data?.onLeave?.map((employee, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-4 rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors duration-150"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600 font-semibold text-sm">
                        {employee.first_name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="m-0 text-sm font-semibold text-gray-900">
                          {employee.first_name} {employee.last_name}
                        </p>
                        <p className="m-0 text-xs text-gray-600 mt-1">
                          {employee.leave_type}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeModal === "absent" && (
                <div className="space-y-3">
                  {dashboardQuery.data?.absents?.map((employee, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-4 rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors duration-150"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600 font-semibold text-sm">
                        {employee.first_name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="m-0 text-sm font-semibold text-gray-900">
                          {employee.first_name} {employee.last_name}
                        </p>
                        <p className="m-0 text-xs text-gray-600 mt-1">
                          No time-in recorded for today.
                        </p>
                      </div>
                      <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 whitespace-nowrap">
                        Absent
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {activeModal === "recent-activity" && (
                <div className="space-y-3">
                  {dashboardQuery.data?.recentActivities.map(
                    (activity, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors duration-150"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="m-0 text-sm text-gray-500">
                              {activity.date}
                            </p>
                            <p className="m-0 text-sm font-semibold text-gray-900 mt-1">
                              {activity.employee}
                            </p>
                          </div>
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                              activity.status === "Pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : activity.status === "Approved"
                                  ? "bg-green-100 text-green-800"
                                  : activity.status === "Denied"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {activity.status}
                          </span>
                        </div>
                        <div className="mt-2">
                          <p className="m-0 text-xs font-medium text-gray-600">
                            Activity Type:{" "}
                            <span className="text-gray-900">
                              {activity.type}
                            </span>
                          </p>
                          <p className="m-0 text-xs text-gray-700 mt-1">
                            {activity.activity}
                          </p>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4 bg-gray-50">
              <button
                type="button"
                onClick={closeModal}
                className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 transition-colors duration-150"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 3. MAIN EXPORT HANDLER
// ==========================================
export default function Dashboard() {
  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("wah_user") || "{}");
    } catch {
      return {};
    }
  }, []);

  // Show personalized dashboard for regular employees
  if (currentUser?.role === "RankAndFile") {
    return <EmployeeDashboard currentUser={currentUser} />;
  }

  // Show Admin view for Admin/HR/Supervisor
  return <AdminDashboard currentUser={currentUser} />;
}
