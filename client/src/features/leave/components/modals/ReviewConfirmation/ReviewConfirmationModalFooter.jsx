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
        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        Cancel
      </button>

      {!hasDecision ? (
        <>
          <button
            type="button"
            onClick={() => setReviewConfirm({ ...reviewConfirm, status: "Denied" })}
            className="rounded-lg border border-red-200 bg-red-100 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-200"
          >
            {isCancellation ? "Keep Request" : "Deny"}
          </button>
          <button
            type="button"
            onClick={() => setReviewConfirm({ ...reviewConfirm, status: "Approved" })}
            className="rounded-lg border border-green-200 bg-green-100 px-4 py-2 text-sm font-semibold text-green-700 hover:bg-green-200"
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
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
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
