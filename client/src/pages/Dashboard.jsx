import { useState, useEffect } from "react";
import { URL } from "../assets/constant";
import { useQuery } from "@tanstack/react-query";
export default function Dashboard() {
  const currentMonth = new Date().toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const priorityClass = {
    High: "bg-red-100 text-red-800",
    Medium: "bg-yellow-100 text-yellow-800",
    Low: "bg-blue-100 text-blue-800",
  };

  const priorityOrder = { High: 0, Medium: 1, Low: 2 };

  // Database States

  const [activeModal, setActiveModal] = useState(null);
  const [approvedLeaves, setApprovedLeaves] = useState(new Set());

  const fetchDashboardData = async () => {
    const res = await fetch(`${URL}/api/employees/dashboard-summary`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "69420", // <--- THIS IS REQUIRED FOR NGROK TO WORK
      },
    });
    const data = await res.json();

    return data;
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

  // Handles updating the database when Approve/Deny is clicked
  const handleUpdateLeaveStatus = async (id, newStatus) => {
    try {
      const res = await fetch(`${URL}/api/employees/leaves/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        // Visually show it was approved/denied in the modal without closing it
        setApprovedLeaves(new Set([...approvedLeaves, id]));
        // Refresh dashboard numbers in the background
        fetchDashboardData();
      } else {
        alert("Failed to update leave request");
      }
    } catch (error) {
      console.error("Error updating leave:", error);
    }
  };

  const closeModal = () => {
    setActiveModal(null);
    // Clear the visual "Approved" badges when modal closes so it's fresh next time
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

      {/* Leave Balance Summary */}
      <section className="mt-8 rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="m-0 text-lg font-semibold text-gray-900">
            Leave Balance Summary
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Employee Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Base Leave Allocation
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Remaining Balance
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Offset Credits
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {dashboardQuery.data.balances.map((employee, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-gray-50 transition-colors duration-150"
                >
                  <td className="px-6 py-3 text-sm font-medium text-gray-900">
                    {employee.first_name} {employee.last_name}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-700">
                    {employee.status === "Job Order" ? "12 Days" : "27 Days"}
                  </td>
                  <td className="px-6 py-3 text-sm">
                    <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                      {employee.leave_balance} Days
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm">
                    <span className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-800">
                      {employee.offset_credits} Credits
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
