import React from "react";
import { getDateRangeInclusive, parseDateOnly } from "../../utils/date";
import type { ReviewConfirmState } from "../../types/AdminDashboard";

type AdminLeaveDecisionModalProps = {
  reviewConfirm: ReviewConfirmState;
  onClose: () => void;
  onToggleApprovedDate: (date: string) => void;
  onRemarksChange: (remarks: string) => void;
  onSubmit: () => void | Promise<void>;
};

export default function AdminLeaveDecisionModal({
  reviewConfirm,
  onClose,
  onToggleApprovedDate,
  onRemarksChange,
  onSubmit,
}: AdminLeaveDecisionModalProps) {
  return (
    <div
      className="fixed inset-0 z-60 bg-black/45 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="fixed left-[50%] top-[50%] z-61 w-full max-w-xl translate-x-[-50%] translate-y-[-50%] rounded-xl border border-slate-200 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h3 className="m-0 text-sm font-semibold text-slate-900">
            {reviewConfirm.status === "Denied"
              ? "Confirm Denial"
              : "Confirm Approval"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded text-lg text-slate-500 transition-colors hover:text-slate-700"
          >
            ×
          </button>
        </div>

        <div className="max-h-[56vh] space-y-3 overflow-y-auto px-4 py-3">
          <p className="m-0 text-xs text-slate-700">
            <span className="font-semibold text-slate-900">
              {reviewConfirm.employee.first_name}{" "}
              {reviewConfirm.employee.last_name}
            </span>{" "}
            requested {reviewConfirm.employee.leave_type} from{" "}
            {new Date(reviewConfirm.employee.date_from).toLocaleDateString()} to{" "}
            {new Date(reviewConfirm.employee.date_to).toLocaleDateString()}.
          </p>

          <p className="m-0 text-xs text-slate-700">
            Are you sure you want to {reviewConfirm.status.toLowerCase()} this
            leave request?
          </p>

          {reviewConfirm.status === "Approved" && reviewConfirm.isMultiDay && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5">
              <p className="m-0 mb-2 text-[10px] font-bold uppercase tracking-wider text-amber-800">
                Multi-day request: select specific days to approve
              </p>
              <div className="grid max-h-40 grid-cols-2 gap-2 overflow-y-auto pr-1">
                {getDateRangeInclusive(
                  reviewConfirm.employee.date_from,
                  reviewConfirm.employee.date_to,
                ).map((date) => (
                  <label
                    key={date}
                    className="flex cursor-pointer items-center gap-2 rounded-md border border-amber-200 bg-white px-2 py-1 text-[11px] text-slate-700 transition-colors hover:bg-amber-100/40"
                  >
                    <input
                      type="checkbox"
                      checked={(reviewConfirm.selectedDates || []).includes(
                        date,
                      )}
                      onChange={() => onToggleApprovedDate(date)}
                    />
                    <span>{parseDateOnly(date).toLocaleDateString()}</span>
                  </label>
                ))}
              </div>
              <p className="m-0 mt-2 text-[11px] font-semibold text-amber-800">
                Selected: {(reviewConfirm.selectedDates || []).length} day(s)
              </p>
            </div>
          )}

          {reviewConfirm.status === "Denied" && (
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Reason (required)
              </label>
              <textarea
                rows={2}
                value={reviewConfirm.remarks}
                onChange={(e) => onRemarksChange(e.target.value)}
                className="w-full resize-none rounded-md border border-slate-300 px-2.5 py-2 text-xs outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="Enter reason for denial"
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-50 hover:shadow active:translate-y-px"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold text-white transition-all duration-200 hover:shadow active:translate-y-px ${
              reviewConfirm.status === "Denied"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {reviewConfirm.status === "Denied"
              ? "Confirm Denial"
              : "Confirm Approval"}
          </button>
        </div>
      </div>
    </div>
  );
}
