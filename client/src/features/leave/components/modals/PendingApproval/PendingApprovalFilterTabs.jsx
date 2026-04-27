export default function PendingApprovalFilterTabs({
  pendingTypeFilter,
  setPendingTypeFilter,
  allPendingRequests,
  pendingLeaveApprovals,
  pendingOffsetApprovals,
  pendingResignationApprovals,
}) {
  return (
    <div className="sticky top-0 z-20 flex flex-wrap gap-1.5 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-2">
      <button
        type="button"
        onClick={() => setPendingTypeFilter("all")}
        className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors ${pendingTypeFilter === "all" ? "bg-slate-800 dark:bg-slate-700 text-white" : "bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-gray-700"}`}
      >
        All ({allPendingRequests.length})
      </button>
      <button
        type="button"
        onClick={() => setPendingTypeFilter("leave")}
        className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors ${pendingTypeFilter === "leave" ? "bg-indigo-600 text-white" : "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50"}`}
      >
        Leave ({pendingLeaveApprovals.length})
      </button>
      <button
        type="button"
        onClick={() => setPendingTypeFilter("offset")}
        className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors ${pendingTypeFilter === "offset" ? "bg-sky-600 text-white" : "bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/50"}`}
      >
        Offset ({pendingOffsetApprovals.length})
      </button>
      <button
        type="button"
        onClick={() => setPendingTypeFilter("resignation")}
        className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors ${pendingTypeFilter === "resignation" ? "bg-amber-600 text-white" : "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50"}`}
      >
        Resignation ({pendingResignationApprovals.length})
      </button>
    </div>
  );
}
