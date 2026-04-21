export default function ReviewConfirmationModalDaySelector({
  reviewConfirm,
  getDateRangeInclusive,
  toggleLeaveApprovedDate,
  parseDateOnly,
  workweekConfigs = [],
}) {
  const formatDisplayDate = (date) =>
    parseDateOnly(date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

  return (
    <>
      {reviewConfirm.module === "leave" &&
        reviewConfirm.decisionMode !== "cancellation" &&
        reviewConfirm.status === "Approved" &&
        reviewConfirm.isMultiDay && (
          <div className="mb-4 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="m-0 text-xs font-bold uppercase tracking-wider text-amber-800">
                  Select specific days to approve
                </p>
                <p className="m-0 mt-1 text-[11px] text-slate-600">
                  Choose the exact working days you want to approve.
                </p>
              </div>
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
                {(reviewConfirm.selectedDates || []).length} selected
              </span>
            </div>
            <div className="grid max-h-56 grid-cols-1 gap-2 overflow-y-auto pr-1 md:grid-cols-2">
              {getDateRangeInclusive(
                reviewConfirm.item.date_from,
                reviewConfirm.item.date_to,
                workweekConfigs,
              ).map((date) => (
                <label
                  key={date}
                  className="flex cursor-pointer items-start gap-3 rounded-xl border border-amber-200 bg-white px-3 py-2.5 text-xs text-gray-700 shadow-sm transition hover:border-amber-300 hover:bg-amber-50/70"
                >
                  <input
                    type="checkbox"
                    checked={(reviewConfirm.selectedDates || []).includes(date)}
                    onChange={() => toggleLeaveApprovedDate(date)}
                    className="mt-0.5 h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span className="leading-5 text-slate-800">
                    {formatDisplayDate(date)}
                  </span>
                </label>
              ))}
            </div>
            <p className="m-0 mt-3 text-[11px] text-slate-500">
              Unselected days will remain pending for this request.
            </p>
          </div>
        )}
    </>
  );
}
