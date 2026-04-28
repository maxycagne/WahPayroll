import React from "react";
import { DailyAttendance, AttendanceStatus } from "../types";
import { badgeClass } from "../utils";

interface DailyAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string | null;
  loading: boolean;
  filteredDaily: DailyAttendance[];
  attendanceForm: Record<string, AttendanceStatus>;
  setAttendanceForm: (val: Record<string, AttendanceStatus>) => void;
  secondaryStatusForm: Record<string, AttendanceStatus>;
  setSecondaryStatusForm: (val: Record<string, AttendanceStatus>) => void;
  search: string;
  setSearch: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  overview: any;
  selectedEmployees: Set<string>;
  toggleEmployeeSelection: (id: string) => void;
  toggleAllSelected: () => void;
  bulkStatus: string;
  setBulkStatus: (val: string) => void;
  applyBulkStatus: () => void;
  markAllPresent: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isSaving: boolean;
  canEdit: boolean;
}

export const DailyAttendanceModal: React.FC<DailyAttendanceModalProps> = ({
  isOpen,
  onClose,
  date,
  loading,
  filteredDaily,
  attendanceForm,
  setAttendanceForm,
  secondaryStatusForm,
  setSecondaryStatusForm,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  overview,
  selectedEmployees,
  toggleEmployeeSelection,
  toggleAllSelected,
  bulkStatus,
  setBulkStatus,
  applyBulkStatus,
  markAllPresent,
  onSubmit,
  isSaving,
  canEdit,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-700 px-5 py-3 text-white">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="m-0 text-base font-bold">Attendance for {date}</h2>
              <p className="m-0 mt-0.5 text-[11px] text-white/80">
                Review, filter, and manage personnel attendance records.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold tracking-wide text-white/90">
                {canEdit ? "Edit Mode" : "View Mode"}
              </div>
              <button
                onClick={onClose}
                className="cursor-pointer rounded-md border border-white/20 bg-white/5 px-2 py-0.5 text-lg text-white transition-colors hover:bg-white/10 hover:text-slate-200"
              >
                &times;
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden bg-slate-50/60 dark:bg-gray-800/20 p-3">
          {!canEdit && (
            <div className="mb-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">
              View-only mode: Supervisors can view attendance records but cannot
              edit them.
            </div>
          )}

          <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1">
            <div className="shrink-0 rounded-md border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1 text-[11px] font-semibold text-slate-700 dark:text-gray-300">
              Total: {overview.total}
            </div>
            <div className="shrink-0 rounded-md border border-blue-200 dark:border-blue-900/30 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 text-[11px] font-semibold text-blue-700 dark:text-blue-400">
              Assigned: {overview.assigned}
            </div>
            <div className="shrink-0 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2 py-1 text-[11px] font-semibold text-gray-700 dark:text-gray-300">
              Unassigned: {overview.unassigned}
            </div>
            <div className="shrink-0 rounded-md border border-green-200 dark:border-green-900/30 bg-green-50 dark:bg-green-900/20 px-2 py-1 text-[11px] font-semibold text-green-700 dark:text-green-400">
              Present: {overview.present}
            </div>
            <div className="shrink-0 rounded-md border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/20 px-2 py-1 text-[11px] font-semibold text-red-700 dark:text-red-400">
              Absent: {overview.absent}
            </div>
            <div className="shrink-0 rounded-md border border-purple-200 dark:border-purple-900/30 bg-purple-50 dark:bg-purple-900/20 px-2 py-1 text-[11px] font-semibold text-purple-700 dark:text-purple-400">
              On Leave: {overview.onLeave}
            </div>
            <div className="shrink-0 rounded-md border border-amber-200 dark:border-amber-900/30 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
              Late: {overview.late}
            </div>
            <div className="shrink-0 rounded-md border border-rose-200 dark:border-rose-900/30 bg-rose-50 dark:bg-rose-900/20 px-2 py-1 text-[11px] font-semibold text-rose-700 dark:text-rose-400">
              Under/Half: {overview.undertime + overview.halfDay}
            </div>
          </div>

          <div className="mb-2 flex shrink-0 flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-2">
            <input
              type="text"
              placeholder="Search personnel..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-56 rounded-lg border border-slate-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-1 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-1 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">All Status Types</option>
              <option value="None">Unassigned</option>
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="On Leave">On Leave</option>
              <option value="Late">Late</option>
              <option value="Undertime">Undertime</option>
              <option value="Half-Day">Half-Day</option>
            </select>
          </div>

          {canEdit && (
            <div className="mb-2 flex shrink-0 flex-wrap items-center justify-between gap-2 rounded-lg border border-indigo-100 dark:border-indigo-900/30 bg-indigo-50 dark:bg-indigo-900/20 p-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-indigo-800 dark:text-indigo-300">
                  Selected: {selectedEmployees.size}
                </span>
                <select
                  value={bulkStatus}
                  onChange={(e) => setBulkStatus(e.target.value)}
                  className="rounded border border-slate-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-2 py-1 text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Select --</option>
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                  <option value="On Leave">On Leave</option>
                </select>
                <button
                  onClick={applyBulkStatus}
                  disabled={selectedEmployees.size === 0}
                  className="cursor-pointer rounded bg-indigo-600 px-3 py-1 text-xs font-bold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
                >
                  Apply
                </button>
              </div>
              <button
                onClick={markAllPresent}
                className="cursor-pointer rounded border border-emerald-200 dark:border-emerald-900/30 bg-emerald-100 dark:bg-emerald-900/20 px-3 py-1 text-xs font-bold text-emerald-800 dark:text-emerald-400 transition-colors hover:bg-emerald-200 dark:hover:bg-emerald-900/40"
              >
                ✓ Mark Unassigned as Present
              </button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto rounded-xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
            <table className="w-full text-xs text-left">
              <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-gray-800 shadow-sm">
                <tr>
                  <th className="px-3 py-1.5 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={
                        selectedEmployees.size > 0 &&
                        selectedEmployees.size === filteredDaily.length
                      }
                      onChange={toggleAllSelected}
                      disabled={!canEdit}
                      className="w-4 h-4 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </th>
                  <th className="px-3 py-1.5 font-semibold text-gray-700 dark:text-gray-300 uppercase text-[11px]">
                    Employee
                  </th>
                  <th className="px-3 py-1.5 font-semibold text-gray-700 dark:text-gray-300 uppercase text-[11px]">
                    Designation
                  </th>
                  <th className="px-3 py-1.5 font-semibold text-gray-700 dark:text-gray-300 uppercase text-[11px]">
                    Primary Status
                  </th>
                  <th className="px-3 py-1.5 font-semibold text-gray-700 dark:text-gray-300 uppercase text-[11px]">
                    Secondary (Opt.)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-4 text-center font-bold text-gray-500"
                    >
                      Loading List...
                    </td>
                  </tr>
                ) : filteredDaily.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-gray-500">
                      No personnel found.
                    </td>
                  </tr>
                ) : (
                  filteredDaily.map((emp) => {
                    const isChecked = selectedEmployees.has(emp.emp_id);
                    return (
                      <tr
                        key={emp.emp_id}
                        className={`text-xs transition-colors hover:bg-slate-50 dark:hover:bg-gray-800/50 ${isChecked ? "bg-indigo-50/60 dark:bg-indigo-900/30" : ""}`}
                      >
                        <td className="px-3 py-1.5 text-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleEmployeeSelection(emp.emp_id)}
                            disabled={!canEdit}
                            className="w-4 h-4 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                          />
                        </td>
                        <td className="px-3 py-1.5">
                          <p className="font-bold m-0 text-gray-900 dark:text-gray-100 text-xs">
                            {emp.first_name} {emp.last_name}
                          </p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 m-0">
                            {emp.emp_id}
                          </p>
                        </td>
                        <td className="px-3 py-1.5 text-gray-600 dark:text-gray-400 text-xs">
                          {emp.emp_status}
                        </td>
                        <td className="px-3 py-1.5">
                          <select
                            value={attendanceForm[emp.emp_id] || ""}
                            onChange={(e) => {
                              if (!canEdit) return;
                              const nextPrimary = e.target
                                .value as AttendanceStatus;
                              setAttendanceForm({
                                ...attendanceForm,
                                [emp.emp_id]: nextPrimary,
                              });
                              if (nextPrimary === "Absent") {
                                setSecondaryStatusForm({
                                  ...secondaryStatusForm,
                                  [emp.emp_id]: "",
                                });
                              }
                            }}
                            disabled={!canEdit}
                            className={`border p-1 rounded outline-none font-semibold max-w-[90px] text-xs disabled:cursor-not-allowed disabled:opacity-60 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${badgeClass[attendanceForm[emp.emp_id]] || badgeClass[""]}`}
                          >
                            <option value="">-- None --</option>
                            <option value="Present">Present</option>
                            <option value="Absent">Absent</option>
                            <option value="On Leave">On Leave</option>
                          </select>
                        </td>
                        <td className="px-3 py-1.5">
                          <select
                            value={secondaryStatusForm[emp.emp_id] || ""}
                            onChange={(e) =>
                              setSecondaryStatusForm({
                                ...secondaryStatusForm,
                                [emp.emp_id]: e.target
                                  .value as AttendanceStatus,
                              })
                            }
                            disabled={
                              !canEdit ||
                              attendanceForm[emp.emp_id] === "Absent"
                            }
                            className={`border p-1 rounded outline-none font-semibold max-w-[140px] text-xs disabled:cursor-not-allowed disabled:opacity-60 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${badgeClass[secondaryStatusForm[emp.emp_id]] || badgeClass[""]}`}
                          >
                            <option value="">-- None --</option>
                            <option value="Late">Late</option>
                            <option value="Undertime">Undertime</option>
                            <option value="Half-Day">Half-Day</option>
                            <option value="No-notice-via-text">
                              No notice via text
                            </option>
                            <option value="No-notice-email">
                              No notice via email
                            </option>
                          </select>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-2 flex shrink-0 justify-end gap-2 border-t border-slate-200 dark:border-gray-800 pt-2">
            <button
              onClick={onClose}
              className="cursor-pointer rounded-lg border border-slate-300 dark:border-gray-700 px-4 py-1.5 text-sm font-semibold text-slate-600 dark:text-gray-300 transition-colors hover:bg-slate-100 dark:hover:bg-gray-800"
            >
              Close
            </button>
            <button
              onClick={onSubmit}
              disabled={!canEdit || isSaving}
              className="cursor-pointer rounded-lg border-0 bg-indigo-700 px-4 py-1.5 text-sm font-bold text-white transition-colors hover:bg-indigo-800 disabled:opacity-50"
            >
              {!canEdit
                ? "View Only"
                : isSaving
                  ? "Saving..."
                  : "Save Attendance"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
