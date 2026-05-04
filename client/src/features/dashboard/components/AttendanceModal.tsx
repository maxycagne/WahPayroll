import React, { useMemo, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  attendance: any[];
  badgeClass: Record<string, string>;
}

export const AttendanceModal: React.FC<AttendanceModalProps> = ({
  isOpen,
  onClose,
  attendance,
  badgeClass,
}) => {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    currentDate.getMonth()
  );
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const filteredAttendance = useMemo(() => {
    return (attendance || []).filter((log) => {
      const logDate = new Date(log.date);
      return (
        logDate.getMonth() === selectedMonth &&
        logDate.getFullYear() === selectedYear
      );
    });
  }, [attendance, selectedMonth, selectedYear]);

  const handlePreviousMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const monthName = new Date(selectedYear, selectedMonth, 1).toLocaleDateString(
    undefined,
    { month: "long", year: "numeric" }
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-gray-800 bg-slate-50 dark:bg-gray-800/50 px-6 py-4">
          <h2 className="m-0 text-lg font-bold text-slate-900 dark:text-gray-100">
            Full Attendance History
          </h2>
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-lg p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-gray-800 dark:text-gray-400"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Month Navigation */}
        <div className="border-b border-slate-200 dark:border-gray-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handlePreviousMonth}
              className="inline-flex items-center justify-center rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:hover:bg-gray-800 dark:text-gray-400"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h3 className="text-sm font-bold text-slate-900 dark:text-gray-100">
              {monthName}
            </h3>
            <button
              onClick={handleNextMonth}
              className="inline-flex items-center justify-center rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:hover:bg-gray-800 dark:text-gray-400"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Attendance List */}
        <div className="max-h-[500px] overflow-y-auto p-6">
          {filteredAttendance.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="m-0 text-sm font-semibold text-slate-700 dark:text-gray-300">
                No attendance records found for {monthName}
              </p>
              <p className="m-0 mt-1 text-xs text-slate-500 dark:text-gray-400">
                Try selecting a different month
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAttendance.map((log, idx) => {
                const primaryStatus =
                  log.status?.split(",")[0]?.trim() || "Pending";
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg border border-slate-100 dark:border-gray-800 bg-slate-50/50 dark:bg-gray-800/30 p-4"
                  >
                    <div>
                      <p className="m-0 text-sm font-semibold text-slate-800 dark:text-gray-200">
                        {new Date(log.date).toLocaleDateString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                      {log.time_in && (
                        <p className="m-0 mt-1 text-xs text-slate-600 dark:text-gray-400">
                          Time In: {log.time_in}
                        </p>
                      )}
                      {log.time_out && (
                        <p className="m-0 text-xs text-slate-600 dark:text-gray-400">
                          Time Out: {log.time_out}
                        </p>
                      )}
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${
                        badgeClass[primaryStatus] || badgeClass["Pending"]
                      }`}
                    >
                      {log.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 dark:border-gray-800 bg-slate-50 dark:bg-gray-800/50 px-6 py-3 flex justify-end">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
