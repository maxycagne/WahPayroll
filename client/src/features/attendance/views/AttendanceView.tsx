import React from "react";
import Toast from "@/components/Toast";
import { useAttendance } from "../hooks/useAttendance";
import { AttendanceCalendar } from "../components/AttendanceCalendar";
import { AttendanceOverview } from "../components/AttendanceOverview";
import { DateDetailsModal } from "../components/DateDetailsModal";
import { DailyAttendanceModal } from "../components/DailyAttendanceModal";
import { AdjustBalanceModal } from "../components/AdjustBalanceModal";
import { WorkweekConfigModal } from "../components/WorkweekConfigModal";

interface AttendanceViewProps {
  shortcutMode?: boolean;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  shortcutMode = false,
}) => {
  const {
    search,
    setSearch,
    viewDate,
    setViewDate,
    year,
    month,
    workweekModalOpen,
    openWorkweekModal,
    closeWorkweekModal,
    dailyModalDate,
    openDailyModal,
    closeDailyModal,
    dateDetailsDate,
    openDateDetails,
    closeDateDetails,
    adjModalRecord,
    closeAdjustModal,
    canEditAttendance,
    canConfigureWorkweek,
    toast,
    clearToast,
  } = useAttendance(shortcutMode);

  return (
    <div className="max-w-full">
      {!shortcutMode && (
        <>
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            {canConfigureWorkweek && (
              <button
                onClick={openWorkweekModal}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold text-sm cursor-pointer hover:bg-indigo-700 border-0 transition-colors"
              >
                ⚙️ Workweek Setup
              </button>
            )}
          </div>

          <AttendanceCalendar
            viewDate={viewDate}
            setViewDate={setViewDate}
            onDateClick={openDateDetails}
            year={year}
            month={month}
          />

          <AttendanceOverview search={search} setSearch={setSearch} />
        </>
      )}

      {dateDetailsDate && (
        <DateDetailsModal
          dateDetailsDate={dateDetailsDate}
          onClose={closeDateDetails}
          canEditAttendance={canEditAttendance}
          onEditClick={() => {
            closeDateDetails();
            openDailyModal(dateDetailsDate);
          }}
        />
      )}

      {dailyModalDate && (
        <DailyAttendanceModal
          selectedDate={dailyModalDate}
          onClose={closeDailyModal}
          canEditAttendance={canEditAttendance}
        />
      )}

      {adjModalRecord && (
        <AdjustBalanceModal
          adjModal={adjModalRecord}
          onClose={closeAdjustModal}
        />
      )}

      {workweekModalOpen && (
        <WorkweekConfigModal onClose={closeWorkweekModal} />
      )}

      <Toast toast={toast} onClose={clearToast} />
    </div>
  );
};
