export default function ReviewConfirmationModalDaySelector({
  reviewConfirm,
  getDateRangeInclusive,
  toggleLeaveApprovedDate,
  parseDateOnly,
  setReviewConfirm,
  workweekConfigs = [],
}) {
  const formatDisplayDate = (date) =>
    parseDateOnly(date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

  const availableDates = getDateRangeInclusive(
    reviewConfirm?.item?.date_from,
    reviewConfirm?.item?.date_to,
    workweekConfigs,
  );
  const selectedDates = reviewConfirm?.selectedDates || [];

  return (
    <>
      {reviewConfirm.module === "leave" &&
        reviewConfirm.decisionMode !== "cancellation" &&
        reviewConfirm.status === "Approved" &&
        reviewConfirm.isMultiDay && (
          <div className="mb-4 rounded-2xl border border-amber-200 dark:border-amber-900/30 bg-gradient-to-br from-amber-50 to-white dark:from-gray-800 dark:to-gray-900 p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="m-0 text-xs font-bold uppercase tracking-wider text-amber-800">
                  Select specific days to approve
                </p>
                <p className="m-0 mt-1 text-[11px] text-slate-600 dark:text-gray-400">
                  Choose the exact working days you want to approve.
                </p>
              </div>
              <span className="rounded-full bg-amber-100 dark:bg-amber-900/40 px-2.5 py-1 text-[11px] font-semibold text-amber-800 dark:text-amber-400">
                {selectedDates.length} selected
              </span>
            </div>

            <div className="mb-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setReviewConfirm({
                    ...reviewConfirm,
                    selectedDates: [...availableDates],
                  })
                }
                className="rounded-md border border-amber-300 dark:border-amber-800 bg-white dark:bg-gray-800 px-2.5 py-1 text-[11px] font-semibold text-amber-800 dark:text-amber-400 transition hover:bg-amber-50 dark:hover:bg-gray-700"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={() =>
                  setReviewConfirm({
                    ...reviewConfirm,
                    selectedDates: [],
                  })
                }
                className="rounded-md border border-slate-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-gray-300 transition hover:bg-slate-50 dark:hover:bg-gray-700"
              >
                Clear
              </button>
            </div>

            {selectedDates.length > 0 && (
              <div className="mb-3 flex max-h-20 flex-wrap gap-1.5 overflow-y-auto pr-1">
                {selectedDates.map((date) => (
                  <span
                    key={date}
                    className="rounded-full bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:text-amber-400"
                  >
                    {formatDisplayDate(date)}
                  </span>
                ))}
              </div>
            )}

            <div className="grid max-h-56 grid-cols-1 gap-2 overflow-y-auto pr-1 md:grid-cols-2">
              {availableDates.map((date) => (
                <label
                  key={date}
                  className="flex cursor-pointer items-start gap-3 rounded-xl border border-amber-200 dark:border-amber-900/30 bg-white dark:bg-gray-800 px-3 py-2.5 text-xs text-gray-700 dark:text-gray-300 shadow-sm transition hover:border-amber-300 dark:hover:border-amber-700 hover:bg-amber-50/70 dark:hover:bg-gray-700/70"
                >
                  <input
                    type="checkbox"
                    checked={selectedDates.includes(date)}
                    onChange={() => toggleLeaveApprovedDate(date)}
                    className="mt-0.5 h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span className="leading-5 text-slate-800 dark:text-gray-200">
                    {formatDisplayDate(date)}
                  </span>
                </label>
              ))}
            </div>
            <p className="m-0 mt-3 text-[11px] text-slate-500 dark:text-gray-400">
              Unselected days will remain pending for this request.
            </p>
          </div>
        )}
    </>
  );
}
