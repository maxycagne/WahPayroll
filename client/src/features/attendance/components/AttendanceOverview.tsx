import React from "react";

interface AttendanceOverviewProps {
  search: string;
  setSearch: (search: string) => void;
  stats: {
    total: number;
    present: number;
    absent: number;
    onLeave: number;
    pending: number;
    withSecondary: number;
  };
}

export const AttendanceOverview: React.FC<AttendanceOverviewProps> = ({
  search,
  setSearch,
  stats,
}) => {
  return (
    <div className="mb-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3 flex-wrap">
        <h2 className="m-0 text-base font-bold text-gray-900 dark:text-gray-100">Attendance Overview</h2>
        <input
          type="text"
          className="w-full max-w-[280px] px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-xs outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="Search by name or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2">
          <p className="m-0 text-[11px] font-semibold text-gray-500 dark:text-gray-400">Total</p>
          <p className="m-0 text-sm font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
        </div>
        <div className="rounded-lg border border-green-200 dark:border-green-900/30 bg-green-50 dark:bg-green-900/20 px-3 py-2">
          <p className="m-0 text-[11px] font-semibold text-green-700 dark:text-green-400">Present</p>
          <p className="m-0 text-sm font-bold text-green-800 dark:text-green-300">{stats.present}</p>
        </div>
        <div className="rounded-lg border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/20 px-3 py-2">
          <p className="m-0 text-[11px] font-semibold text-red-700 dark:text-red-400">Absent</p>
          <p className="m-0 text-sm font-bold text-red-800 dark:text-red-300">{stats.absent}</p>
        </div>
        <div className="rounded-lg border border-purple-200 dark:border-purple-900/30 bg-purple-50 dark:bg-purple-900/20 px-3 py-2">
          <p className="m-0 text-[11px] font-semibold text-purple-700 dark:text-purple-400">On Leave</p>
          <p className="m-0 text-sm font-bold text-purple-800 dark:text-purple-300">{stats.onLeave}</p>
        </div>
        <div className="rounded-lg border border-amber-200 dark:border-amber-900/30 bg-amber-50 dark:bg-amber-900/20 px-3 py-2">
          <p className="m-0 text-[11px] font-semibold text-amber-700 dark:text-amber-400">Pending</p>
          <p className="m-0 text-sm font-bold text-amber-800 dark:text-amber-300">{stats.pending}</p>
        </div>
        <div className="rounded-lg border border-sky-200 dark:border-sky-900/30 bg-sky-50 dark:bg-sky-900/20 px-3 py-2">
          <p className="m-0 text-[11px] font-semibold text-sky-700 dark:text-sky-400">With Status 2</p>
          <p className="m-0 text-sm font-bold text-sky-800 dark:text-sky-300">{stats.withSecondary}</p>
        </div>
      </div>
    </div>
  );
};
