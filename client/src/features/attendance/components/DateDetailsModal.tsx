import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DailyAttendanceRecord } from "../types/Attendance";
import { designationMap, badgeClass } from "../constants";
import { attendanceDailyQueryOptions } from "../utils/queryOptions";

interface DateDetailsModalProps {
  dateDetailsDate: string;
  onClose: () => void;
  canEditAttendance: boolean;
  onEditClick: () => void;
}

export const DateDetailsModal: React.FC<DateDetailsModalProps> = ({
  dateDetailsDate,
  onClose,
  canEditAttendance,
  onEditClick,
}) => {
  const [detailsSearch, setDetailsSearch] = useState("");
  const [detailsDesignation, setDetailsDesignation] = useState("All");
  const [detailsPosition, setDetailsPosition] = useState("All");
  const [detailsStatus, setDetailsStatus] = useState("All");

  const { data: dailyList = [], isLoading: dailyLoading } = useQuery(
    attendanceDailyQueryOptions(dateDetailsDate, true),
  );

  const filtered = dailyList.filter((emp) => {
    const name = `${emp.first_name} ${emp.last_name} ${emp.emp_id}`.toLowerCase();
    if (detailsSearch && !name.includes(detailsSearch.toLowerCase())) return false;
    if (detailsDesignation !== "All" && emp.designation !== detailsDesignation) return false;
    if (detailsPosition !== "All" && emp.position !== detailsPosition) return false;
    if (detailsStatus !== "All") {
      const primary = emp.attendance_status || "";
      const secondary = emp.status2 || "";
      if (detailsStatus === "No Status") {
        if (primary || secondary) return false;
      } else {
        if (primary !== detailsStatus && secondary !== detailsStatus) return false;
      }
    }
    return true;
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-700 px-5 py-3 text-white">
          <div>
            <h2 className="m-0 text-sm font-bold">Date Details</h2>
            <p className="m-0 mt-0.5 text-xs text-white/80">
              {new Date(dateDetailsDate + "T00:00:00").toLocaleDateString(undefined, {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer rounded-md border border-white/20 bg-white/5 px-3 py-1 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            Close
          </button>
        </div>
        <div className="p-4 pb-2 space-y-2">
          <input
            type="text"
            placeholder="Search employee..."
            value={detailsSearch}
            onChange={(e) => setDetailsSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="flex flex-wrap gap-2">
            <select
              value={detailsDesignation}
              onChange={(e) => {
                setDetailsDesignation(e.target.value);
                setDetailsPosition("All");
              }}
              className="flex-1 min-w-[120px] rounded-lg border border-slate-300 px-2 py-1.5 text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">All Designations</option>
              {Object.keys(designationMap).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <select
              value={detailsPosition}
              onChange={(e) => setDetailsPosition(e.target.value)}
              className="flex-1 min-w-[120px] rounded-lg border border-slate-300 px-2 py-1.5 text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">All Positions</option>
              {detailsDesignation !== "All" && designationMap[detailsDesignation]
                ? designationMap[detailsDesignation].map((p) => (
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
              value={detailsStatus}
              onChange={(e) => setDetailsStatus(e.target.value)}
              className="flex-1 min-w-[100px] rounded-lg border border-slate-300 px-2 py-1.5 text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500"
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
          {dailyLoading ? (
            <p className="py-6 text-center text-sm font-semibold text-slate-500">
              Loading attendance...
            </p>
          ) : dailyList.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">
              No attendance records for this date.
            </p>
          ) : filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">
              No employees match your filters.
            </p>
          ) : (
            <div className="space-y-2">
              <p className="m-0 text-[11px] font-semibold text-slate-400">
                {filtered.length} employee{filtered.length !== 1 ? "s" : ""}
              </p>
              {filtered.map((emp) => {
                const primary = emp.attendance_status || "";
                const secondary = emp.status2 || "";
                const statusLabel = [primary, secondary].filter(Boolean).join(", ") || "No Status";
                const statusColor = badgeClass[primary] || badgeClass[""];
                return (
                  <div
                    key={emp.emp_id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3"
                  >
                    <div>
                      <p className="m-0 text-sm font-bold text-slate-900">
                        {emp.first_name} {emp.last_name}
                      </p>
                      <p className="m-0 text-[11px] text-slate-500">
                        {[emp.designation, emp.position].filter(Boolean).join(" • ") || emp.emp_id}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${statusColor}`}
                    >
                      {statusLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {canEditAttendance && (
          <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 flex justify-end">
            <button
              onClick={onEditClick}
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
