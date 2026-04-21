import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { attendanceQueryOptions } from "../utils/queryOptions";
import { badgeClass } from "../constants";

interface AttendanceOverviewProps {
  search: string;
  setSearch: (val: string) => void;
}

export const AttendanceOverview: React.FC<AttendanceOverviewProps> = ({
  search,
  setSearch,
}) => {
  const { data: attendance = [] } = useQuery(attendanceQueryOptions);

  const overviewStats = useMemo(() => {
    return attendance.reduce(
      (acc, row) => {
        const primary = row.status || "Pending";
        if (primary === "Present") acc.present += 1;
        if (primary === "Absent") acc.absent += 1;
        if (primary === "On Leave") acc.onLeave += 1;
        if (primary === "Pending") acc.pending += 1;
        if (row.status2) acc.withSecondary += 1;
        return acc;
      },
      {
        total: attendance.length,
        present: 0,
        absent: 0,
        onLeave: 0,
        pending: 0,
        withSecondary: 0,
      },
    );
  }, [attendance]);

  const filteredMain = useMemo(() => {
    return attendance.filter((a) =>
      `${a.first_name} ${a.last_name} ${a.emp_id}`
        .toLowerCase()
        .includes(search.toLowerCase()),
    );
  }, [attendance, search]);

  return (
    <div className="mb-4 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3 flex-wrap">
        <h2 className="m-0 text-base font-bold text-gray-900">
          Attendance Overview
        </h2>
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
          <p className="m-0 text-sm font-bold text-gray-900">
            {overviewStats.total}
          </p>
        </div>
        <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2">
          <p className="m-0 text-[11px] font-semibold text-green-700">Present</p>
          <p className="m-0 text-sm font-bold text-green-800">
            {overviewStats.present}
          </p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2">
          <p className="m-0 text-[11px] font-semibold text-red-700">Absent</p>
          <p className="m-0 text-sm font-bold text-red-800">
            {overviewStats.absent}
          </p>
        </div>
        <div className="rounded-lg border border-purple-200 bg-purple-50 px-3 py-2">
          <p className="m-0 text-[11px] font-semibold text-purple-700">On Leave</p>
          <p className="m-0 text-sm font-bold text-purple-800">
            {overviewStats.onLeave}
          </p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
          <p className="m-0 text-[11px] font-semibold text-amber-700">Pending</p>
          <p className="m-0 text-sm font-bold text-amber-800">
            {overviewStats.pending}
          </p>
        </div>
        <div className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2">
          <p className="m-0 text-[11px] font-semibold text-sky-700">
            With Status 2
          </p>
          <p className="m-0 text-sm font-bold text-sky-800">
            {overviewStats.withSecondary}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-3 py-2 text-left font-semibold text-gray-700 uppercase text-[11px]">
                Employee
              </th>
              <th className="px-3 py-2 text-left font-semibold text-gray-700 uppercase text-[11px]">
                Employment
              </th>
              <th className="px-3 py-2 text-left font-semibold text-gray-700 uppercase text-[11px]">
                Primary Status
              </th>
              <th className="px-3 py-2 text-left font-semibold text-gray-700 uppercase text-[11px]">
                Status 2
              </th>
              <th className="px-3 py-2 text-center font-semibold text-gray-700 uppercase text-[11px]">
                Absences
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {filteredMain.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-4 text-center text-gray-500">
                  No matching records.
                </td>
              </tr>
            ) : (
              filteredMain.map((a, index) => (
                <tr key={`${a.emp_id}-${index}`} className="hover:bg-gray-50">
                  <td className="px-3 py-2">
                    <p className="m-0 font-semibold text-gray-900">
                      {a.first_name} {a.last_name}
                    </p>
                    <p className="m-0 text-[11px] text-gray-500">{a.emp_id}</p>
                  </td>
                  <td className="px-3 py-2 text-gray-700">{a.emp_status || "N/A"}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${badgeClass[a.status || "Pending"] || "bg-gray-100 text-gray-800"}`}
                    >
                      {a.status || "Pending"}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${badgeClass[a.status2 || ""] || "bg-gray-100 text-gray-500"}`}
                    >
                      {a.status2 || "--"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center font-semibold text-gray-700">
                    {a.total_absences || 0}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
