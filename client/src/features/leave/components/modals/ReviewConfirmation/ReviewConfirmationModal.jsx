import ReviewConfirmationModalDaySelector from "./ReviewConfirmationModalDaySelector";
import ReviewConfirmationModalDenialReason from "./ReviewConfirmationModalDenialReason";
import ReviewConfirmationModalFooter from "./ReviewConfirmationModalFooter";
import ReviewConfirmationModalHeader from "./ReviewConfirmationModalHeader";
import ReviewConfirmationModalNotes from "./ReviewConfirmationModalNotes";
import ReviewConfirmationModalOffsetInput from "./ReviewConfirmationModalOffsetInput";

export default function ReviewConfirmationModal({
  reviewConfirm,
  setReviewConfirm,
  getDateRangeInclusive,
  toggleLeaveApprovedDate,
  parseDateOnly,
  getOffsetRequestedDays,
  submitReviewDecision,
  workweekConfigs = [],
}) {
  return (
    <>
      {reviewConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white dark:bg-gray-900 p-6 shadow-lg border border-gray-200 dark:border-gray-800">
            <ReviewConfirmationModalHeader reviewConfirm={reviewConfirm} />
            <ReviewConfirmationModalNotes reviewConfirm={reviewConfirm} />

            <ReviewConfirmationModalDaySelector
              reviewConfirm={reviewConfirm}
              getDateRangeInclusive={getDateRangeInclusive}
              toggleLeaveApprovedDate={toggleLeaveApprovedDate}
              parseDateOnly={parseDateOnly}
              setReviewConfirm={setReviewConfirm}
              workweekConfigs={workweekConfigs}
            />

            <ReviewConfirmationModalOffsetInput
              reviewConfirm={reviewConfirm}
              setReviewConfirm={setReviewConfirm}
              getOffsetRequestedDays={getOffsetRequestedDays}
            />

            <ReviewConfirmationModalDenialReason
              reviewConfirm={reviewConfirm}
              setReviewConfirm={setReviewConfirm}
            />

            <ReviewConfirmationModalFooter
              reviewConfirm={reviewConfirm}
              setReviewConfirm={setReviewConfirm}
              submitReviewDecision={submitReviewDecision}
            />
          </div>
        </div>
      )}
    </>
  );
}
