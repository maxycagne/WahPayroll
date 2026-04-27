import React from "react";
import { AttendanceCalendarSummary, WorkweekConfig } from "../types";
import { isNonWorkingDay } from "@/features/leave/utils/date.utils";
import { pad } from "../utils";

interface AttendanceCalendarProps {
  year: number;
  month: number;
  calendarSummary: AttendanceCalendarSummary[];
  workweekConfigs: WorkweekConfig[];
  viewDate: Date;
  setViewDate: (date: Date) => void;
  onDateClick: (date: string) => void;
}

export const AttendanceCalendar: React.FC<AttendanceCalendarProps> = ({
  year,
  month,
  calendarSummary,
  workweekConfigs,
  viewDate,
  setViewDate,
  onDateClick,
}) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const cells = Array(firstDay)
    .fill(null)
    .concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));

  const today = new Date();

  return (
    <div className="mb-8 overflow-hidden rounded-2xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-sky-600 px-4 py-3 text-white">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="m-0 text-base font-bold">Attendance Calendar</h2>
            <p className="m-0 mt-1 text-xs text-white/90">
              Select a date to review or record daily attendance.
            </p>
          </div>
        </div>
      </div>
      <div className="bg-slate-50 dark:bg-gray-800/50 p-4">
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => setViewDate(new Date(year, month - 1, 1))}
            className="cursor-pointer rounded-lg border border-slate-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:text-gray-300 transition-colors hover:bg-slate-100 dark:hover:bg-gray-700"
          >
            ◀ Prev
          </button>
          <h3 className="m-0 text-base font-bold text-slate-800 dark:text-gray-200">
            {viewDate.toLocaleString("default", {
              month: "long",
              year: "numeric",
            })}
          </h3>
          <button
            onClick={() => setViewDate(new Date(year, month + 1, 1))}
            className="cursor-pointer rounded-lg border border-slate-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:text-gray-300 transition-colors hover:bg-slate-100 dark:hover:bg-gray-700"
          >
            Next ▶
          </button>
        </div>

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
            if (!day)
              return <div key={`empty-${i}`} className="min-h-[88px]" />;
            const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`;
            const isToday =
              today.getFullYear() === year &&
              today.getMonth() === month &&
              today.getDate() === day;

            const dayData = calendarSummary.find((s) => {
              const dbDate = new Date(s.date);
              return (
                dbDate.getFullYear() === year &&
                dbDate.getMonth() === month &&
                dbDate.getDate() === day
              );
            });

            const isOffDay = isNonWorkingDay(dateStr, workweekConfigs as any);

            return (
              <button
                key={i}
                onClick={() => onDateClick(dateStr)}
                className={`min-h-[88px] cursor-pointer rounded-xl border p-2 text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${isToday ? "border-indigo-600 ring-2 ring-indigo-200 dark:ring-indigo-900/30" : "border-slate-200 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-500"} ${isOffDay ? "opacity-50 bg-slate-50 dark:bg-gray-800/30" : "bg-white dark:bg-gray-900"}`}
              >
                <div className="mb-1 flex w-full items-center justify-between">
                  <span
                    className={`text-xs font-bold ${isToday ? "text-indigo-700 dark:text-indigo-400" : "text-slate-700 dark:text-gray-300"}`}
                  >
                    {day}
                  </span>
                </div>
                {dayData && (
                  <div className="mt-auto flex w-full flex-col gap-1">
                    {dayData.present_count > 0 && (
                      <div className="w-full truncate rounded-md border border-green-200 dark:border-green-900/30 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 text-[10px] font-bold text-green-700 dark:text-green-400">
                        • {dayData.present_count} Present
                      </div>
                    )}
                    {dayData.late_count > 0 && (
                      <div className="w-full truncate rounded-md border border-amber-200 dark:border-amber-900/30 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400">
                        • {dayData.late_count} Late
                      </div>
                    )}
                    {dayData.undertime_count > 0 && (
                      <div className="w-full truncate rounded-md border border-rose-200 dark:border-rose-900/30 bg-rose-50 dark:bg-rose-900/20 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 dark:text-rose-400">
                        • {dayData.undertime_count} Undertime
                      </div>
                    )}
                    {dayData.halfday_count > 0 && (
                      <div className="w-full truncate rounded-md border border-orange-200 dark:border-orange-900/30 bg-orange-50 dark:bg-orange-900/20 px-1.5 py-0.5 text-[10px] font-bold text-orange-700 dark:text-orange-400">
                        • {dayData.halfday_count} Half-Day
                      </div>
                    )}
                    {dayData.leave_count > 0 && (
                      <div className="w-full truncate rounded-md border border-purple-200 dark:border-purple-900/30 bg-purple-50 dark:bg-purple-900/20 px-1.5 py-0.5 text-[10px] font-bold text-purple-700 dark:text-purple-400">
                        • {dayData.leave_count} On Leave
                      </div>
                    )}
                    {dayData.absent_count > 0 && (
                      <div className="w-full truncate rounded-md border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 text-[10px] font-bold text-red-700 dark:text-red-400">
                        • {dayData.absent_count} Absent
                      </div>
                    )}
                    {dayData.no_notice_text_count > 0 && (
                      <div className="w-full truncate rounded-md border border-pink-200 dark:border-pink-900/30 bg-pink-50 dark:bg-pink-900/20 px-1.5 py-0.5 text-[10px] font-bold text-pink-700 dark:text-pink-400">
                        • {dayData.no_notice_text_count} No notice (text)
                      </div>
                    )}
                    {dayData.no_notice_email_count > 0 && (
                      <div className="w-full truncate rounded-md border border-fuchsia-200 dark:border-fuchsia-900/30 bg-fuchsia-50 dark:bg-fuchsia-900/20 px-1.5 py-0.5 text-[10px] font-bold text-fuchsia-700 dark:text-fuchsia-400">
                        • {dayData.no_notice_email_count} No notice (email)
                      </div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
