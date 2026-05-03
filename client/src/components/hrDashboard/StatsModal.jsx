import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ReviewResigApp from "@/features/leave/components/forms/ReviewResigApp";
import axiosInterceptor from "@/hooks/interceptor";
import { mutationHandler } from "@/features/leave/hooks/createMutationHandler";
import { workweekConfigQueryOptions } from "@/features/leave/utils/query.utils";
import {
  formatLongDate,
  getWorkingDateRangeInclusive,
} from "@/features/leave/utils/date.utils";

function EmployeeCard({
  employee,
  avatarColor,
  badgeClass,
  badgeLabel,
  children,
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-800/50 p-3 shadow-sm">
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${avatarColor}`}
      >
        {employee.first_name.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-900 dark:text-gray-100">
          {employee.first_name} {employee.last_name}
        </p>
        {children}
      </div>
      <Badge variant="outline" className={`text-[11px] dark:bg-gray-900 ${badgeClass}`}>
        {badgeLabel}
      </Badge>
    </div>
  );
}

export function PendingLeaveModal({ open, onClose, pendingLeaves, mutation }) {
  const [reviewConfirm, setReviewConfirm] = useState(null);
  const { data: workweekConfigs = [] } = useQuery(workweekConfigQueryOptions);

  const openLeaveDecisionConfirm = (employee, status) => {
    const requestedDates = getWorkingDateRangeInclusive(
      employee.date_from,
      employee.date_to,
      workweekConfigs,
    );
    const totalDays = requestedDates.length;

    setReviewConfirm({
      employee,
      status,
      totalDays,
      isMultiDay: totalDays > 1,
      selectedDates: requestedDates,
      remarks: "",
    });
  };

  const getReviewReason = (employee) =>
    employee?.reason || employee?.remarks || employee?.leave_reason || "";

  const getReviewFiles = (employee) => {
    const docsRaw = employee?.documents;
    let docs = {};

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
      .map(([key, value]) => {
        if (typeof value === "string" && value.trim().length > 0) {
          let fileUrl = value;
          if (!fileUrl.startsWith('http') && !fileUrl.startsWith('/api/')) {
            fileUrl = `/api/file/get?filename=${encodeURIComponent(value)}`;
          }
          return { key, url: fileUrl, label: key };
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
      .filter(Boolean);

    if (employee?.ocp) {
      let ocpUrl = employee.ocp;
      if (!ocpUrl.startsWith('http') && !ocpUrl.startsWith('/api/')) {
        ocpUrl = `/api/file/get?filename=${encodeURIComponent(ocpUrl)}`;
      }
      files.push({ key: "ocp", url: ocpUrl, label: "ocp" });
    }

    ["doctor_cert", "death_cert", "birth_cert", "marriage_cert"].forEach(
      (field) => {
        const value = employee?.[field];
        if (typeof value === "string" && value.trim().length > 0) {
          let fileUrl = value;
          if (!fileUrl.startsWith('http') && !fileUrl.startsWith('/api/')) {
            fileUrl = `/api/file/get?filename=${encodeURIComponent(value)}`;
          }
          files.push({ key: field, url: fileUrl, label: field });
        }
      },
    );

    const uniqueMap = new Map();
    files.forEach((entry) => {
      const uniqueKey = `${entry.key}-${entry.url}`;
      if (!uniqueMap.has(uniqueKey)) uniqueMap.set(uniqueKey, entry);
    });

    return Array.from(uniqueMap.values());
  };

  const toggleApprovedDate = (date) => {
    if (!reviewConfirm) return;

    const selected = new Set(reviewConfirm.selectedDates || []);
    if (selected.has(date)) {
      selected.delete(date);
    } else {
      selected.add(date);
    }

    setReviewConfirm({
      ...reviewConfirm,
      selectedDates: Array.from(selected).sort(),
    });
  };

  const submitLeaveDecision = () => {
    if (!reviewConfirm || !mutation) return;

    if (!reviewConfirm.status) {
      alert("Select Approve or Deny after reviewing the request.");
      return;
    }

    const remarks = reviewConfirm.remarks?.trim();
    const isDenyDecision = reviewConfirm.status === "Denied";

    if (isDenyDecision && !remarks) {
      alert("Reason is required for denial.");
      return;
    }

    if (reviewConfirm.status === "Denied") {
      mutation.mutate({
        id: reviewConfirm.employee.id,
        status: "Denied",
        supervisor_remarks: remarks,
      });
      setReviewConfirm(null);
      return;
    }

    const requestedDates = getWorkingDateRangeInclusive(
      reviewConfirm.employee.date_from,
      reviewConfirm.employee.date_to,
      workweekConfigs,
    );
    const selectedDates = reviewConfirm.selectedDates || [];

    if (selectedDates.length === 0) {
      alert("Select at least one day to approve.");
      return;
    }

    const isPartial =
      reviewConfirm.isMultiDay && selectedDates.length < requestedDates.length;

    mutation.mutate({
      id: reviewConfirm.employee.id,
      status: isPartial ? "Partially Approved" : "Approved",
      approved_days: selectedDates.length,
      approved_dates: selectedDates,
      supervisor_remarks: undefined,
    });
    setReviewConfirm(null);
  };

  const handleFileDownloadClick = async (e, url, label) => {
    if (url.includes("/api/file/get")) {
      e.preventDefault();
      try {
        const blob = await mutationHandler(
          axiosInterceptor.get(url, { responseType: "blob" }),
          "Failed to download file.",
        );
        const objectUrl = window.URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = objectUrl;
        anchor.download = String(label).replace(/_/g, " ") || "download";
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      } catch (err) {
        window.open(url, "_blank");
      }
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setReviewConfirm(null);
            onClose();
          }
        }}
      >
        <DialogContent className="flex max-h-[80vh] max-w-[560px] flex-col overflow-hidden p-0 dark:border-gray-800">
          <DialogHeader className="shrink-0 bg-gradient-to-r from-purple-600 to-purple-700 px-4 py-3 md:py-2.5">
            <DialogTitle className="text-base font-semibold text-white">
              Pending Leaves
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-gray-900 p-4 md:p-3.5">
            {!pendingLeaves?.length ? (
              <p className="text-center text-sm font-medium text-slate-500 dark:text-gray-400">
                No pending requests.
              </p>
            ) : (
              <div className="space-y-2.5">
                {pendingLeaves.map((employee, idx) => (
                  <EmployeeCard
                    key={idx}
                    employee={employee}
                    avatarColor="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
                    badgeClass="bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800/50"
                    badgeLabel="Pending"
                  >
                    <p className="mt-0.5 text-xs text-slate-600 dark:text-gray-400">
                      {employee.leave_type}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500 dark:text-gray-500">
                      {formatLongDate(employee.date_from)} -{" "}
                      {formatLongDate(employee.date_to)}
                    </p>

                    <div className="mt-2 flex gap-1.5 border-t border-slate-200 dark:border-gray-700 pt-2">
                      <button
                        type="button"
                        onClick={() => openLeaveDecisionConfirm(employee)}
                        disabled={mutation?.isPending}
                        className="flex-1 rounded-md border-0 bg-indigo-100 dark:bg-indigo-900/30 px-2.5 py-1 text-[11px] font-bold text-indigo-700 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 disabled:opacity-50 transition-colors"
                      >
                        Review Application
                      </button>
                    </div>
                  </EmployeeCard>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!reviewConfirm}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setReviewConfirm(null);
        }}
      >
        <DialogContent className="max-h-[85vh] max-w-[560px] overflow-hidden p-0 dark:border-gray-800 dark:bg-gray-900">
          <DialogHeader className="border-b border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3">
            <DialogTitle className="text-base font-semibold text-slate-900 dark:text-gray-100">
              {reviewConfirm?.status
                ? reviewConfirm.status === "Denied"
                  ? "Confirm Denial"
                  : "Confirm Approval"
                : "Review Application"}
            </DialogTitle>
          </DialogHeader>

          <div className="max-h-[60vh] space-y-3 overflow-y-auto bg-slate-50 dark:bg-gray-900 p-4">
            {reviewConfirm && (
              <>
                <p className="m-0 text-sm text-slate-700 dark:text-gray-300">
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
                    <p className="m-0 mt-1 text-sm text-slate-900 dark:text-gray-100">
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
                      {getReviewFiles(reviewConfirm.employee).map((file) => (
                        <a
                          key={`${file.key}-${file.url}`}
                          href={file.url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => handleFileDownloadClick(e, file.url, file.label || file.key)}
                          className="inline-flex items-center rounded-md border border-sky-200 dark:border-sky-900/50 bg-white dark:bg-gray-800 px-2.5 py-1 text-[11px] font-semibold text-sky-700 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/30"
                        >
                          {String(file.label || file.key).replace(/_/g, " ")}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {reviewConfirm.status ? (
                  <p className="m-0 text-sm text-slate-700 dark:text-gray-300">
                    Are you sure you want to{" "}
                    {reviewConfirm.status.toLowerCase()} this leave request?
                  </p>
                ) : (
                  <p className="m-0 text-sm text-slate-700 dark:text-gray-300">
                    Review all details first, then choose Approve or Deny.
                  </p>
                )}

                {reviewConfirm.status === "Approved" &&
                  reviewConfirm.isMultiDay &&
                  (() => {
                    const availableDates = getWorkingDateRangeInclusive(
                      reviewConfirm.employee.date_from,
                      reviewConfirm.employee.date_to,
                      workweekConfigs,
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
                              Approve only the working days you need.
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
                            {selectedDates.map((date) => (
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
                          {availableDates.map((date) => (
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
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">
                      Reason (required)
                    </label>
                    <textarea
                      rows={3}
                      value={reviewConfirm.remarks}
                      onChange={(e) =>
                        setReviewConfirm({
                          ...reviewConfirm,
                          remarks: e.target.value,
                        })
                      }
                      className="w-full resize-none rounded-md border border-slate-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-slate-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-violet-500"
                      placeholder="Enter reason for denial"
                    />
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-800/50 px-4 py-3">
            <button
              type="button"
              onClick={() => setReviewConfirm(null)}
              className="rounded-md border border-slate-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            {!reviewConfirm?.status ? (
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
                  className="rounded-md border border-red-200 dark:border-red-900/30 bg-red-100 dark:bg-red-900/40 px-4 py-2 text-sm font-semibold text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/60"
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
                  className="rounded-md border border-green-200 dark:border-green-900/30 bg-green-100 dark:bg-green-900/40 px-4 py-2 text-sm font-semibold text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/60"
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
                  className="rounded-md border border-slate-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={submitLeaveDecision}
                  disabled={mutation?.isPending}
                  className={`rounded-md px-4 py-2 text-sm font-semibold text-white transition-colors ${reviewConfirm?.status === "Denied" ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"} disabled:opacity-50`}
                >
                  {reviewConfirm?.status === "Denied"
                    ? "Confirm Denial"
                    : "Confirm Approval"}
                </button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function OnLeaveModal({ open, onClose, onLeave }) {
  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="flex max-h-[80vh] max-w-[500px] flex-col overflow-hidden p-0 dark:border-gray-800">
        <DialogHeader className="shrink-0 bg-gradient-to-r from-purple-600 to-purple-700 px-4 py-3 md:py-2.5">
          <DialogTitle className="text-base font-semibold text-white">
            Employees on leave today
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-gray-900 p-4 md:p-3.5">
          {!onLeave?.length ? (
            <p className="text-center text-sm font-medium text-slate-500 dark:text-gray-400">
              No employees on leave today.
            </p>
          ) : (
            <div className="space-y-2.5">
              {onLeave.map((employee, idx) => (
                <EmployeeCard
                  key={idx}
                  employee={employee}
                  avatarColor="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                  badgeClass="bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50"
                  badgeLabel="On Leave"
                >
                  <p className="mt-0.5 text-xs text-slate-600 dark:text-gray-400">
                    {employee.leave_type}
                  </p>
                </EmployeeCard>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AbsentModal({ open, onClose, absents }) {
  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="flex max-h-[80vh] max-w-[500px] flex-col overflow-hidden p-0 dark:border-gray-800">
        <DialogHeader className="shrink-0 bg-gradient-to-r from-purple-600 to-purple-700 px-4 py-3 md:py-2.5">
          <DialogTitle className="text-base font-semibold text-white">
            Absent Employees
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-gray-900 p-4 md:p-3.5">
          {!absents?.length ? (
            <p className="text-center text-sm font-medium text-slate-500 dark:text-gray-400">
              No absent employees today.
            </p>
          ) : (
            <div className="space-y-2.5">
              {absents.map((employee, idx) => (
                <EmployeeCard
                  key={idx}
                  employee={employee}
                  avatarColor="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                  badgeClass="bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50"
                  badgeLabel="Absent"
                >
                  <p className="mt-0.5 text-xs text-slate-600 dark:text-gray-400">
                    Not marked present for today.
                  </p>
                </EmployeeCard>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ResignationModal({ open, onClose, resignations, mutation }) {
  const [reviewData, setReviewData] = useState(null);

  const parseMaybeArray = (value) => {
    if (Array.isArray(value)) return value;
    if (typeof value !== "string") return [];

    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const openResignationReview = (item) => {
    setReviewData({
      item,
      leavingReasons: parseMaybeArray(item.leaving_reasons_json),
      interviewAnswers: parseMaybeArray(item.exit_interview_answers_json),
    });
    onClose();
  };

  const closeResignationReview = () => setReviewData(null);

  const downloadEndorsementFile = async (fileKey) => {
    if (!fileKey) return;

    const blob = await mutationHandler(
      axiosInterceptor.get(
        `/api/file/get?filename=${encodeURIComponent(fileKey)}`,
        { responseType: "blob" },
      ),
      "Failed to retrieve endorsement file.",
    );
    const objectUrl = window.URL.createObjectURL(blob);

    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = fileKey.split("_").pop() || "endorsement-file";

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  };

  const finalApproveResignation = () => {
    if (!reviewData?.item || !mutation?.mutate) return;

    mutation.mutate(
      {
        id: reviewData.item.id,
        status: "Approved",
      },
      {
        onSuccess: () => {
          closeResignationReview();
        },
      },
    );
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            onClose();
          }
        }}
      >
        <DialogContent className="max-w-[500px] overflow-hidden p-0 dark:border-gray-800">
          <DialogHeader className="bg-gradient-to-r from-purple-600 to-purple-700 px-4 py-3 md:py-2.5">
            <DialogTitle className="text-base font-semibold text-white">
              Pending Resignations
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto bg-slate-50 dark:bg-gray-900 p-4 md:p-3.5">
            {!resignations?.length ? (
              <p className="text-center text-sm font-medium text-slate-500 dark:text-gray-400">
                No pending resignations.
              </p>
            ) : (
              <div className="space-y-2.5">
                {resignations.map((r, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col gap-2.5 rounded-lg border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-800/50 p-3 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-gray-100">
                          {r.first_name} {r.last_name}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-500 dark:text-gray-400">
                          {r.resignation_type}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="border-yellow-200 bg-yellow-100 text-[11px] text-yellow-800 dark:border-yellow-800/50 dark:bg-yellow-900/30 dark:text-yellow-400"
                      >
                        {r.status}
                      </Badge>
                    </div>

                    <div className="flex gap-1.5 border-t border-slate-200 dark:border-gray-700 pt-2.5">
                      <button
                        type="button"
                        onClick={() => openResignationReview(r)}
                        disabled={mutation?.isPending}
                        className="flex-1 rounded-md border-0 bg-indigo-100 dark:bg-indigo-900/30 px-2.5 py-1 text-[11px] font-bold text-indigo-700 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 disabled:opacity-50 transition-colors"
                      >
                        Review Application
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ReviewResigApp
        reviewData={reviewData}
        onClose={closeResignationReview}
        onKeepPending={closeResignationReview}
        onFinalApprove={finalApproveResignation}
        isApproving={Boolean(mutation?.isPending)}
        onPreviewEndorsement={downloadEndorsementFile}
      />
    </>
  );
}
