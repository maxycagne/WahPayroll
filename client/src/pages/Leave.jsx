import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Toast from "../components/Toast";
import {
  parseDateOnly,
  getDateDiffInclusive,
  calculateBusinessDays,
  calculateMandatedLeaveEndDate,
  getWorkingDateRangeInclusive,
  isNonWorkingDay,
  calculateTotalCredits,
} from "@/features/leave/utils/date.utils";
import { getOffsetRequestedDays } from "@/features/leave/utils/leave.utils";
import {
  leaveTypes,
  resignationTypes,
  leavePolicy,
  isMandatedLeave,
  leaveUploadFieldKeys,
} from "@/features/leave/leaveConstants";

import LeaveCalendar from "@/features/leave/components/LeaveCalendar";
import ActionButtons from "@/features/leave/components/ActionButtons";
import RequestHistoryTable from "@/features/leave/components/RequestHistoryTable";
import ModalsContainer from "@/features/leave/components/modals/ModalsContainer";
import { useFormData } from "@/features/leave/hooks/useFormData";
import { useRoleComputation } from "@/features/leave/hooks/useRoleComputation";
import { useComputedValues } from "@/features/leave/hooks/useLeaveComputedValues";
import {
  leavesQueryOptions,
  myAttendanceQueryOptions,
  offsetApplicationsQueryOptions,
  offsetBalanceQueryOptions,
  resignationQueryOptions,
  workweekConfigQueryOptions,
} from "@/features/leave/utils/query.utils";
import { useRequestMutation } from "@/features/leave/utils/mutation.utils";
import { useHandleSubmiisions } from "@/features/leave/hooks/useHandleSubmissions";

export default function Leave() {
  const [activeMonth, setActiveMonth] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth(),
  });
  const formDataState = useFormData();

  const {
    user: { currentUser },
    form: {
      data: formData,
      setData: setFormData,
      error: formError,
      setError: setFormError,
    },
    modals: {
      application: {
        isOpen: applicationModalOpen,
        setOpen: setApplicationModalOpen,
        type: applicationType,
        setType: setApplicationType,
      },
      myPending: { isOpen: myPendingModalOpen, setOpen: setMyPendingModalOpen },
      pending: {
        isOpen: pendingModalOpen,
        setOpen: setPendingModalOpen,
        typeFilter: pendingTypeFilter,
        setTypeFilter: setPendingTypeFilter,
      },
    },
    confirmations: {
      action: confirmAction,
      setAction: setConfirmAction,
      review: reviewConfirm,
      setReview: setReviewConfirm,
      cancelApproval: cancelApprovalConfirm,
      setCancelApproval: setCancelApprovalConfirm,
      cancelPending: cancelPendingConfirm,
      setCancelPending: setCancelPendingConfirm,
      hrNote: hrNoteConfirm,
      setHrNote: setHrNoteConfirm,
      uploadClearance: uploadClearanceItem,
      setUploadClearance: setUploadClearanceItem,
    },
    toast: { instance: toast, show: showToast, clear: clearToast },
    computed: { dateDifference: difference },
  } = formDataState;

  const roleComputationState = useRoleComputation(currentUser);
  const {
    roles: { isAdminRole, isHRRole, isSupervisorRole, isApprover },
    calendar: { calendarScope, setCalendarScope },
  } = roleComputationState;

  const normalizedEmploymentStatus = String(currentUser?.status || "")
    .trim()
    .toLowerCase();
  const isJobOrderEmployee = normalizedEmploymentStatus === "job order";

  const isPendingApprovalStatus = (status) => {
    const normalized = String(status || "")
      .trim()
      .toLowerCase();
    return normalized === "pending" || normalized === "pending approval";
  };

  const availableLeaveTypes = isJobOrderEmployee
    ? leaveTypes.filter((type) => type !== "PGT Leave")
    : leaveTypes;

  const clearLeaveUploadFields = (formState) => {
    const nextState = { ...formState };
    leaveUploadFieldKeys.forEach((fieldKey) => {
      nextState[fieldKey] = undefined;
    });
    return nextState;
  };

  const { data: leaves = [], isLoading: isLoadingLeaves } =
    useQuery(leavesQueryOptions);

  const { data: myAttendance = [] } = useQuery(
    myAttendanceQueryOptions(currentUser?.emp_id || ""),
  );

  const { data: offsetApplications = [], isLoading: isLoadingOffsets } =
    useQuery(offsetApplicationsQueryOptions);

  const { data: myResignations = [], isLoading: isLoadingResignations } =
    useQuery(resignationQueryOptions);
  const { data: workweekConfigs = [] } = useQuery(workweekConfigQueryOptions);

  const {
    user: {
      requests: {
        rows: myRequestRows,
        history: myRequestHistory,
        allHistory: allRequestHistory,
      },
    },
    calendar: { options: calendarScopeOptions, filtered: calendarLeaves },
    approvals: {
      pending: {
        leaves: pendingLeaveApprovals,
        offsets: pendingOffsetApprovals,
        resignations: pendingResignationApprovals,
      },
      all: allPendingRequests,
      filtered: filteredPendingRequests,
      total: totalPendingCount,
    },
  } = useComputedValues({
    leaves,
    offsetApplications,
    myResignations,
    isAdminRole,
    isHRRole,
    isSupervisorRole,
    isApprover,
    calendarScope,
    pendingTypeFilter,
    currentUser,
  });

  const sourceHistory = isAdminRole ? allRequestHistory : myRequestHistory;

  const filteredHistory = useMemo(() => {
    return sourceHistory.filter((entry) => {
      if (!entry.filter_date) return false;
      const d = new Date(entry.filter_date);
      return (
        d.getFullYear() === activeMonth.year &&
        d.getMonth() === activeMonth.month
      );
    });
  }, [sourceHistory, activeMonth]);

  const {
    submitLeaveMutation,
    fileOffsetMutation,
    fileResignationMutation,
    reviewLeaveMutation,
    reviewOffsetMutation,
    cancelMyPendingRequestMutation,
    requestCancellationApprovalMutation,
    addHrNoteMutation,
    reviewResignationMutation,
  } = useRequestMutation({
    showToast,
    setApplicationModalOpen,
    setFormData,
    formData,
  });

  const canHrDirectDecision = (item) => {
    const roleValue = String(item?.requester_role || "")
      .trim()
      .toLowerCase();
    return roleValue === "supervisor";
  };

  const { handleSubmitLeave } = useHandleSubmiisions({
    formData,
    setFormError,
    setConfirmAction,
  });

  const handleLeaveTypeChange = (e) => {
    const newLeaveType = e.target.value;

    const newToDate = (() => {
      if (!formData.fromDate) return "";

      if (newLeaveType === "Birthday Leave") {
        return formData.fromDate;
      }

      if (isMandatedLeave(newLeaveType)) {
        const policy = leavePolicy[newLeaveType];
        const excludeWeekends = policy?.excludeWeekendsInDuration !== false;
        return calculateMandatedLeaveEndDate(
          formData.fromDate,
          policy?.maxDays || 7,
          excludeWeekends,
        );
      }

      return "";
    })();

    setFormData({
      ...clearLeaveUploadFields(formData),
      leaveType: newLeaveType,
      toDate: newToDate,
      daysApplied: "",
    });
    setFormError("");
  };

  const submitCancellationRequest = (item, cancellationReason) => {
    const trimmedReason = String(cancellationReason || "").trim();
    if (!trimmedReason) {
      showToast("Cancellation reason is required.", "error");
      return;
    }

    requestCancellationApprovalMutation.mutate({
      item,
      cancellationReason: trimmedReason,
    });
  };

  const handleFromDateChange = (e) => {
    const newFromDate = e.target.value;

    if (
      newFromDate &&
      formData.leaveType !== "Offset" &&
      isNonWorkingDay(newFromDate, workweekConfigs)
    ) {
      setFormError("Cannot file a leave on a non-working day.");
      return;
    }

    const newToDate = (() => {
      if (formData.leaveType === "Birthday Leave") {
        return newFromDate;
      }

      if (isMandatedLeave(formData.leaveType)) {
        const policy = leavePolicy[formData.leaveType];
        const excludeWeekends = policy?.excludeWeekendsInDuration !== false;
        return calculateMandatedLeaveEndDate(
          newFromDate,
          policy?.maxDays || 7,
          excludeWeekends,
        );
      }

      return "";
    })();

    // Also validate if the newToDate is non-working, but birthday leave is already on the fromDate
    setFormData({ ...formData, fromDate: newFromDate, toDate: newToDate });
    setFormError("");
  };

  const handleToDateChange = (e) => {
    const toDate = e.target.value;
    if (isMandatedLeave(formData.leaveType)) {
      return;
    }

    if (!toDate) {
      setFormData({ ...formData, toDate: "" });
      setFormError("");
      return;
    }

    if (formData.leaveType !== "Offset") {
      if (isNonWorkingDay(toDate, workweekConfigs)) {
        setFormError("Cannot file a leave ending on a non-working day.");
        return;
      }

      const policy = leavePolicy[formData.leaveType];
      if (formData.fromDate && toDate && policy) {
        const businessDays = calculateBusinessDays(
          new Date(formData.fromDate),
          new Date(toDate),
          workweekConfigs,
        );
        if (businessDays > policy.maxDays) {
          setFormError(
            `Maximum ${policy.maxDays} business day(s) allowed for ${formData.leaveType}`,
          );
          return;
        }
      }
    }
    setFormData({ ...formData, toDate });
    setFormError("");
  };

  const getMaxToDate = () => {
    if (!formData.fromDate || formData.leaveType === "Offset") return "";
    const policy = leavePolicy[formData.leaveType];

    if (isMandatedLeave(formData.leaveType)) {
      const excludeWeekends = policy?.excludeWeekendsInDuration !== false;
      return calculateMandatedLeaveEndDate(
        formData.fromDate,
        policy?.maxDays || 7,
        excludeWeekends,
      );
    }

    const startDate = new Date(formData.fromDate);
    let daysAdded = 0;
    const maxDays = policy.maxDays;
    while (daysAdded < maxDays) {
      startDate.setDate(startDate.getDate() + 1);
      if (!isNonWorkingDay(startDate, workweekConfigs)) daysAdded++;
    }
    return startDate.toISOString().split("T")[0];
  };

  const openLeaveDecisionConfirm = (
    item,
    status,
    decisionMode = "application",
  ) => {
    const requestedDates = getWorkingDateRangeInclusive(
      item.date_from,
      item.date_to,
      workweekConfigs,
    );
    const totalDays = requestedDates.length;
    const isMultiDay = totalDays > 1;

    setReviewConfirm({
      module: "leave",
      status,
      decisionMode,
      item,
      isMultiDay,
      totalDays,
      selectedDates: requestedDates,
      remarks: "",
    });
  };

  const openOffsetDecisionConfirm = (
    item,
    status,
    decisionMode = "application",
  ) => {
    const totalDays = getOffsetRequestedDays(item);
    const isMultiDay = totalDays > 1;

    setReviewConfirm({
      module: "offset",
      status,
      decisionMode,
      item,
      isMultiDay,
      isPartial: false,
      approvedDays: totalDays,
      remarks: "",
    });
  };

  const openResignationDecisionConfirm = (
    item,
    status,
    decisionMode = "application",
  ) => {
    setReviewConfirm({
      module: "resignation",
      status,
      decisionMode,
      item,
      remarks: "",
    });
  };

  const toggleLeaveApprovedDate = (date) => {
    if (!reviewConfirm || reviewConfirm.module !== "leave") return;
    const selected = new Set(reviewConfirm.selectedDates || []);
    if (selected.has(date)) selected.delete(date);
    else selected.add(date);
    setReviewConfirm({
      ...reviewConfirm,
      selectedDates: Array.from(selected).sort(),
    });
  };

  const submitReviewDecision = () => {
    if (!reviewConfirm) return;

    if (!reviewConfirm.status) {
      showToast("Select Approve or Deny after reviewing the request.", "error");
      return;
    }

    const trimmedRemarks = String(reviewConfirm.remarks || "").trim();
    const isDenyDecision = reviewConfirm.status === "Denied";

    if (isDenyDecision && !trimmedRemarks) {
      showToast("Reason is required for denial.", "error");
      return;
    }

    if (reviewConfirm.module === "leave") {
      console.log("leave");
      if (reviewConfirm.decisionMode === "cancellation") {
        reviewLeaveMutation.mutate({
          id: reviewConfirm.item.id,
          item: reviewConfirm.item,
          status: reviewConfirm.status,
          decision_mode: "cancellation",
          supervisor_remarks: isDenyDecision ? trimmedRemarks : undefined,
        });
        setReviewConfirm(null);
        return;
      }

      const requestedDates = getWorkingDateRangeInclusive(
        reviewConfirm.item.date_from,
        reviewConfirm.item.date_to,
        workweekConfigs,
      );
      const selectedDates = reviewConfirm.selectedDates || [];

      if (
        reviewConfirm.status === "Approved" &&
        reviewConfirm.isMultiDay &&
        selectedDates.length === 0
      ) {
        showToast("Select at least one day to approve.", "error");
        return;
      }

      const isPartialApproval =
        reviewConfirm.status === "Approved" &&
        reviewConfirm.isMultiDay &&
        selectedDates.length < requestedDates.length;

      const payload = {
        id: reviewConfirm.item.id,
        item: reviewConfirm.item,
        status:
          reviewConfirm.status === "Denied"
            ? "Denied"
            : isPartialApproval
              ? "Partially Approved"
              : "Approved",
      };

      if (isPartialApproval) {
        payload.approved_days = selectedDates.length;
        payload.approved_dates = selectedDates;
      }

      if (isDenyDecision) {
        payload.supervisor_remarks = trimmedRemarks;
      }

      reviewLeaveMutation.mutate(payload);
      setReviewConfirm(null);
      return;
    }

    if (reviewConfirm.module === "offset") {
      if (reviewConfirm.decisionMode === "cancellation") {
        reviewOffsetMutation.mutate({
          id: reviewConfirm.item.id,
          item: reviewConfirm.item,
          status: reviewConfirm.status,
          decision_mode: "cancellation",
          supervisor_remarks: isDenyDecision ? trimmedRemarks : undefined,
        });
        setReviewConfirm(null);
        return;
      }

      if (reviewConfirm.status === "Approved") {
        const approvedDays = Number(reviewConfirm.approvedDays || 0);
        const totalDays = getOffsetRequestedDays(reviewConfirm.item);

        if (!approvedDays || approvedDays <= 0 || approvedDays > totalDays) {
          showToast(
            "Approved days must be between 0 and requested days.",
            "error",
          );
          return;
        }

        const isPartial = approvedDays < totalDays;

        const payload = {
          id: reviewConfirm.item.id,
          item: reviewConfirm.item,
          status: isPartial ? "Partially Approved" : "Approved",
        };

        if (isPartial) {
          payload.approved_days = approvedDays;
        }

        reviewOffsetMutation.mutate(payload);
      } else {
        reviewOffsetMutation.mutate({
          id: reviewConfirm.item.id,
          item: reviewConfirm.item,
          status: "Denied",
          supervisor_remarks: trimmedRemarks,
        });
      }
      setReviewConfirm(null);
      return;
    }

    if (reviewConfirm.module === "resignation") {
      reviewResignationMutation.mutate({
        id: reviewConfirm.item.id,
        item: reviewConfirm.item,
        status: reviewConfirm.status === "Denied" ? "Rejected" : "Approved",
        review_remarks: isDenyDecision ? trimmedRemarks : undefined,
        decision_mode:
          reviewConfirm.decisionMode === "cancellation"
            ? "cancellation"
            : undefined,
      });
      setReviewConfirm(null);
    }
  };

  const totalCredits = useMemo(() => {
    if (!formData.fromDate || !formData.toDate) return 0;
    return calculateTotalCredits(
      formData.fromDate,
      formData.toDate,
      workweekConfigs,
    );
  }, [formData.fromDate, formData.toDate, workweekConfigs]);

  if (isLoadingLeaves || isLoadingOffsets || isLoadingResignations) {
    return (
      <div className="p-6 font-bold text-gray-800 dark:text-gray-200">
        Loading your data...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <ActionButtons
        currentUser={currentUser}
        isAdminRole={isAdminRole}
        isApprover={isApprover}
        myRequestRows={myRequestRows}
        totalPendingCount={totalPendingCount}
        onFileNewApplication={() => {
          setApplicationType("leave");
          setApplicationModalOpen(true);
        }}
        onShowMyPending={() => setMyPendingModalOpen(true)}
        onShowPendingApproval={() => setPendingModalOpen(true)}
      />

      <LeaveCalendar
        leaves={calendarLeaves}
        attendance={isAdminRole ? [] : myAttendance}
        scopeOptions={calendarScopeOptions}
        activeScope={calendarScope}
        onScopeChange={setCalendarScope}
        onMonthChange={setActiveMonth}
        workweekConfigs={workweekConfigs}
      />

      <div className="mt-5">
        <RequestHistoryTable
          myRequestHistory={filteredHistory}
          activeMonth={activeMonth}
        />
      </div>

      <ModalsContainer
        applicationModalOpen={applicationModalOpen}
        currentUser={currentUser}
        setApplicationModalOpen={setApplicationModalOpen}
        applicationType={applicationType}
        setApplicationType={setApplicationType}
        formError={formError}
        handleFromDateChange={handleFromDateChange}
        handleLeaveTypeChange={handleLeaveTypeChange}
        handleToDateChange={handleToDateChange}
        getMaxToDate={getMaxToDate}
        formData={formData}
        setFormData={setFormData}
        availableLeaveTypes={availableLeaveTypes}
        difference={difference}
        totalCredits={totalCredits}
        handleSubmitLeave={handleSubmitLeave}
        resignationTypes={resignationTypes}
        fileResignationMutation={fileResignationMutation}
        pendingModalOpen={pendingModalOpen}
        isApprover={isApprover}
        setPendingModalOpen={setPendingModalOpen}
        pendingTypeFilter={pendingTypeFilter}
        setPendingTypeFilter={setPendingTypeFilter}
        allPendingRequests={allPendingRequests}
        pendingLeaveApprovals={pendingLeaveApprovals}
        pendingOffsetApprovals={pendingOffsetApprovals}
        pendingResignationApprovals={pendingResignationApprovals}
        filteredPendingRequests={filteredPendingRequests}
        isHRRole={isHRRole}
        canHrDirectDecision={canHrDirectDecision}
        isPendingApprovalStatus={isPendingApprovalStatus}
        openResignationDecisionConfirm={openResignationDecisionConfirm}
        openLeaveDecisionConfirm={openLeaveDecisionConfirm}
        openOffsetDecisionConfirm={openOffsetDecisionConfirm}
        setHrNoteConfirm={setHrNoteConfirm}
        myPendingModalOpen={myPendingModalOpen}
        setMyPendingModalOpen={setMyPendingModalOpen}
        myRequestRows={myRequestRows}
        cancelMyPendingRequestMutation={cancelMyPendingRequestMutation}
        setCancelPendingConfirm={setCancelPendingConfirm}
        requestCancellationApprovalMutation={
          requestCancellationApprovalMutation
        }
        setCancelApprovalConfirm={setCancelApprovalConfirm}
        confirmAction={confirmAction}
        setConfirmAction={setConfirmAction}
        fileOffsetMutation={fileOffsetMutation}
        submitLeaveMutation={submitLeaveMutation}
        reviewConfirm={reviewConfirm}
        setReviewConfirm={setReviewConfirm}
        getDateRangeInclusive={getWorkingDateRangeInclusive}
        toggleLeaveApprovedDate={toggleLeaveApprovedDate}
        parseDateOnly={parseDateOnly}
        getOffsetRequestedDays={getOffsetRequestedDays}
        submitReviewDecision={submitReviewDecision}
        cancelApprovalConfirm={cancelApprovalConfirm}
        cancelPendingConfirm={cancelPendingConfirm}
        hrNoteConfirm={hrNoteConfirm}
        addHrNoteMutation={addHrNoteMutation}
        reviewResignationMutation={reviewResignationMutation}
        showToast={showToast}
        submitCancellationRequest={submitCancellationRequest}
        workweekConfigs={workweekConfigs}
        uploadClearanceItem={uploadClearanceItem}
        setUploadClearanceItem={setUploadClearanceItem}
      />

      <Toast toast={toast} onClose={clearToast} />
    </div>
  );
}
