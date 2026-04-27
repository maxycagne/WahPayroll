import PendingApprovalTableRow from "./PendingApprovalTableRow";

export default function PendingApprovalTable({
  filteredPendingRequests,
  isHRRole,
  canHrDirectDecision,
  isPendingApprovalStatus,
  openResignationDecisionConfirm,
  openResignationReview,
  openLeaveDecisionConfirm,
  openOffsetDecisionConfirm,
  setHrNoteConfirm,
  setPendingModalOpen,
}) {
  return (
    <table className="w-full text-sm text-left">
      <thead className="sticky top-[43px] z-10 bg-white dark:bg-gray-900">
        <tr className="border-b border-gray-200 dark:border-gray-800">
          <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Employee
          </th>
          <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Request Type
          </th>
          <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Schedule
          </th>
          <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Cancellation Reason / HR Note
          </th>
          <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Cancel Requested At
          </th>
          <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            OCP
          </th>
          <th className="px-4 py-2.5 text-right text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Action
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
        {filteredPendingRequests.length === 0 ? (
          <tr>
            <td
              colSpan="7"
              className="px-4 py-8 text-center text-sm font-medium text-gray-500 dark:text-gray-400"
            >
              No pending requests for the selected filter.
            </td>
          </tr>
        ) : (
          filteredPendingRequests.map((item) => (
            <PendingApprovalTableRow
              key={`${item.request_group}-${item.isOffset ? "offset" : "leave"}-${item.id}`}
              item={item}
              isHRRole={isHRRole}
              canHrDirectDecision={canHrDirectDecision}
              isPendingApprovalStatus={isPendingApprovalStatus}
              openResignationDecisionConfirm={openResignationDecisionConfirm}
              openResignationReview={openResignationReview}
              openLeaveDecisionConfirm={openLeaveDecisionConfirm}
              openOffsetDecisionConfirm={openOffsetDecisionConfirm}
              setHrNoteConfirm={setHrNoteConfirm}
              setPendingModalOpen={setPendingModalOpen}
            />
          ))
        )}
      </tbody>
    </table>
  );
}
