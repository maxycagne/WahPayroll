import React from "react";
import { AttendanceStats as AttendanceStatsType } from "../types";
import { formatMonthLabel, formatLeaveDays } from "../utils";

interface AttendanceStatsProps {
  mode: string;
  setMode: (mode: "month" | "range" | "year") => void;
  month: string;
  setMonth: (month: string) => void;
  rangeStart: string;
  setRangeStart: (month: string) => void;
  rangeEnd: string;
  setRangeEnd: (month: string) => void;
  year: string;
  setYear: (year: string) => void;
  statsLabel: string;
  isLoading: boolean;
  topAbsenceEmployees: AttendanceStatsType[];
  topApprovedLeaveEmployees: AttendanceStatsType[];
  lowestLeaveBalanceEmployees: AttendanceStatsType[];
}

export const AttendanceStats: React.FC<AttendanceStatsProps> = ({
  mode,
  setMode,
  month,
  setMonth,
  rangeStart,
  setRangeStart,
  rangeEnd,
  setRangeEnd,
  year,
  setYear,
  statsLabel,
  isLoading,
  topAbsenceEmployees,
  topApprovedLeaveEmployees,
  lowestLeaveBalanceEmployees,
}) => {
  return (
    <div className="mt-4 rounded-xl border border-slate-200 dark:border-gray-800 bg-slate-50 dark:bg-gray-800/30 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="m-0 text-sm font-bold text-slate-900 dark:text-gray-100">Attendance Stats</h3>
          <p className="m-0 mt-1 text-xs text-slate-500 dark:text-gray-400">
            Track the employees with the most absences, the most approved leave, and their current leave balance for {statsLabel}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(["month", "range", "year"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${mode === m ? "bg-slate-900 dark:bg-gray-700 text-white" : "bg-white dark:bg-gray-800 text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700"}`}
            >
              {m === "month" ? "Month" : m === "range" ? "Month Range" : "Year"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {mode === "month" && (
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Select Month</span>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-500"
            />
          </label>
        )}

        {mode === "range" && (
          <>
            <label className="block">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Start Month</span>
              <input
                type="month"
                value={rangeStart}
                onChange={(e) => setRangeStart(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-500"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">End Month</span>
              <input
                type="month"
                value={rangeEnd}
                onChange={(e) => setRangeEnd(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-500"
              />
            </label>
          </>
        )}

        {mode === "year" && (
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Select Year</span>
            <input
              type="number"
              min="2000"
              max="2100"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-500"
            />
          </label>
        )}
      </div>

      {isLoading ? (
        <div className="mt-4 rounded-lg border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3 text-sm text-slate-600 dark:text-gray-400">
          Loading attendance stats...
        </div>
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <h4 className="m-0 text-sm font-bold text-slate-900 dark:text-gray-100">Most Absences</h4>
                <p className="m-0 mt-0.5 text-xs text-slate-500 dark:text-gray-400">Employees with the highest absence counts.</p>
              </div>
              <span className="rounded-full bg-slate-100 dark:bg-gray-800 px-2.5 py-1 text-[11px] font-bold text-slate-700 dark:text-gray-300">
                {topAbsenceEmployees.length} shown
              </span>
            </div>

            <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-gray-800">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-gray-800 bg-slate-50 dark:bg-gray-800">
                    <th className="px-3 py-2 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-gray-400">Employee</th>
                    <th className="px-3 py-2 text-center font-semibold uppercase tracking-wide text-slate-500 dark:text-gray-400">Absences</th>
                    <th className="px-3 py-2 text-center font-semibold uppercase tracking-wide text-slate-500 dark:text-gray-400">Leave Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
                  {topAbsenceEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-3 py-4 text-center text-slate-500 dark:text-gray-400">No absence records found for this period.</td>
                    </tr>
                  ) : (
                    topAbsenceEmployees.map((row) => (
                      <tr key={row.emp_id} className="hover:bg-slate-50 dark:hover:bg-gray-800/50">
                        <td className="px-3 py-2">
                          <p className="m-0 font-semibold text-slate-900 dark:text-gray-200">{row.first_name} {row.last_name}</p>
                          <p className="m-0 text-[11px] text-slate-500 dark:text-gray-400">{row.designation || "N/A"}</p>
                        </td>
                        <td className="px-3 py-2 text-center font-bold text-red-700 dark:text-red-400">{Number(row.total_absences || 0)}</td>
                        <td className="px-3 py-2 text-center font-semibold text-slate-700 dark:text-gray-300">{formatLeaveDays(row.leave_balance)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <h4 className="m-0 text-sm font-bold text-slate-900 dark:text-gray-100">Most Approved Leave</h4>
                <p className="m-0 mt-0.5 text-xs text-slate-500 dark:text-gray-400">Employees with the highest approved leave totals.</p>
              </div>
              <span className="rounded-full bg-slate-100 dark:bg-gray-800 px-2.5 py-1 text-[11px] font-bold text-slate-700 dark:text-gray-300">
                {topApprovedLeaveEmployees.length} shown
              </span>
            </div>

            <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-gray-800">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-gray-800 bg-slate-50 dark:bg-gray-800">
                    <th className="px-3 py-2 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-gray-400">Employee</th>
                    <th className="px-3 py-2 text-center font-semibold uppercase tracking-wide text-slate-500 dark:text-gray-400">Approved Days</th>
                    <th className="px-3 py-2 text-center font-semibold uppercase tracking-wide text-slate-500 dark:text-gray-400">Leave Count</th>
                    <th className="px-3 py-2 text-center font-semibold uppercase tracking-wide text-slate-500 dark:text-gray-400">Leave Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
                  {topApprovedLeaveEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-4 text-center text-slate-500 dark:text-gray-400">No approved leave records found for this period.</td>
                    </tr>
                  ) : (
                    topApprovedLeaveEmployees.map((row) => (
                      <tr key={row.emp_id} className="hover:bg-slate-50 dark:hover:bg-gray-800/50">
                        <td className="px-3 py-2">
                          <p className="m-0 font-semibold text-slate-900 dark:text-gray-200">{row.first_name} {row.last_name}</p>
                          <p className="m-0 text-[11px] text-slate-500 dark:text-gray-400">{row.designation || "N/A"}</p>
                        </td>
                        <td className="px-3 py-2 text-center font-bold text-emerald-700 dark:text-emerald-400">{formatLeaveDays(row.approved_leave_days)}</td>
                        <td className="px-3 py-2 text-center font-semibold text-slate-700 dark:text-gray-300">{Number(row.approved_leave_count || 0)}</td>
                        <td className="px-3 py-2 text-center font-semibold text-slate-700 dark:text-gray-300">{formatLeaveDays(row.leave_balance)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {!isLoading && (
        <div className="mt-4 rounded-xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <h4 className="m-0 text-sm font-bold text-slate-900 dark:text-gray-100">Leave Balance Snapshot</h4>
              <p className="m-0 mt-0.5 text-xs text-slate-500 dark:text-gray-400">Employees with the lowest current leave balance.</p>
            </div>
            <span className="rounded-full bg-slate-100 dark:bg-gray-800 px-2.5 py-1 text-[11px] font-bold text-slate-700 dark:text-gray-300">
              {lowestLeaveBalanceEmployees.length} shown
            </span>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-gray-800">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-gray-800 bg-slate-50 dark:bg-gray-800">
                  <th className="px-3 py-2 text-left font-semibold uppercase tracking-wide text-slate-500 dark:text-gray-400">Employee</th>
                  <th className="px-3 py-2 text-center font-semibold uppercase tracking-wide text-slate-500 dark:text-gray-400">Leave Balance</th>
                  <th className="px-3 py-2 text-center font-semibold uppercase tracking-wide text-slate-500 dark:text-gray-400">Absences</th>
                  <th className="px-3 py-2 text-center font-semibold uppercase tracking-wide text-slate-500 dark:text-gray-400">Approved Leave</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
                {lowestLeaveBalanceEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-4 text-center text-slate-500 dark:text-gray-400">No leave balance records found for this period.</td>
                  </tr>
                ) : (
                  lowestLeaveBalanceEmployees.map((row) => (
                    <tr key={row.emp_id} className="hover:bg-slate-50 dark:hover:bg-gray-800/50">
                      <td className="px-3 py-2">
                        <p className="m-0 font-semibold text-slate-900 dark:text-gray-200">{row.first_name} {row.last_name}</p>
                        <p className="m-0 text-[11px] text-slate-500 dark:text-gray-400">{row.designation || "N/A"}</p>
                      </td>
                      <td className="px-3 py-2 text-center font-bold text-sky-700 dark:text-sky-400">{formatLeaveDays(row.leave_balance)}</td>
                      <td className="px-3 py-2 text-center font-semibold text-slate-700 dark:text-gray-300">{Number(row.total_absences || 0)}</td>
                      <td className="px-3 py-2 text-center font-semibold text-slate-700 dark:text-gray-300">{formatLeaveDays(row.approved_leave_days)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
