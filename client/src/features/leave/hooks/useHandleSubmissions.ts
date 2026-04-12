import { handleSubmitLeave as handleSubmitLeaveUtil } from "../utils/handleSubmitLeave";

// Backward-compatible adapter for branch variants using different hook names/signatures.
export const useHandleSubmissions = ({
  formData,
  setFormError,
  setConfirmAction,
}) => {
  const handleSubmitLeave = (e) =>
    handleSubmitLeaveUtil({
      e,
      formData,
      setFormError,
      setConfirmAction,
    });

  return { handleSubmitLeave };
};

// Typo-safe alias used in some branches.
export const useHandleSubmiisions = useHandleSubmissions;
