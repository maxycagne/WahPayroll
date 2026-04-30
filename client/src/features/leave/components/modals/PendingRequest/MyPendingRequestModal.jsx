import MyPendingRequestsModalHeader from "./MyPendingRequestsModalHeader";
import MyPendingRequestsTable from "./MyPendingRequestsTable";

export default function MyPendingRequestsModal({
  myPendingModalOpen,
  setMyPendingModalOpen,
  myRequestRows,
  cancelMyPendingRequestMutation,
  setCancelPendingConfirm,
  requestCancellationApprovalMutation,
  setCancelApprovalConfirm,
  setUploadClearanceItem,
  }) {
  return (
    <>
      {myPendingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-2xl">
            <MyPendingRequestsModalHeader
              onClose={() => setMyPendingModalOpen(false)}
            />

            <div className="min-h-0 flex-1 overflow-auto p-4 sm:p-6">
              <MyPendingRequestsTable
                myRequestRows={myRequestRows}
                cancelMyPendingRequestMutation={cancelMyPendingRequestMutation}
                setCancelPendingConfirm={setCancelPendingConfirm}
                requestCancellationApprovalMutation={
                  requestCancellationApprovalMutation
                }
                setCancelApprovalConfirm={setCancelApprovalConfirm}
                setUploadClearanceItem={setUploadClearanceItem}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
