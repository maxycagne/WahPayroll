import React from "react";
import { DailyAttendance } from "../types";
import { badgeClass, designationMap } from "../utils";

interface DateDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string | null;
  loading: boolean;
  filteredDaily: DailyAttendance[];
  search: string;
  setSearch: (val: string) => void;
  designation: string;
  setDesignation: (val: string) => void;
  position: string;
  setPosition: (val: string) => void;
  status: string;
  setStatus: (val: string) => void;
  canEdit: boolean;
  onEdit: () => void;
}

export const DateDetailsModal: React.FC<DateDetailsModalProps> = ({
  isOpen,
  onClose,
  date,
  loading,
  filteredDaily,
  search,
  setSearch,
  designation,
  setDesignation,
  position,
  setPosition,
  status,
  setStatus,
  canEdit,
  onEdit,
}) => {
  if (!isOpen || !date) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-700 px-5 py-3 text-white">
          <div>
            <h2 className="m-0 text-sm font-bold">Date Details</h2>
            <p className="m-0 mt-0.5 text-xs text-white/80">
              {new Date(date + "T00:00:00").toLocaleDateString(undefined, {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer rounded-md border border-white/20 bg-white/5 px-3 py-1 text-sm font-semibold text-white transition-colors hover:bg-white/20"
          >
            Close
          </button>
        </div>
        <div className="p-4 pb-2 space-y-2">
          <input
            type="text"
            placeholder="Search employee..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="flex flex-wrap gap-2">
            <select
              value={designation}
              onChange={(e) => {
                setDesignation(e.target.value);
                setPosition("All");
              }}
              className="flex-1 min-w-[120px] rounded-lg border border-slate-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-2 py-1.5 text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">All Designations</option>
              {Object.keys(designationMap).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <select
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="flex-1 min-w-[120px] rounded-lg border border-slate-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-2 py-1.5 text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">All Positions</option>
              {designation !== "All" && designationMap[designation]
                ? designationMap[designation].map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))
                : Object.values(designationMap)
                    .flat()
                    .map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
            </select>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="flex-1 min-w-[100px] rounded-lg border border-slate-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-2 py-1.5 text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">All Status</option>
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="On Leave">On Leave</option>
              <option value="Late">Late</option>
              <option value="Undertime">Undertime</option>
              <option value="Half-Day">Half-Day</option>
              <option value="No Status">No Status</option>
            </select>
          </div>
        </div>
        <div className="max-h-[50vh] overflow-y-auto px-4 pb-4">
          {loading ? (
            <p className="py-6 text-center text-sm font-semibold text-slate-500 dark:text-gray-400">Loading attendance...</p>
          ) : filteredDaily.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500 dark:text-gray-400">No attendance records for this date.</p>
          ) : (
            <div className="space-y-2">
              <p className="m-0 text-[11px] font-semibold text-slate-400 dark:text-gray-500">
                {filteredDaily.length} employee{filteredDaily.length !== 1 ? "s" : ""}
              </p>
              {filteredDaily.map((emp) => {
                const primary = emp.attendance_status || "";
                const secondary = emp.status2 || "";
                const statusLabel = [primary, secondary].filter(Boolean).join(", ") || "No Status";
                const statusColor = badgeClass[primary] || badgeClass[""];
                return (
                  <div
                    key={emp.emp_id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 dark:border-gray-800 bg-slate-50/80 dark:bg-gray-800 px-4 py-3"
                  >
                    <div>
                      <p className="m-0 text-sm font-bold text-slate-900 dark:text-gray-100">{emp.first_name} {emp.last_name}</p>
                      <p className="m-0 text-[11px] text-slate-500 dark:text-gray-400">
                        {[emp.designation, emp.position].filter(Boolean).join(" • ") || emp.emp_id}
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${statusColor}`}>
                      {statusLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {canEdit && (
          <div className="border-t border-slate-200 dark:border-gray-800 bg-slate-50 dark:bg-gray-800/50 px-4 py-3 flex justify-end">
            <button
              onClick={onEdit}
              className="cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-indigo-700"
            >
              Edit Attendance
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
