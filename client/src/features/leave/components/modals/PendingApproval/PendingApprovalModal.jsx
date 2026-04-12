import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import PendingApprovalFilterTabs from "./PendingApprovalFilterTabs";
import PendingApprovalModalHeader from "./PendingApprovalHeader";
import PendingApprovalTable from "./PendingApprovalTable";
import ResignationReviewModal from "../ResignationReview/ResignationReviewModal";
import axiosInterceptor from "@/hooks/interceptor";

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
  approveResignationMutation,
  reviewResignationMutation,
}) {
  const [resignationReviewOpen, setResignationReviewOpen] = useState(false);
  const [selectedResignation, setSelectedResignation] = useState(null);

  const { data: latestResignationData } = useQuery({
    queryKey: ["resignation-review-detail", selectedResignation?.id],
    enabled: Boolean(resignationReviewOpen && selectedResignation?.id),
    queryFn: async () => {
      const response = await axiosInterceptor.get(
        `/api/employees/resignations/${selectedResignation?.id}`,
      );
      return response?.data || selectedResignation;
    },
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  const handleApproveResignation = (resignation, clearanceStatus, remarks) => {
    approveResignationMutation.mutate({
      resignationId: resignation.id,
      clearanceStatus,
      remarks,
    });
    setResignationReviewOpen(false);
  };

  const handleKeepPendingResignation = (
    resignation,
    clearanceStatus,
    remarks,
  ) => {
    reviewResignationMutation.mutate({
      id: resignation.id,
      status: "Pending Approval",
      clearance_status: clearanceStatus || "pending",
      supervisor_remarks: remarks || "",
    });
    setResignationReviewOpen(false);
  };
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
                setResignationReviewOpen={setResignationReviewOpen}
                setSelectedResignation={setSelectedResignation}
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

      <ResignationReviewModal
        resignationReviewOpen={resignationReviewOpen}
        setResignationReviewOpen={setResignationReviewOpen}
        selectedResignation={latestResignationData || selectedResignation}
        onFinalApprove={handleApproveResignation}
        onKeepPending={handleKeepPendingResignation}
        isProcessing={
          approveResignationMutation?.isPending ||
          reviewResignationMutation?.isPending
        }
      />
    </>
  );
}
