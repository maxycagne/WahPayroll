import React from "react";

import { getLeavesForDate } from "../utils/calendar.utils";
import { pad } from "../utils/leave.utils";
import { isNonWorkingDay } from "../utils/date.utils";
import { statusColors } from "../leaveConstants";
import LeaveCalendarModal from "./LeaveCalendarModal";

const LeaveCalendarGrid = ({
  cells,
  leaves,
  selectedDate,
  setSelectedDate,
  month,
  year,
  selectedLeaves,
  selectedDateStr,
  workweekConfigs = [],
}) => {
  return (
    <>
      <div className="bg-slate-50 dark:bg-gray-900/50 p-4">
        <div className="grid grid-cols-7 gap-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div
              key={d}
              className="rounded-lg bg-slate-100 dark:bg-gray-800 py-1.5 text-center text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-gray-400"
            >
              {d}
            </div>
          ))}
          {cells.map((day, i) => {
            if (day === null)
              return <div key={"e" + i} className="min-h-22.5" />;

            const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`;
            const dayLeaves = getLeavesForDate(
              dateStr,
              leaves,
              workweekConfigs,
            );
            const isSelected = day === selectedDate;
            const visibleLeaves = dayLeaves.slice(0, 3);
            const extraLeavesCount = Math.max(
              dayLeaves.length - visibleLeaves.length,
              0,
            );

            const firstLeaveStatus =
              dayLeaves.length > 0 ? dayLeaves[0].calendar_status : null;
            const colorConfig = firstLeaveStatus
              ? // @ts-ignore
                statusColors[firstLeaveStatus]
              : null;

            const isOffDay = isNonWorkingDay(dateStr, workweekConfigs);

            return (
              <button
                key={i}
                type="button"
                className={`relative flex min-h-22.5 cursor-pointer flex-col items-start justify-start rounded-xl p-2 text-left transition-all duration-150 ${
                  isOffDay ? "opacity-50 bg-slate-50 dark:bg-gray-800/30 cursor-not-allowed" : ""
                } ${
                  dayLeaves.length > 0 && !isSelected
                    ? colorConfig?.border + " " + colorConfig?.bg
                    : isOffDay
                      ? "border border-slate-200 dark:border-slate-800"
                      : "border border-slate-200 dark:border-slate-800 bg-white dark:bg-gray-900"
                } ${isSelected ? "z-10 border-slate-900 dark:border-indigo-500 bg-slate-900 dark:bg-indigo-600 text-white shadow-md cursor-default" : isOffDay ? "" : "hover:-translate-y-0.5 hover:border-slate-400 dark:hover:border-gray-600 hover:shadow-sm"}`}
                onClick={() => setSelectedDate(day)}
              >
                <span
                  className={`mb-0.5 text-xs font-bold ${isSelected ? "text-white" : "text-slate-900 dark:text-gray-100"}`}
                >
                  {day}
                </span>

                <div className="mt-0.5 flex w-full flex-col gap-1">
                  {visibleLeaves.map((leave) => (
                    <div
                      key={leave.id}
                      className="mt-0.5 flex w-full flex-col gap-0.5 border-t border-gray-100/50 dark:border-gray-800/50 pt-0.5 text-left"
                    >
                      <span
                        className={`truncate text-[0.6rem] font-bold leading-tight ${isSelected ? "text-white" : "text-purple-800 dark:text-purple-400"}`}
                      >
                        {leave.first_name} {leave.last_name}
                      </span>
                      <span
                        className={`truncate text-[0.55rem] font-semibold leading-tight ${isSelected ? "text-white/90" : "text-gray-600 dark:text-gray-400"}`}
                      >
                        {leave.leave_type}
                      </span>
                      <span
                        className={`truncate text-[0.55rem] font-semibold uppercase ${
                          isSelected
                            ? "text-purple-200"
                            : // @ts-ignore
                              statusColors[leave.calendar_status]?.text
                        }`}
                      >
                        • {leave.calendar_status}
                      </span>
                    </div>
                  ))}
                  {extraLeavesCount > 0 && (
                    <span
                      className={`mt-0.5 inline-flex w-fit rounded-md px-1.5 py-0.5 text-[0.55rem] font-bold uppercase tracking-wider ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-slate-200 dark:bg-gray-800 text-slate-700 dark:text-gray-300"
                      }`}
                    >
                      +{extraLeavesCount} more
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
      {selectedDate && (
        <LeaveCalendarModal
          setSelectedDate={setSelectedDate}
          selectedDateStr={selectedDateStr}
          selectedLeaves={selectedLeaves}
        ></LeaveCalendarModal>
      )}
    </>
  );
};

export default LeaveCalendarGrid;
