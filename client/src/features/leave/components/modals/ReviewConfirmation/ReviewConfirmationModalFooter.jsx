export default function ReviewConfirmationModalFooter({
  reviewConfirm,
  setReviewConfirm,
  submitReviewDecision,
}) {
  const hasDecision = Boolean(reviewConfirm.status);
  const isCancellation = reviewConfirm.decisionMode === "cancellation";

  return (
    <div className="flex justify-end gap-2">
      <button
        type="button"
        onClick={() => setReviewConfirm(null)}
        className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        Cancel
      </button>

      {!hasDecision ? (
        <>
          <button
            type="button"
            onClick={() =>
              setReviewConfirm({ ...reviewConfirm, status: "Denied" })
            }
            className="rounded-lg border border-red-200 dark:border-red-900/30 bg-red-100 dark:bg-red-900/20 px-4 py-2 text-sm font-semibold text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors"
          >
            {isCancellation ? "Keep Request" : "Deny"}
          </button>
          <button
            type="button"
            onClick={() =>
              setReviewConfirm({ ...reviewConfirm, status: "Approved" })
            }
            className="rounded-lg border border-green-200 dark:border-green-900/30 bg-green-100 dark:bg-green-900/20 px-4 py-2 text-sm font-semibold text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/40 transition-colors"
          >
            {isCancellation ? "Approve Cancel" : "Approve"}
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
            className="rounded-lg border border-slate-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
          >
            Back
          </button>
          <button
            type="button"
            onClick={submitReviewDecision}
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${reviewConfirm.status === "Denied" ? "bg-red-600" : "bg-green-600"}`}
          >
            Confirm
          </button>
        </>
      )}
    </div>
  );
}
