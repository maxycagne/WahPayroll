import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AttendanceRecord } from "../types/Attendance";
import { adjustLeaveBalanceMutationOptions } from "../utils/mutationOptions";
import { useToast } from "@/hooks/useToast";

interface AdjustBalanceModalProps {
  adjModal: AttendanceRecord;
  onClose: () => void;
}

export const AdjustBalanceModal: React.FC<AdjustBalanceModalProps> = ({
  adjModal,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [adjType, setAdjType] = useState("Subtract");
  const [adjDays, setAdjDays] = useState("");

  const adjustMutation = useMutation({
    ...adjustLeaveBalanceMutationOptions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      showToast("Leave balance updated.");
      onClose();
    },
    onError: () => showToast("Failed to adjust leave balance.", "error"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    adjustMutation.mutate({
      empId: adjModal.emp_id,
      amount: adjType === "Subtract" ? -Math.abs(Number(adjDays)) : Math.abs(Number(adjDays)),
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 px-6 py-4 flex justify-between items-center text-white">
          <h2 className="text-lg font-bold m-0">Adjust Leave Balance</h2>
          <button
            onClick={onClose}
            className="text-white text-2xl border-0 bg-transparent cursor-pointer"
          >
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex flex-col gap-4">
            <select
              value={adjType}
              onChange={(e) => setAdjType(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="Subtract">Subtract Days (Minus)</option>
              <option value="Add">Add Days (Plus)</option>
            </select>
            <input
              type="number"
              min="0.5"
              step="0.5"
              required
              value={adjDays}
              onChange={(e) => setAdjDays(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Number of days"
            />
            <button
              type="submit"
              disabled={adjustMutation.isPending}
              className="w-full py-2 bg-purple-700 text-white rounded-lg font-bold border-0 cursor-pointer hover:bg-purple-800"
            >
              {adjustMutation.isPending ? "Saving..." : "Save Adjustment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
