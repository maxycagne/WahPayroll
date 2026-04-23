import { formatLongDate } from "@/features/leave/utils/date.utils";

export default function ReviewConfirmationModalHeader({ reviewConfirm }) {
  const hasDecision = Boolean(reviewConfirm.status);

  return (
    <>
      <h2 className="m-0 mb-2 text-lg font-semibold text-gray-900">
        {!hasDecision
          ? reviewConfirm.decisionMode === "cancellation"
            ? "Review Cancellation Request"
            : "Review Application"
          : reviewConfirm.decisionMode === "cancellation"
            ? reviewConfirm.status === "Denied"
              ? "Decline Cancellation Request"
              : "Approve Cancellation Request"
            : reviewConfirm.status === "Denied"
              ? "Confirm Denial"
              : "Confirm Approval"}
      </h2>
      <p className="m-0 mb-4 text-sm text-gray-600">
        {reviewConfirm.item.first_name} {reviewConfirm.item.last_name}
        {reviewConfirm.module === "resignation"
          ? ` • ${reviewConfirm.item.resignation_type}`
          : ` • ${formatLongDate(reviewConfirm.item.date_from)} - ${formatLongDate(reviewConfirm.item.date_to)}`}
      </p>
    </>
  );
}
