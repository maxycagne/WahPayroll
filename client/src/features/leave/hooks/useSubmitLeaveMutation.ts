import axiosInterceptor from "@/hooks/interceptor";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const submitLeaveMutation = ({
  showToast,
  setApplicationModalOpen,
  setFormData,
  formData,
  setFormError,
}: SubmitLeaveMutation) => {
  const qr = useQueryClient();

  return useMutation({
    mutationFn: async (newLeave) => {
      const res = await axiosInterceptor.post("/api/employees/leaves", {
        newLeave,
      });
      if (res.status !== 200) {
        const errData = res.data;
        throw new Error(errData.message || "Failed to submit leave");
      }
      return res.data;
    },
    onSuccess: () => {
      qr.invalidateQueries({ queryKey: ["leaves"] });
      showToast("Leave application submitted successfully.");
      setApplicationModalOpen(false);
      setFormData({
        ...formData,
        fromDate: "",
        toDate: "",
        reason: "",
        daysApplied: "",
      });
    },
    onError: (err) => {
      setFormError(err.message);
      showToast(err.message || "Failed to submit leave application.", "error");
    },
  });
};
