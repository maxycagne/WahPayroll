import React from "react";
import { formatLongDate, getWorkingDateRangeInclusive } from "@/features/leave/utils/date.utils";
import { LeaveRequest } from "../types";

interface ReviewLeaveModalProps {
  reviewConfirm: any;
  workweekConfigs: any[];
  setReviewConfirm: (val: any) => void;
  submitLeaveDecision: () => void;
  toggleApprovedDate: (date: string) => void;
}

export const ReviewLeaveModal: React.FC<ReviewLeaveModalProps> = ({
  reviewConfirm,
  workweekConfigs,
  setReviewConfirm,
  submitLeaveDecision,
  toggleApprovedDate,
}) => {
  const getReviewReason = (employee: LeaveRequest) =>
    employee?.reason || employee?.remarks || employee?.leave_reason || "";

  const getReviewFiles = (employee: LeaveRequest) => {
    const docsRaw = employee?.documents;
    let docs: any = {};

    if (typeof docsRaw === "string") {
      try {
        docs = JSON.parse(docsRaw);
      } catch {
        docs = {};
      }
    } else if (docsRaw && typeof docsRaw === "object") {
      docs = docsRaw;
    }

    const files = Object.entries(docs)
      .map(([key, value]: [string, any]) => {
        if (typeof value === "string" && value.trim().length > 0) {
          return { key, url: value, label: key };
        }

        if (value && typeof value === "object") {
          const directUrl = value.url || value.download_url || value.fileUrl;
          if (typeof directUrl === "string" && directUrl.trim().length > 0) {
            return {
              key,
              url: directUrl,
              label: value.originalName || value.file_name || key,
            };
          }

          const keyValue = value.key || value.file_key || value.filename;
          if (typeof keyValue === "string" && keyValue.trim().length > 0) {
            return {
              key,
              url: `/api/file/get?filename=${encodeURIComponent(keyValue)}`,
              label: value.originalName || value.file_name || key,
            };
          }
        }

        return null;
      })
      .filter(Boolean) as any[];

    if (employee?.ocp) {
      files.push({ key: "ocp", url: employee.ocp, label: "ocp" });
    }

    ["doctor_cert", "death_cert", "birth_cert", "marriage_cert"].forEach(
      (field) => {
        const value = (employee as any)?.[field];
        if (typeof value === "string" && value.trim().length > 0) {
          files.push({ key: field, url: value, label: field });
        }
      }
    );

    const uniqueMap = new Map();
    files.forEach((entry) => {
      const uniqueKey = `${entry.key}-${entry.url}`;
      if (!uniqueMap.has(uniqueKey)) uniqueMap.set(uniqueKey, entry);
    });

    return Array.from(uniqueMap.values());
  };

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/45 backdrop-blur-[2px]"
      onClick={() => setReviewConfirm(null)}
    >
      <div
        className="fixed left-[50%] top-[50%] z-[61] w-full max-w-xl translate-x-[-50%] translate-y-[-50%] rounded-xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-gray-800 px-4 py-3">
          <h3 className="m-0 text-sm font-semibold text-slate-900 dark:text-gray-100">
            {reviewConfirm.status
              ? reviewConfirm.status === "Denied"
                ? "Confirm Denial"
                : "Confirm Approval"
              : "Review Application"}
          </h3>
          <button
            type="button"
            onClick={() => setReviewConfirm(null)}
            className="rounded text-lg text-slate-500 hover:text-slate-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            ×
          </button>
        </div>

        <div className="max-h-[56vh] space-y-3 overflow-y-auto px-4 py-3">
          <p className="m-0 text-xs text-slate-700 dark:text-gray-300">
            <span className="font-semibold text-slate-900 dark:text-gray-100">
              {reviewConfirm.employee.first_name}{" "}
              {reviewConfirm.employee.last_name}
            </span>{" "}
            requested {reviewConfirm.employee.leave_type} from{" "}
            {formatLongDate(reviewConfirm.employee.date_from)} to{" "}
            {formatLongDate(reviewConfirm.employee.date_to)}.
          </p>

          {getReviewReason(reviewConfirm.employee) && (
            <div className="rounded-md border border-slate-200 dark:border-gray-800 bg-slate-50 dark:bg-gray-800/50 px-3 py-2">
              <p className="m-0 text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-gray-400">
                Stated Reason
              </p>
              <p className="m-0 mt-1 text-xs text-slate-900 dark:text-gray-100">
                {getReviewReason(reviewConfirm.employee)}
              </p>
            </div>
          )}

          {getReviewFiles(reviewConfirm.employee).length > 0 && (
            <div className="rounded-md border border-sky-200 dark:border-sky-900/30 bg-sky-50 dark:bg-sky-900/10 px-3 py-2">
              <p className="m-0 text-[10px] font-bold uppercase tracking-wider text-sky-800 dark:text-sky-400">
                Uploaded Files
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {getReviewFiles(reviewConfirm.employee).map((file: any) => (
                  <a
                    key={`${file.key}-${file.url}`}
                    href={file.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center rounded-md border border-sky-200 dark:border-sky-900/50 bg-white dark:bg-gray-800 px-2.5 py-1 text-[11px] font-semibold text-sky-700 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/30"
                  >
                    {String(file.label || file.key).replace(/_/g, " ")}
                  </a>
                ))}
              </div>
            </div>
          )}

          {reviewConfirm.status ? (
            <p className="m-0 text-xs text-slate-700 dark:text-gray-300">
              Are you sure you want to {reviewConfirm.status.toLowerCase()}{" "}
              this leave request?
            </p>
          ) : (
            <p className="m-0 text-xs text-slate-700 dark:text-gray-300">
              Review all details first, then choose Approve or Deny.
            </p>
          )}

          {reviewConfirm.status === "Approved" &&
            reviewConfirm.isMultiDay &&
            (() => {
              const availableDates = getWorkingDateRangeInclusive(
                reviewConfirm.employee.date_from,
                reviewConfirm.employee.date_to,
                workweekConfigs
              );
              const selectedDates = reviewConfirm.selectedDates || [];

              return (
                <div className="rounded-2xl border border-amber-200 dark:border-amber-900/30 bg-gradient-to-br from-amber-50 to-white dark:from-amber-900/20 dark:to-gray-900 p-4 shadow-sm">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="m-0 text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                        Select specific days to approve
                      </p>
                      <p className="m-0 mt-1 text-[11px] text-slate-600 dark:text-gray-400">
                        Pick the working days that should move forward.
                      </p>
                    </div>
                    <span className="rounded-full bg-amber-100 dark:bg-amber-900/40 px-2.5 py-1 text-[11px] font-semibold text-amber-800 dark:text-amber-300">
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
                      className="rounded-md border border-amber-300 dark:border-amber-700 bg-white dark:bg-gray-800 px-2.5 py-1 text-[11px] font-semibold text-amber-800 dark:text-amber-400 transition hover:bg-amber-50 dark:hover:bg-amber-900/30"
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
                      {selectedDates.map((date: string) => (
                        <span
                          key={date}
                          className="rounded-full bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:text-amber-300"
                        >
                          {formatLongDate(date)}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="grid max-h-56 grid-cols-1 gap-2 overflow-y-auto pr-1 md:grid-cols-2">
                    {availableDates.map((date: string) => (
                      <label
                        key={date}
                        className="flex cursor-pointer items-start gap-3 rounded-xl border border-amber-200 dark:border-amber-900/30 bg-white dark:bg-gray-800/50 px-3 py-2.5 text-[11px] text-slate-700 dark:text-gray-300 shadow-sm transition hover:border-amber-300 dark:hover:border-amber-700 hover:bg-amber-50/70 dark:hover:bg-amber-900/20"
                      >
                        <input
                          type="checkbox"
                          checked={selectedDates.includes(date)}
                          onChange={() => toggleApprovedDate(date)}
                          className="mt-0.5 h-4 w-4 rounded border-amber-300 dark:border-gray-700 text-amber-600 focus:ring-amber-500 dark:bg-gray-900"
                        />
                        <span className="leading-5 text-slate-800 dark:text-gray-200">
                          {formatLongDate(date)}
                        </span>
                      </label>
                    ))}
                  </div>
                  <p className="m-0 mt-3 text-[11px] font-semibold text-amber-800 dark:text-amber-400">
                    Selected: {selectedDates.length} day(s)
                  </p>
                </div>
              );
            })()}

          {reviewConfirm.status === "Denied" && (
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">
                Reason (required)
              </label>
              <textarea
                rows={2}
                value={reviewConfirm.remarks}
                onChange={(e) =>
                  setReviewConfirm({
                    ...reviewConfirm,
                    remarks: e.target.value,
                  })
                }
                className="w-full resize-none rounded-md border border-slate-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2.5 py-2 text-xs text-slate-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="Enter reason for denial"
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 dark:border-gray-800 bg-slate-50 dark:bg-gray-800/50 px-4 py-3">
          <button
            type="button"
            onClick={() => setReviewConfirm(null)}
            className="rounded-md border border-slate-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 transition-all duration-200 hover:bg-slate-50 dark:hover:bg-gray-700 hover:shadow active:translate-y-px"
          >
            Cancel
          </button>
          {!reviewConfirm.status ? (
            <>
              <button
                type="button"
                onClick={() =>
                  setReviewConfirm({
                    ...reviewConfirm,
                    status: "Denied",
                    remarks: "",
                  })
                }
                className="rounded-md border border-red-200 dark:border-red-900/30 bg-red-100 dark:bg-red-900/40 px-3 py-1.5 text-xs font-semibold text-red-700 dark:text-red-400 transition-all duration-200 hover:bg-red-200 dark:hover:bg-red-900/60"
              >
                Deny
              </button>
              <button
                type="button"
                onClick={() =>
                  setReviewConfirm({
                    ...reviewConfirm,
                    status: "Approved",
                  })
                }
                className="rounded-md border border-green-200 dark:border-green-900/30 bg-green-100 dark:bg-green-900/40 px-3 py-1.5 text-xs font-semibold text-green-700 dark:text-green-400 transition-all duration-200 hover:bg-green-200 dark:hover:bg-green-900/60"
              >
                Approve
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() =>
                  setReviewConfirm({
                    ...reviewConfirm,
                    status: undefined,
                    remarks: "",
                  })
                }
                className="rounded-md border border-slate-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 transition-all duration-200 hover:bg-slate-50 dark:hover:bg-gray-700"
              >
                Back
              </button>
              <button
                type="button"
                onClick={submitLeaveDecision}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold text-white transition-all duration-200 hover:shadow active:translate-y-px ${reviewConfirm.status === "Denied" ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}`}
              >
                {reviewConfirm.status === "Denied"
                  ? "Confirm Denial"
                  : "Confirm Approval"}
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
};
