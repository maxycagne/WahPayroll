import { useCallback, useState } from "react";
import axiosInterceptor from "@/hooks/interceptor";
import { getDateDiffInclusive, getDateRangeInclusive } from "../utils/date";
import type {
  DashboardModal,
  LeaveDecisionStatus,
  LeaveRequestRow,
  QuickAction,
  QuickActionHost,
  ReviewConfirmState,
} from "../types/AdminDashboard";

export function useAdminDashboardActions() {
  const [activeModal, setActiveModal] = useState<DashboardModal | null>(null);
  const [approvedLeaves, setApprovedLeaves] = useState<Set<string | number>>(
    new Set(),
  );
  const [reviewConfirm, setReviewConfirm] = useState<ReviewConfirmState | null>(
    null,
  );
  const [quickActionHost, setQuickActionHost] =
    useState<QuickActionHost | null>(null);
  const [quickActionSeed, setQuickActionSeed] = useState(0);
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));

  const handleUpdateLeaveStatus = useCallback(
    async (id: string | number, payload: Record<string, unknown>) => {
      try {
        const res = await axiosInterceptor.put(`/api/employees/leaves/${id}`, {
          payload,
        });

        if (res.status <= 201) {
          setApprovedLeaves((prev) => new Set([...prev, id]));
        } else {
          alert("Failed to update leave request");
        }
      } catch (error) {
        console.error("Error updating leave:", error);
      }
    },
    [],
  );

  const closeModal = useCallback(() => {
    setActiveModal(null);
    setApprovedLeaves(new Set<string | number>());
  }, []);

  const openQuickAction = useCallback((action: QuickAction) => {
    setQuickActionSeed((prev) => prev + 1);

    if (action.action === "add-employee") {
      setQuickActionHost("employees");
      return;
    }

    if (action.action === "take-attendance") {
      setQuickActionHost("attendance");
      return;
    }

    if (action.action === "salary-settings") {
      setQuickActionHost("payroll");
    }
  }, []);

  const openLeaveDecisionConfirm = useCallback(
    (employee: LeaveRequestRow, status: LeaveDecisionStatus) => {
      const totalDays = getDateDiffInclusive(employee.date_from, employee.date_to);
      const requestedDates = getDateRangeInclusive(
        employee.date_from,
        employee.date_to,
      );

      setReviewConfirm({
        employee,
        status,
        totalDays,
        isMultiDay: totalDays > 1,
        selectedDates: status === "Approved" ? requestedDates : [],
        remarks: "",
      });
    },
    [],
  );

  const toggleApprovedDate = useCallback((date: string) => {
    setReviewConfirm((prev) => {
      if (!prev) return prev;
      const selected = new Set(prev.selectedDates || []);
      if (selected.has(date)) {
        selected.delete(date);
      } else {
        selected.add(date);
      }

      return {
        ...prev,
        selectedDates: Array.from(selected).sort(),
      };
    });
  }, []);

  const setReviewRemarks = useCallback((remarks: string) => {
    setReviewConfirm((prev) => (prev ? { ...prev, remarks } : prev));
  }, []);

  const submitLeaveDecision = useCallback(async () => {
    if (!reviewConfirm) return;

    const trimmedRemarks = String(reviewConfirm.remarks || "").trim();
    const isDenyDecision = reviewConfirm.status === "Denied";

    if (isDenyDecision && !trimmedRemarks) {
      alert("Reason is required for denial.");
      return;
    }

    if (reviewConfirm.status === "Denied") {
      await handleUpdateLeaveStatus(reviewConfirm.employee.id, {
        status: "Denied",
        supervisor_remarks: trimmedRemarks,
      });
      setReviewConfirm(null);
      return;
    }

    const requestedDates = getDateRangeInclusive(
      reviewConfirm.employee.date_from,
      reviewConfirm.employee.date_to,
    );
    const selectedDates = reviewConfirm.selectedDates || [];

    if (selectedDates.length === 0) {
      alert("Select at least one day to approve.");
      return;
    }

    const isPartial =
      reviewConfirm.isMultiDay && selectedDates.length < requestedDates.length;

    await handleUpdateLeaveStatus(reviewConfirm.employee.id, {
      status: isPartial ? "Partially Approved" : "Approved",
      approved_days: selectedDates.length,
      approved_dates: selectedDates,
      supervisor_remarks: undefined,
    });
    setReviewConfirm(null);
  }, [handleUpdateLeaveStatus, reviewConfirm]);

  return {
    activeModal,
    setActiveModal,
    approvedLeaves,
    reviewConfirm,
    setReviewConfirm,
    quickActionHost,
    quickActionSeed,
    period,
    setPeriod,
    closeModal,
    openQuickAction,
    openLeaveDecisionConfirm,
    toggleApprovedDate,
    setReviewRemarks,
    submitLeaveDecision,
  };
}
