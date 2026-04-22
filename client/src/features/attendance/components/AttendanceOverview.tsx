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
    <div className="mb-4 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3 flex-wrap">
        <h2 className="m-0 text-base font-bold text-gray-900">Attendance Overview</h2>
        <input
          type="text"
          className="w-full max-w-[280px] px-3 py-1.5 rounded-lg border border-gray-300 text-xs outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="Search by name or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
          <p className="m-0 text-[11px] font-semibold text-gray-500">Total</p>
          <p className="m-0 text-sm font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2">
          <p className="m-0 text-[11px] font-semibold text-green-700">Present</p>
          <p className="m-0 text-sm font-bold text-green-800">{stats.present}</p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2">
          <p className="m-0 text-[11px] font-semibold text-red-700">Absent</p>
          <p className="m-0 text-sm font-bold text-red-800">{stats.absent}</p>
        </div>
        <div className="rounded-lg border border-purple-200 bg-purple-50 px-3 py-2">
          <p className="m-0 text-[11px] font-semibold text-purple-700">On Leave</p>
          <p className="m-0 text-sm font-bold text-purple-800">{stats.onLeave}</p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
          <p className="m-0 text-[11px] font-semibold text-amber-700">Pending</p>
          <p className="m-0 text-sm font-bold text-amber-800">{stats.pending}</p>
        </div>
        <div className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2">
          <p className="m-0 text-[11px] font-semibold text-sky-700">With Status 2</p>
          <p className="m-0 text-sm font-bold text-sky-800">{stats.withSecondary}</p>
        </div>
      </div>
    </div>
  );
};
