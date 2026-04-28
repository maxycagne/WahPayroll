import React from "react";
import { formatLongDate } from "@/features/leave/utils/date.utils";

interface ApprovalsModalProps {
  activeModal: string;
  dashboardData: any;
  closeModal: () => void;
  approvedLeaves: Set<any>;
  openLeaveDecisionConfirm: (emp: any) => void;
  attendanceTotals: any;
  period: string;
  pendingLeaveCount: number;
  pendingResignationCount: number;
  onLeaveCount: number;
}

export const ApprovalsModal: React.FC<ApprovalsModalProps> = ({
  activeModal,
  dashboardData,
  closeModal,
  approvedLeaves,
  openLeaveDecisionConfirm,
  attendanceTotals,
  period,
  pendingLeaveCount,
  pendingResignationCount,
  onLeaveCount,
}) => {
  const priorityClass: Record<string, string> = {
    High: "bg-red-100 text-red-800",
    Medium: "bg-yellow-100 text-yellow-800",
    Low: "bg-blue-100 text-blue-800",
  };

  const priorityOrder: Record<string, number> = { High: 0, Medium: 1, Low: 2 };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
      onClick={closeModal}
    >
      <div
        className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-xl translate-x-[-50%] translate-y-[-50%] gap-3 rounded-xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-0 shadow-xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:-translate-y-1/2 data-[state=open]:translate-y-[-50%]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-violet-200 dark:border-violet-900/50 bg-gradient-to-r from-[#4e1b8a] to-[#6630b0] px-4 py-3">
          <h2 className="m-0 text-base font-semibold text-white">
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
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-white/80 opacity-80 ring-offset-white transition-all duration-200 hover:bg-white/10 hover:text-white hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:ring-offset-2 disabled:pointer-events-none"
          >
            <span className="text-xl">×</span>
          </button>
        </div>

        <div className="overflow-y-auto px-4 py-3 max-h-[56vh]">
          {activeModal === "pending" && (
            <div className="space-y-2.5">
              {[...(dashboardData?.pendingLeaves || [])]
                .sort(
                  (a, b) =>
                    priorityOrder[a.priority] - priorityOrder[b.priority]
                )
                .map((employee) => (
                  <div
                    key={employee.id}
                    className="flex items-start gap-3 rounded-lg border border-gray-200 dark:border-gray-800 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-200 dark:hover:border-violet-900/50 hover:bg-violet-50/30 dark:hover:bg-violet-900/10 hover:shadow-sm"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 font-semibold text-xs">
                      {employee.first_name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="m-0 text-[13px] font-semibold text-gray-900 dark:text-gray-100">
                        {employee.first_name} {employee.last_name}
                      </p>
                      <p className="m-0 mt-0.5 text-xs text-gray-600 dark:text-gray-400">
                        {employee.leave_type}
                      </p>
                      <p className="m-0 mt-0.5 text-[11px] text-gray-500 dark:text-gray-500">
                        Dates: {formatLongDate(employee.date_from)} -{" "}
                        {formatLongDate(employee.date_to)}
                      </p>
                      <p
                        className={`m-0 mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${priorityClass[employee.priority] || "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300"}`}
                      >
                        Priority: {employee.priority}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {!approvedLeaves.has(employee.id) ? (
                        <button
                          type="button"
                          onClick={() => openLeaveDecisionConfirm(employee)}
                          className="inline-flex items-center rounded-md bg-indigo-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm transition-all duration-200 hover:bg-indigo-700 hover:shadow active:translate-y-px"
                        >
                          Review Application
                        </button>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:text-gray-300 whitespace-nowrap">
                          Processed
                        </span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}

          {activeModal === "leave" && (
            <div className="space-y-2.5">
              {dashboardData?.onLeave?.map((employee: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 rounded-lg border border-gray-200 dark:border-gray-800 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-200 dark:hover:border-amber-900/50 hover:bg-amber-50/40 dark:hover:bg-amber-900/10 hover:shadow-sm"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 font-semibold text-xs">
                    {employee.first_name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="m-0 text-[13px] font-semibold text-gray-900 dark:text-gray-100">
                      {employee.first_name} {employee.last_name}
                    </p>
                    <p className="m-0 mt-0.5 text-xs text-gray-600 dark:text-gray-400">
                      {employee.leave_type}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeModal === "absent" && (
            <div className="space-y-2.5">
              {dashboardData?.absents?.map((employee: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 rounded-lg border border-gray-200 dark:border-gray-800 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-red-200 dark:hover:border-red-900/50 hover:bg-red-50/30 dark:hover:bg-red-900/10 hover:shadow-sm"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-semibold text-xs">
                    {employee.first_name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="m-0 text-[13px] font-semibold text-gray-900 dark:text-gray-100">
                      {employee.first_name} {employee.last_name}
                    </p>
                    <p className="m-0 mt-0.5 text-xs text-gray-600 dark:text-gray-400">
                      No time-in recorded for today.
                    </p>
                  </div>
                  <span className="inline-flex items-center whitespace-nowrap rounded-full bg-red-100 dark:bg-red-900/30 px-2.5 py-0.5 text-[10px] font-semibold text-red-800 dark:text-red-400">
                    Absent
                  </span>
                </div>
              ))}
            </div>
          )}

          {activeModal === "recent-activity" && (
            <div className="space-y-3">
              {dashboardData?.recentActivities?.map(
                (activity: any, idx: number) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="m-0 text-sm text-gray-500 dark:text-gray-500">
                          {activity.date}
                        </p>
                        <p className="m-0 text-sm font-semibold text-gray-900 dark:text-gray-100 mt-1">
                          {activity.employee}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                          activity.status === "Pending"
                            ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400"
                            : activity.status === "Approved"
                              ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400"
                              : activity.status === "Denied"
                                ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400"
                                : "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400"
                        }`}
                      >
                        {activity.status}
                      </span>
                    </div>
                    <div className="mt-2">
                      <p className="m-0 text-xs font-medium text-gray-600 dark:text-gray-400">
                        Activity Type:{" "}
                        <span className="text-gray-900 dark:text-gray-200">
                          {activity.type}
                        </span>
                      </p>
                      <p className="m-0 text-xs text-gray-700 dark:text-gray-300 mt-1">
                        {activity.activity}
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 px-4 py-3">
          <button
            type="button"
            onClick={closeModal}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 shadow-sm transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow active:translate-y-px focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
