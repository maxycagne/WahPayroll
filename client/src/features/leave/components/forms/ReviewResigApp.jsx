import { formatLongDate } from "@/features/leave/utils/date.utils";

const exitInterviewQuestions = [
  "What caused you to start looking for a new job?",
  "Why have you decided to leave the company?",
  "Was a single event responsible for your decision to leave?",
  "What does your new company offer that influenced your decision?",
  "What do you value about this company?",
  "What did you dislike about the company?",
  "How was your relationship with your manager?",
  "What could your supervisor improve in their management style?",
  "What did you like most about your job?",
  "What did you dislike about your job? What would you change?",
  "Did you have the resources and support needed to do your job? If not, what was missing?",
  "Were your goals clear and expectations well defined?",
  "Did you receive adequate feedback on your performance?",
  "Did you feel aligned with the company’s mission and goals?",
  "Any recommendations regarding compensation, benefits, or recognition?",
  "What would make you consider returning? Would you recommend this company to others?",
];

const reviewBadgeClass = {
  Approved:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  Denied: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  Pending:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  "Pending Approval":
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  "Cancellation Requested":
    "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  Rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  "Partially Approved":
    "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
};

function getResignationProgressPercent(item) {
  const totalSteps = 5;
  const step = Math.max(
    1,
    Math.min(Number(item?.current_step || totalSteps), totalSteps),
  );
  return {
    step,
    percent: Math.round((step / totalSteps) * 100),
    totalSteps,
  };
}

export default function ReviewResigApp({
  reviewData,
  onClose,
  onKeepPending,
  onFinalApprove,
  isApproving,
  onPreviewEndorsement,
}) {
  if (!reviewData) return null;

  const progress = getResignationProgressPercent(reviewData.item);
  const isImmediateResignation =
    Boolean(reviewData.item?.immediate_resignation) ||
    !reviewData.item?.last_working_day;

  return (
    <div className="fixed inset-0 z-[72] flex items-center justify-center bg-black/55 p-4">
      <div className="flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 px-5 py-3">
          <div>
            <h3 className="m-0 text-base font-bold text-gray-900 dark:text-gray-100">
              Resignation Supervisor Review
            </h3>
            <p className="m-0 mt-1 text-xs font-medium text-gray-600 dark:text-gray-400">
              {reviewData.item.first_name} {reviewData.item.last_name} •{" "}
              {reviewData.item.resignation_type || "Resignation"}
            </p>
            {isImmediateResignation && (
              <span className="mt-2 inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-rose-800 dark:bg-rose-900/30 dark:text-rose-400">
                Immediate Resignation Request
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-md border-0 bg-transparent px-2 py-1 text-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            &times;
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-auto p-5">
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="m-0 text-sm font-semibold text-gray-800 dark:text-gray-200">
                Current Progress: Step {progress.step} of {progress.totalSteps}
              </p>
              <span
                className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${reviewBadgeClass[reviewData.item.status] || "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"}`}
              >
                {reviewData.item.status || "Pending Approval"}
              </span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 p-4 shadow-sm">
            <p className="m-0 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Step 1 • Resignation Letter
            </p>
            <p className="m-0 mt-2 whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200">
              {reviewData.item.resignation_letter ||
                "No resignation letter provided."}
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 p-4 shadow-sm">
            <p className="m-0 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Step 2 • Employee Resignation Form
            </p>
            <div className="mt-2 grid grid-cols-1 gap-2 text-sm text-gray-800 dark:text-gray-200 md:grid-cols-2">
              <p className="m-0">
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  Recipient:
                </span>{" "}
                {reviewData.item.recipient_name || "-"}
              </p>
              <p className="m-0">
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  Resignation Date:
                </span>{" "}
                {reviewData.item.resignation_date
                  ? formatLongDate(reviewData.item.resignation_date)
                  : "-"}
              </p>
              <p className="m-0">
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  Last Working Day:
                </span>{" "}
                {reviewData.item.last_working_day
                  ? formatLongDate(reviewData.item.last_working_day)
                  : "-"}
              </p>
              <p className="m-0">
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  Effective Date:
                </span>{" "}
                {reviewData.item.effective_date
                  ? formatLongDate(reviewData.item.effective_date)
                  : "-"}
              </p>
            </div>

            <div className="mt-3">
              <p className="m-0 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Reasons for Leaving
              </p>
              {reviewData.leavingReasons.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {reviewData.leavingReasons.map((reason) => (
                    <span
                      key={reason}
                      className="inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-900/30 px-2.5 py-1 text-[11px] font-semibold text-amber-800 dark:text-amber-400"
                    >
                      {reason}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="m-0 mt-2 text-sm text-gray-600">-</p>
              )}
              {reviewData.item.leaving_reason_other && (
                <p className="m-0 mt-2 text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    Others:
                  </span>{" "}
                  {reviewData.item.leaving_reason_other}
                </p>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 p-4 shadow-sm">
            <p className="m-0 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Step 3 • Exit Interview Responses
            </p>
            <p className="m-0 mt-2 text-sm text-gray-700 dark:text-gray-300">
              Completed answers:{" "}
              {
                reviewData.interviewAnswers.filter((answer) =>
                  String(answer || "").trim(),
                ).length
              }
              /16
            </p>
            <div className="mt-3 space-y-2">
              {exitInterviewQuestions.map((question, index) => (
                <div
                  key={question}
                  className="rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 px-3 py-2"
                >
                  <p className="m-0 text-xs font-semibold text-gray-700 dark:text-gray-300">
                    {index + 1}. {question}
                  </p>
                  <p className="m-0 mt-1 whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200">
                    {reviewData.interviewAnswers[index] || "No response."}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 p-4 shadow-sm">
            <p className="m-0 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Step 4 • Endorsement Form Submission
            </p>
            <p className="m-0 mt-2 text-sm text-gray-800 dark:text-gray-200">
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                File Key:
              </span>{" "}
              {reviewData.item.endorsement_file_key || "Not uploaded"}
            </p>
            {reviewData.item.endorsement_file_key && (
              <button
                type="button"
                onClick={() =>
                  onPreviewEndorsement(reviewData.item.endorsement_file_key)
                }
                className="mt-2 rounded-md border border-indigo-200 dark:border-indigo-900/30 bg-indigo-100 dark:bg-indigo-900/40 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-indigo-700 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900/60"
              >
                Download Endorsement File
              </button>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 px-5 py-3">
          <button
            type="button"
            onClick={onKeepPending}
            className="rounded-md border border-amber-300 dark:border-amber-800 bg-amber-100 dark:bg-amber-900/30 px-4 py-2 text-sm font-semibold text-amber-800 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
          >
            Keep Pending (Under Review)
          </button>
          <button
            type="button"
            disabled={isApproving}
            onClick={onFinalApprove}
            className="rounded-md border border-emerald-700 dark:border-emerald-800 bg-emerald-600 dark:bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 dark:hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
          >
            Final Approve
          </button>
        </div>
      </div>
    </div>
  );
}
