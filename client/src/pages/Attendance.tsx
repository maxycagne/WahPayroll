import React from "react";
import Toast from "../components/Toast";
import { useAttendance } from "../features/attendance/hooks/useAttendance";
import { AttendanceCalendar } from "../features/attendance/components/AttendanceCalendar";
import { AttendanceStats } from "../features/attendance/components/AttendanceStats";
import { AttendanceTable } from "../features/attendance/components/AttendanceTable";
import { DateDetailsModal } from "../features/attendance/components/DateDetailsModal";
import { DailyAttendanceModal } from "../features/attendance/components/DailyAttendanceModal";
import { AdjustBalanceModal } from "../features/attendance/components/AdjustBalanceModal";
import { WorkweekConfigModal } from "../features/attendance/components/WorkweekConfigModal";

interface AttendanceProps {
  shortcutMode?: boolean;
}

const Attendance: React.FC<AttendanceProps> = ({ shortcutMode = false }) => {
  const {
    isLoading,
    attendance,
    totalRecords,
    totalPages,
    currentPage,
    setCurrentPage,
    calendarSummary,
    canEditAttendance,
    canConfigureWorkweek,
    search,
    setSearch,
    viewDate,
    setViewDate,
    year,
    month,
    selectedDate,
    setSelectedDate,
    overviewStats,
    
    // Sub-hooks
    stats,
    daily,
    workweek,
    balance,
    details,
    
    toast,
    clearToast,
  } = useAttendance(shortcutMode);

  if (isLoading)
    return <div className="p-6 font-bold text-slate-700">Loading Attendance...</div>;

  return (
    <div className="max-w-full">
      {!shortcutMode && (
        <>
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            {canConfigureWorkweek && (
              <button
                onClick={() => workweek.setIsOpen(true)}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold text-sm cursor-pointer hover:bg-indigo-700 border-0 transition-colors"
              >
                ⚙️ Workweek Setup
              </button>
            )}
          </div>

          <AttendanceCalendar
            year={year}
            month={month}
            calendarSummary={calendarSummary}
            workweekConfigs={workweek.configs}
            viewDate={viewDate}
            setViewDate={setViewDate}
            onDateClick={(dateStr) => {
              setSelectedDate(dateStr);
              details.setIsOpen(true);
            }}
          />
          {canEditAttendance && (
            <AttendanceStats
              mode={stats.mode}
              setMode={stats.setMode}
              month={stats.month}
              setMonth={stats.setMonth}
              rangeStart={stats.rangeStart}
              setRangeStart={stats.setRangeStart}
              rangeEnd={stats.rangeEnd}
              setRangeEnd={stats.setRangeEnd}
              year={stats.year}
              setYear={stats.setYear}
              statsLabel={stats.label}
              isLoading={stats.isLoading}
              topAbsenceEmployees={stats.topAbsences}
              topApprovedLeaveEmployees={stats.topApprovedLeave}
              lowestLeaveBalanceEmployees={stats.lowestLeaveBalance}
            />
          )}
        </>
      )}

      {/* Date Details Modal */}
      <DateDetailsModal
        isOpen={details.isOpen}
        onClose={() => details.setIsOpen(false)}
        date={selectedDate}
        loading={details.loading}
        filteredDaily={details.filteredDaily}
        search={details.search}
        setSearch={details.setSearch}
        designation={details.designation}
        setDesignation={details.setDesignation}
        position={details.position}
        setPosition={details.setPosition}
        status={details.status}
        setStatus={details.setStatus}
        canEdit={canEditAttendance}
        onEdit={() => {
          details.setIsOpen(false);
          daily.setIsOpen(true);
        }}
      />

      {/* Daily Attendance Entry Modal */}
      <DailyAttendanceModal
        isOpen={daily.isOpen}
        onClose={() => daily.setIsOpen(false)}
        date={selectedDate}
        loading={daily.loading}
        filteredDaily={daily.filteredDaily}
        attendanceForm={daily.attendanceForm}
        setAttendanceForm={daily.setAttendanceForm}
        secondaryStatusForm={daily.secondaryStatusForm}
        setSecondaryStatusForm={daily.setSecondaryStatusForm}
        search={daily.search}
        setSearch={daily.setSearch}
        statusFilter={daily.statusFilter}
        setStatusFilter={daily.setStatusFilter}
        overview={daily.overview}
        selectedEmployees={daily.selectedEmployees}
        toggleEmployeeSelection={daily.toggleEmployeeSelection}
        toggleAllSelected={daily.toggleAllSelected}
        bulkStatus={daily.bulkStatus}
        setBulkStatus={daily.setBulkStatus}
        applyBulkStatus={daily.applyBulkStatus}
        markAllPresent={daily.markAllPresent}
        onSubmit={daily.onSubmit}
        isSaving={daily.isSaving}
        canEdit={canEditAttendance}
      />

      {/* Adjust Leave Balance Modal */}
      <AdjustBalanceModal
        isOpen={!!balance.modalData}
        onClose={() => { balance.setModalData(null); balance.setDays(""); }}
        empName={balance.modalData ? `${balance.modalData.first_name} ${balance.modalData.last_name}` : ""}
        type={balance.type}
        setType={balance.setType}
        days={balance.days}
        setDays={balance.setDays}
        onSubmit={balance.onSubmit}
        isLoading={balance.isLoading}
      />

      {/* Workweek Configuration Modal */}
      <WorkweekConfigModal
        isOpen={workweek.isOpen}
        onClose={() => workweek.setIsOpen(false)}
        form={workweek.form}
        setForm={workweek.setForm}
        editingId={workweek.editingId}
        onSubmit={workweek.onSubmit}
        onCancelEdit={workweek.onCancelEdit}
        onEdit={workweek.onEdit}
        onDelete={workweek.onDelete}
        configs={workweek.configs}
        isLoading={workweek.isLoading}
      />

      <Toast toast={toast} onClose={clearToast} />
    </div>
  );
};

export default Attendance;
