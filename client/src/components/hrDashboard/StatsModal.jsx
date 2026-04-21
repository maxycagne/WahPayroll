import { useState } from "react";
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

function parseDateOnly(value) {
  if (value instanceof Date)
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  const raw = String(value || "").trim();
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    const [, y, m, d] = match;
    return new Date(Number(y), Number(m) - 1, Number(d));
  }
  const parsed = new Date(raw);
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

function getDateDiffInclusive(start, end) {
  const from = parseDateOnly(start).getTime();
  const to = parseDateOnly(end).getTime();
  return Math.floor((to - from) / (1000 * 60 * 60 * 24)) + 1;
}

function getDateRangeInclusive(start, end) {
  const dates = [];
  const current = parseDateOnly(start);
  const to = parseDateOnly(end);

  while (current <= to) {
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, "0");
    const day = String(current.getDate()).padStart(2, "0");
    dates.push(`${year}-${month}-${day}`);
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

function EmployeeCard({
  employee,
  avatarColor,
  badgeClass,
  badgeLabel,
  children,
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${avatarColor}`}
      >
        {employee.first_name.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-900">
          {employee.first_name} {employee.last_name}
        </p>
        {children}
      </div>
      <Badge variant="outline" className={`text-[11px] ${badgeClass}`}>
        {badgeLabel}
      </Badge>
    </div>
  );
}

export function PendingLeaveModal({ open, onClose, pendingLeaves, mutation }) {
  const [reviewConfirm, setReviewConfirm] = useState(null);

  const openLeaveDecisionConfirm = (employee, status) => {
    const totalDays = getDateDiffInclusive(
      employee.date_from,
      employee.date_to,
    );
    const requestedDates = getDateRangeInclusive(
      employee.date_from,
      employee.date_to,
    );

    setReviewConfirm({
      employee,
      status,
      totalDays,
      isMultiDay: totalDays > 1,
      selectedDates: status === "Approved" ? requestedDates : [],
      remarks: "",
    });
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

    const requestedDates = getDateRangeInclusive(
      reviewConfirm.employee.date_from,
      reviewConfirm.employee.date_to,
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
        <DialogContent className="flex max-h-[80vh] max-w-[560px] flex-col overflow-hidden p-0">
          <DialogHeader className="shrink-0 bg-gradient-to-r from-purple-600 to-purple-700 px-4 py-3 md:py-2.5">
            <DialogTitle className="text-base font-semibold text-white">
              Pending Leaves
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-3.5">
            {!pendingLeaves?.length ? (
              <p className="text-center text-sm font-medium text-slate-500">
                No pending requests.
              </p>
            ) : (
              <div className="space-y-2.5">
                {pendingLeaves.map((employee, idx) => (
                  <EmployeeCard
                    key={idx}
                    employee={employee}
                    avatarColor="bg-purple-100 text-purple-600"
                    badgeClass="bg-yellow-100 text-yellow-800 border-yellow-200"
                    badgeLabel="Pending"
                  >
                    <p className="mt-0.5 text-xs text-slate-600">
                      {employee.leave_type}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {new Date(employee.date_from).toLocaleDateString()} -{" "}
                      {new Date(employee.date_to).toLocaleDateString()}
                    </p>

                    <div className="mt-2 flex gap-1.5 border-t border-slate-200 pt-2">
                      <button
                        type="button"
                        onClick={() =>
                          openLeaveDecisionConfirm(employee, "Approved")
                        }
                        disabled={mutation?.isPending}
                        className="flex-1 rounded-md border-0 bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-200 disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          openLeaveDecisionConfirm(employee, "Denied")
                        }
                        disabled={mutation?.isPending}
                        className="flex-1 rounded-md border-0 bg-rose-100 px-2.5 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-200 disabled:opacity-50"
                      >
                        Deny
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
        <DialogContent className="max-h-[85vh] max-w-[560px] overflow-hidden p-0">
          <DialogHeader className="border-b border-slate-200 bg-white px-4 py-3">
            <DialogTitle className="text-base font-semibold text-slate-900">
              {reviewConfirm?.status === "Denied"
                ? "Confirm Denial"
                : "Confirm Approval"}
            </DialogTitle>
          </DialogHeader>

          <div className="max-h-[60vh] space-y-3 overflow-y-auto bg-slate-50 p-4">
            {reviewConfirm && (
              <>
                <p className="m-0 text-sm text-slate-700">
                  <span className="font-semibold text-slate-900">
                    {reviewConfirm.employee.first_name}{" "}
                    {reviewConfirm.employee.last_name}
                  </span>{" "}
                  requested {reviewConfirm.employee.leave_type} from{" "}
                  {new Date(
                    reviewConfirm.employee.date_from,
                  ).toLocaleDateString()}{" "}
                  to{" "}
                  {new Date(
                    reviewConfirm.employee.date_to,
                  ).toLocaleDateString()}
                  .
                </p>

                <p className="m-0 text-sm text-slate-700">
                  Are you sure you want to {reviewConfirm.status.toLowerCase()}{" "}
                  this leave request?
                </p>

                {reviewConfirm.status === "Approved" &&
                  reviewConfirm.isMultiDay && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                      <p className="m-0 mb-2 text-xs font-bold uppercase tracking-wider text-amber-800">
                        Multi-day request: select specific days to approve
                      </p>
                      <div className="grid max-h-44 grid-cols-2 gap-2 overflow-y-auto pr-1">
                        {getDateRangeInclusive(
                          reviewConfirm.employee.date_from,
                          reviewConfirm.employee.date_to,
                        ).map((date) => (
                          <label
                            key={date}
                            className="flex cursor-pointer items-center gap-2 rounded-md border border-amber-200 bg-white px-2 py-1.5 text-xs text-slate-700"
                          >
                            <input
                              type="checkbox"
                              checked={(
                                reviewConfirm.selectedDates || []
                              ).includes(date)}
                              onChange={() => toggleApprovedDate(date)}
                            />
                            <span>
                              {parseDateOnly(date).toLocaleDateString()}
                            </span>
                          </label>
                        ))}
                      </div>
                      <p className="m-0 mt-2 text-xs font-semibold text-amber-800">
                        Selected: {(reviewConfirm.selectedDates || []).length}{" "}
                        day(s)
                      </p>
                    </div>
                  )}

                {reviewConfirm.status === "Denied" && (
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
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
                      className="w-full resize-none rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500"
                      placeholder="Enter reason for denial"
                    />
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-200 bg-white px-4 py-3">
            <button
              type="button"
              onClick={() => setReviewConfirm(null)}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submitLeaveDecision}
              disabled={mutation?.isPending}
              className={`rounded-md px-4 py-2 text-sm font-semibold text-white ${reviewConfirm?.status === "Denied" ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"} disabled:opacity-50`}
            >
              {reviewConfirm?.status === "Denied"
                ? "Confirm Denial"
                : "Confirm Approval"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function OnLeaveModal({ open, onClose, onLeave }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[80vh] max-w-[500px] flex-col overflow-hidden p-0">
        <DialogHeader className="shrink-0 bg-gradient-to-r from-purple-600 to-purple-700 px-4 py-3 md:py-2.5">
          <DialogTitle className="text-base font-semibold text-white">
            Employees Currently on Leave
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-3.5">
          {!onLeave?.length ? (
            <p className="text-center text-sm font-medium text-slate-500">
              No employees on leave today.
            </p>
          ) : (
            <div className="space-y-2.5">
              {onLeave.map((employee, idx) => (
                <EmployeeCard
                  key={idx}
                  employee={employee}
                  avatarColor="bg-amber-100 text-amber-600"
                  badgeClass="bg-amber-100 text-amber-800 border-amber-200"
                  badgeLabel="On Leave"
                >
                  <p className="mt-0.5 text-xs text-slate-600">
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
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[80vh] max-w-[500px] flex-col overflow-hidden p-0">
        <DialogHeader className="shrink-0 bg-gradient-to-r from-purple-600 to-purple-700 px-4 py-3 md:py-2.5">
          <DialogTitle className="text-base font-semibold text-white">
            Absent Employees
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-3.5">
          {!absents?.length ? (
            <p className="text-center text-sm font-medium text-slate-500">
              No absent employees today.
            </p>
          ) : (
            <div className="space-y-2.5">
              {absents.map((employee, idx) => (
                <EmployeeCard
                  key={idx}
                  employee={employee}
                  avatarColor="bg-red-100 text-red-600"
                  badgeClass="bg-red-100 text-red-800 border-red-200"
                  badgeLabel="Absent"
                >
                  <p className="mt-0.5 text-xs text-slate-600">
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
        <DialogContent className="max-w-[500px] overflow-hidden p-0">
          <DialogHeader className="bg-gradient-to-r from-purple-600 to-purple-700 px-4 py-3 md:py-2.5">
            <DialogTitle className="text-base font-semibold text-white">
              Pending Resignations
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto p-4 md:p-3.5">
            {!resignations?.length ? (
              <p className="text-center text-sm font-medium text-slate-500">
                No pending resignations.
              </p>
            ) : (
              <div className="space-y-2.5">
                {resignations.map((r, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col gap-2.5 rounded-lg border border-slate-200 bg-slate-50 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          {r.first_name} {r.last_name}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          {r.resignation_type}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="border-yellow-200 bg-yellow-100 text-[11px] text-yellow-800"
                      >
                        {r.status}
                      </Badge>
                    </div>

                    <div className="flex gap-1.5 border-t border-slate-200 pt-2.5">
                      <button
                        type="button"
                        onClick={() => openResignationReview(r)}
                        disabled={mutation?.isPending}
                        className="flex-1 rounded-md border-0 bg-indigo-100 px-2.5 py-1 text-[11px] font-bold text-indigo-700 hover:bg-indigo-200 disabled:opacity-50"
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
