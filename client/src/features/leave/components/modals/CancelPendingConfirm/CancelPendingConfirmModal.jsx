import CancelPendingConfirmModalContent from "./CancelPendingConfirmModalContent";
import CancelPendingConfirmModalFooter from "./CancelPendingConfirmModalFooter";
import CancelPendingConfirmModalHeader from "./CancelPendingConfirmModalHeader";

export default function CancelPendingConfirmModal({
  cancelPendingConfirm,
  setCancelPendingConfirm,
  cancelMyPendingRequestMutation,
}) {
  return (
    <>
      {cancelPendingConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-md rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl">
            <CancelPendingConfirmModalHeader />
            <CancelPendingConfirmModalContent />
            <CancelPendingConfirmModalFooter
              cancelPendingConfirm={cancelPendingConfirm}
              setCancelPendingConfirm={setCancelPendingConfirm}
              cancelMyPendingRequestMutation={cancelMyPendingRequestMutation}
            />
          </div>
        </div>
      )}
    </>
  );
}
