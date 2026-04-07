import PendingApprovalFilterTabs from "./PendingApprovalFilterTabs";
import PendingApprovalModalHeader from "./PendingApprovalHeader";
import PendingApprovalTable from "./PendingApprovalTable";

export default function PendingApprovalModal({
  pendingModalOpen,
  isApprover,
  setPendingModalOpen,
  pendingTypeFilter,
  setPendingTypeFilter,
  allPendingRequests,
  pendingLeaveApprovals,
  pendingOffsetApprovals,
  pendingResignationApprovals,
  filteredPendingRequests,
  isHRRole,
  canHrDirectDecision,
  isPendingApprovalStatus,
  openResignationDecisionConfirm,
  openLeaveDecisionConfirm,
  openOffsetDecisionConfirm,
  setHrNoteConfirm,
}) {
  return (
    <>
      {pendingModalOpen && isApprover && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-5xl overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
            <PendingApprovalModalHeader
              setPendingModalOpen={setPendingModalOpen}
            />
            <div className="max-h-[72vh] overflow-auto">
              <PendingApprovalFilterTabs
                pendingTypeFilter={pendingTypeFilter}
                setPendingTypeFilter={setPendingTypeFilter}
                allPendingRequests={allPendingRequests}
                pendingLeaveApprovals={pendingLeaveApprovals}
                pendingOffsetApprovals={pendingOffsetApprovals}
                pendingResignationApprovals={pendingResignationApprovals}
              />
              <PendingApprovalTable
                filteredPendingRequests={filteredPendingRequests}
                isHRRole={isHRRole}
                canHrDirectDecision={canHrDirectDecision}
                isPendingApprovalStatus={isPendingApprovalStatus}
                openResignationDecisionConfirm={openResignationDecisionConfirm}
                openLeaveDecisionConfirm={openLeaveDecisionConfirm}
                openOffsetDecisionConfirm={openOffsetDecisionConfirm}
                setHrNoteConfirm={setHrNoteConfirm}
                setPendingModalOpen={setPendingModalOpen}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
