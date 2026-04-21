import {
  getLeavePolicy,
  isMandatedLeave,
  isDeductibleLeave,
  getRequiredApprovals,
  getRequiredDocuments,
} from "../../../leaveConstants";

export default function LeaveConfirmationModalContent({ confirmAction }) {
  const policy = getLeavePolicy(confirmAction.leaveType);
  const isMandated = isMandatedLeave(confirmAction.leaveType);
  const isDeductible = isDeductibleLeave(confirmAction.leaveType);
  const approvals = getRequiredApprovals(confirmAction.leaveType);
  const requiredDocs = getRequiredDocuments(confirmAction.leaveType);

  return (
    <div className="mb-6 space-y-4 text-sm">
      {/* Basic Info */}
      <div>
        <p className="m-0 text-gray-600 font-medium">Type:</p>
        <p className="m-0 text-purple-700 font-bold">
          {confirmAction.leaveType}
        </p>
      </div>

      <div>
        <p className="m-0 text-gray-600 font-medium">Dates:</p>
        <p className="m-0 text-gray-900 font-semibold">
          {formatLongDate(confirmAction.fromDate)} to{" "}
          {formatLongDate(confirmAction.toDate)}
        </p>
      </div>

      {confirmAction.leaveType === "Offset" && (
        <div>
          <p className="m-0 text-gray-600 font-medium">Applied Amount:</p>
          <p className="m-0 text-gray-900 font-semibold">
            {confirmAction.daysApplied} Days/Hours
          </p>
        </div>
      )}

      {/* Balance Deduction Info */}
      <div
        className={`rounded-lg border px-3 py-2 ${
          isDeductible
            ? "border-orange-200 bg-orange-50"
            : "border-blue-200 bg-blue-50"
        }`}
      >
        <p className="m-0 text-xs font-medium">
          {isDeductible ? "💳 Balance Deduction" : "✓ No Balance Deduction"}
        </p>
        <p className="m-0 text-xs text-gray-700 mt-1">
          {isDeductible
            ? "This leave will reduce your leave balance."
            : "This leave does not reduce your balance."}
        </p>
      </div>

      {/* Mandated Leave Notice */}
      {isMandated && (
        <div className="rounded-lg border border-blue-300 bg-blue-50 px-3 py-2">
          <p className="m-0 text-xs font-bold text-blue-900">
            📋 Legally Mandated Leave
          </p>
          <p className="m-0 text-xs text-gray-700 mt-1">
            This is a legally mandated leave with specific entitlements and
            approval requirements.
          </p>
        </div>
      )}

      {/* Approval Chain */}
      {approvals.length > 0 && (
        <div>
          <p className="m-0 text-gray-600 font-medium mb-2">Approval Chain:</p>
          <div className="space-y-2">
            {approvals.map((approver, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs">
                <div className="rounded-full bg-purple-200 px-2 py-1 font-semibold text-purple-900">
                  {idx + 1}
                </div>
                <span className="text-gray-700">
                  {approver === "supervisor"
                    ? "Supervisor Approval"
                    : approver === "executive_director"
                      ? "Executive Director Approval"
                      : approver === "hr"
                        ? "HR Endorsement"
                        : approver.replace(/_/g, " ").charAt(0).toUpperCase() +
                          approver.replace(/_/g, " ").slice(1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Required Documents */}
      {requiredDocs.length > 0 && (
        <div>
          <p className="m-0 text-gray-600 font-medium mb-2">
            Required Documents:
          </p>
          <ul className="m-0 space-y-1 pl-4">
            {requiredDocs.map((doc, idx) => (
              <li key={idx} className="text-xs text-gray-700">
                •{" "}
                {doc
                  .replace(/_/g, " ")
                  .replace(/\b\w/g, (l) => l.toUpperCase())}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Notice Requirements */}
      {policy && policy.minNoticeHours > 0 && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2">
          <p className="m-0 text-xs font-medium text-yellow-900">
            ⏰ Notice Requirement
          </p>
          <p className="m-0 text-xs text-gray-700 mt-1">
            {policy.minNoticeHours >= 168
              ? `${Math.ceil(policy.minNoticeHours / 24)} days advance notice required`
              : `${policy.minNoticeHours} hours advance notice required`}
          </p>
        </div>
      )}

      {/* Leave Without Pay Note */}
      {confirmAction.leaveType === "Leave Without Pay" && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2">
          <p className="m-0 text-xs font-bold text-amber-900">⚠️ Important</p>
          <p className="m-0 text-xs text-amber-800 mt-1">
            This leave is for unregularized or zero-balance employees. Executive
            Director approval is required.
          </p>
        </div>
      )}

      {/* Emergency Leave Note */}
      {confirmAction.leaveType === "Unscheduled - Emergency Leave" && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2">
          <p className="m-0 text-xs font-bold text-red-900">⚡ Emergency</p>
          <p className="m-0 text-xs text-gray-700 mt-1">
            Limited to 1 day per occurrence. Notify your supervisor immediately.
          </p>
        </div>
      )}
    </div>
  );
}
