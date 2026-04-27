export default function ActionButtons({
  currentUser,
  isAdminRole,
  isApprover,
  myRequestRows,
  totalPendingCount,
  onFileNewApplication,
  onShowMyPending,
  onShowPendingApproval,
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      {currentUser?.role !== "Admin" && (
        <button
          className="cursor-pointer rounded-lg border-0 bg-linear-to-r from-indigo-600 to-indigo-700 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:opacity-95"
          onClick={onFileNewApplication}
        >
          + File New Application
        </button>
      )}

      {!isAdminRole && (
        <button
          className="cursor-pointer rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800"
          onClick={onShowMyPending}
        >
          My Pending Requests
          {myRequestRows.length > 0 && (
            <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-black text-slate-800 dark:text-slate-200">
              {myRequestRows.length}
            </span>
          )}
        </button>
      )}

      {isApprover && (
        <button
          className="cursor-pointer rounded-lg border border-amber-300 dark:border-amber-900/30 bg-amber-50 dark:bg-amber-900/20 px-4 py-2.5 text-sm font-bold text-amber-800 dark:text-amber-400 shadow-sm hover:bg-amber-100 dark:hover:bg-amber-900/40"
          onClick={onShowPendingApproval}
        >
          Pending Approval Requests
          {totalPendingCount > 0 && (
            <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-amber-200 dark:bg-amber-900/40 px-1.5 py-0.5 text-[10px] font-black text-amber-900 dark:text-amber-100">
              {totalPendingCount}
            </span>
          )}
        </button>
      )}
    </div>
  );
}
