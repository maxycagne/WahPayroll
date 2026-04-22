import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adjustLeaveBalance } from "../api";

export const useAdjustBalance = (showToast: any) => {
  const queryClient = useQueryClient();
  const [modalData, setModalData] = useState<any>(null);
  const [type, setType] = useState("Subtract");
  const [days, setDays] = useState("");

  const mutation = useMutation({
    mutationFn: ({ empId, amount }: { empId: string; amount: number }) => adjustLeaveBalance(empId, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      showToast("Leave balance updated.");
      setModalData(null);
      setDays("");
    },
    onError: () => showToast("Failed to adjust leave balance.", "error"),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalData) return;
    mutation.mutate({
      empId: modalData.emp_id,
      amount: type === "Subtract" ? -Math.abs(Number(days)) : Math.abs(Number(days)),
    });
  };

  return {
    modalData, setModalData,
    type, setType,
    days, setDays,
    onSubmit,
    isLoading: mutation.isPending
  };
};
