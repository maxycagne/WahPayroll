import axiosInterceptor from "@/hooks/interceptor";
import {
  createMutation,
  mutationHandler,
} from "../hooks/createMutationHandler";
import { useEmailNotifications } from "../hooks/useEmailNotifications ";

//T

export const useRequestMutation = ({
  showToast,
  setApplicationModalOpen,
  setResignationForm,
  setFormData,
  formData,
}: useRequestMutation) => {
  const endpoints = {
    leave: "/api/employees/leaves",
    offset: "/api/employees/offset-applications",
    resignation: "/api/employees/resignations",
  };

  const handleSendUpdate = useEmailNotifications();
  const ALL_KEYS = ["leaves", "offset-applications", "resignations"];

  const currentUser = JSON.parse(localStorage.getItem("wah_user") || "{}");

  const resetLeaveForm = () => {
    setFormData({
      ...formData,
      fromDate: "",
      toDate: "",
      reason: "",
      daysApplied: "",
      OCP: undefined,
    });
  };

  // 1
  const submitLeaveMutation = createMutation({
    mutationFn: (newLeave: any) => {
      const toFormData = new FormData();

      Object.entries(newLeave).forEach(([key, value]) => {
        // check if file
        if (value instanceof File) {
          toFormData.append(key, value);
        } else if (value !== undefined && value !== null) {
          toFormData.append(key, String(value));
        }
      });

      return mutationHandler(
        axiosInterceptor.post("/api/leaves/", toFormData),
        "Failed to submit leave",
      );
    },
    successMsg: "Leave application submitted successfully",
    showToast,
    invalidateKeys: ["leaves"],
    successExtra: () => {
      setApplicationModalOpen(false);
      resetLeaveForm();
    },
  });

  // 2
  const fileOffsetMutation = createMutation({
    mutationFn: (offsetData: any) => {
      console.log(offsetData);
      return mutationHandler(
        axiosInterceptor.post("/api/employees/offset-applications", {
          emp_id: currentUser?.emp_id,
          ...offsetData,
        }),
        "Failed to file offset",
      );
    },
    successMsg: "Offset application filed successfully",
    showToast,
    invalidateKeys: ["offset-applications"],
    successExtra: () => {
      setApplicationModalOpen(false);
      resetLeaveForm();
    },
  });

  // 3
  const fileResignationMutation = createMutation({
    mutationFn: (resignationData: any) =>
      mutationHandler(
        axiosInterceptor.post("/api/employees/resignations", {
          emp_id: currentUser?.emp_id,
          ...resignationData,
        }),
        "Failed to file resignation",
      ),
    successMsg: "Resignation filed successfully",
    showToast,
    invalidateKeys: ["resignations"],
    successExtra: () => {
      setResignationForm({
        resignationId: null,
        currentStep: 1,
        autosaveLoading: false,
        submitLoading: false,
        resignationLetter: "",
        resignationDate: "",
        lastWorkingDay: "",
        reasons: [],
        otherReason: "",
        exitInterviewAnswers: {
          q1: "", q2: "", q3: "", q4: "", q5: "", q6: "", q7: "", q8: "",
          q9: "", q10: "", q11: "", q12: "", q13: "", q14: "", q15: "", q16: "",
        },
        endorsementFileKey: "",
        endorsementFileName: "",
        status: "Pending",
        clearanceFileKey: "",
        clearanceFileName: "",
        selectedSupervisor: null,
        recipientSupervisors: [],
        reason: "",
      });
      setApplicationModalOpen(false);
    },
  });

  // 4
  const reviewLeaveMutation = createMutation({
    mutationFn: ({ id, ...payload }: any) =>
      mutationHandler(
        axiosInterceptor.put(`/api/employees/leaves/${id}`, payload),
        "Failed to update leave request",
      ),
    successMsg: "Leave request updated successfully.",
    showToast,
    invalidateKeys: ["leaves"],
    callback: async (data, variables) => {
      console.log("hit!!!!");
      await handleSendUpdate(
        variables.item,
        variables.status,
        variables.supervisor_remarks,
      );
    },
  });

  // 5
  const reviewOffsetMutation = createMutation({
    mutationFn: ({ id, ...payload }: any) =>
      mutationHandler(
        axiosInterceptor.put(
          `/api/employees/offset-applications/${id}`,
          payload,
        ),
        "Failed to update offset request",
      ),
    successMsg: "Offset request updated successfully.",
    showToast,
    invalidateKeys: ["offset-applications"],
  });
  // 6
  const reviewResignationMutation = createMutation({
    mutationFn: ({ id, ...payload }: any) =>
      mutationHandler(
        axiosInterceptor.put(`/api/employees/resignations/${id}`, payload),
        "Failed to update resignation",
      ),
    successMsg: "Resignation request updated successfully.",
    showToast,
    invalidateKeys: ["resignations"],
  });

  // 7
  const cancelMyPendingRequestMutation = createMutation<
    any,
    {
      request_group: RequestGroup;
      id: number;
    }
  >({
    mutationFn: (item) => {
      const base = endpoints[item.request_group];
      if (!base) throw new Error("Unsupported request type");

      return mutationHandler(
        axiosInterceptor.delete(`${base}/${item.id}/cancel`),
        "Failed to cancel request",
      );
    },
    successMsg: "Pending request cancelled successfully.",
    showToast,
    invalidateKeys: ALL_KEYS,
  });

  // 8
  const requestCancellationApprovalMutation = createMutation<
    any,
    {
      item: {
        request_group: RequestGroup;
        id: number;
      };
      cancellationReason: string;
    }
  >({
    mutationFn: ({ item, cancellationReason }) => {
      const base = endpoints[item.request_group];
      if (!base) throw new Error("Unsupported request type");

      return mutationHandler(
        axiosInterceptor.post(`${base}/${item.id}/request-cancel`, {
          cancellation_reason: cancellationReason,
        }),
        "Failed to request cancellation approval",
      );
    },
    successMsg: "Cancellation request submitted for approval.",
    showToast,
    invalidateKeys: ALL_KEYS,
  });

  // 9
  const addHrNoteMutation = createMutation<
    any,
    {
      module: number;
      id: number;
      note: string;
    }
  >({
    mutationFn: ({ module, id, note }) =>
      mutationHandler(
        axiosInterceptor.post(
          `/api/employees/pending-requests/${module}/${id}/hr-note`,
          {
            hr_note: note,
          },
        ),
        "Failed to save HR note",
      ),
    successMsg: "HR note saved and supervisors notified.",
    showToast,
    invalidateKeys: ALL_KEYS,
  });

  // 10 - Multi-step Resignation Autosave
  const autosaveResignationDraftMutation = createMutation({
    mutationFn: ({ resignationId, step, data }: any) =>
      mutationHandler(
        axiosInterceptor.patch(
          `/api/employees/resignations/${resignationId}/draft`,
          {
            step,
            ...data,
            emp_id: currentUser?.emp_id,
          },
        ),
        "Failed to save resignation draft",
      ),
    successMsg: "Resignation draft saved",
    showToast,
    invalidateKeys: ["resignations"],
  });

  // 11 - Multi-step Resignation Final Submit
  const submitResignationApplicationMutation = createMutation({
    mutationFn: (resignationData: any) => {
      const { resignationId, ...submitData } = resignationData;

      const mappedPayload = {
        ...submitData,
        selectedSupervisorEmpId:
          submitData?.selectedSupervisor?.emp_id ||
          submitData?.assigned_supervisor?.emp_id ||
          null,
        effective_date:
          submitData?.effective_date ||
          submitData?.lastWorkingDay ||
          submitData?.resignationDate ||
          null,
        reason:
          submitData?.reason ||
          submitData?.otherReason ||
          "Resignation submitted via multi-step form",
      };

      // If resignationId exists, use PUT submit endpoint, otherwise use POST to create
      if (resignationId) {
        return mutationHandler(
          axiosInterceptor.put(
            `/api/employees/resignations/${resignationId}/submit`,
            {
              ...mappedPayload,
              emp_id: currentUser?.emp_id,
            },
          ),
          "Failed to submit resignation",
        );
      } else {
        // Fallback to original POST endpoint for backward compatibility
        return mutationHandler(
          axiosInterceptor.post("/api/employees/resignations", {
            emp_id: currentUser?.emp_id,
            ...mappedPayload,
          }),
          "Failed to submit resignation",
        );
      }
    },
    successMsg: "Resignation submitted successfully",
    showToast,
    invalidateKeys: ["resignations"],
    successExtra: () => {
      // Reset form state
      setResignationForm({
        resignationId: null,
        currentStep: 1,
        autosaveLoading: false,
        submitLoading: false,
        resignationLetter: "",
        resignationDate: "",
        lastWorkingDay: "",
        reasons: [],
        otherReason: "",
        exitInterviewAnswers: {
          q1: "", q2: "", q3: "", q4: "", q5: "", q6: "", q7: "", q8: "",
          q9: "", q10: "", q11: "", q12: "", q13: "", q14: "", q15: "", q16: "",
        },
        endorsementFileKey: "",
        endorsementFileName: "",
        status: "Pending",
        clearanceFileKey: "",
        clearanceFileName: "",
        selectedSupervisor: null,
        recipientSupervisors: [],
        reason: "",
      });
      setApplicationModalOpen(false);
    },
  });

  // 12 - Update Clearance Status (Supervisor)
  const updateResignationClearanceStatusMutation = createMutation({
    mutationFn: ({ resignationId, clearanceStatus, remarks }: any) =>
      mutationHandler(
        axiosInterceptor.patch(
          `/api/employees/resignations/${resignationId}/clearance`,
          {
            clearance_status: clearanceStatus,
            supervisor_remarks: remarks,
          },
        ),
        "Failed to update clearance status",
      ),
    successMsg: "Clearance status updated",
    showToast,
    invalidateKeys: ["resignations"],
  });

  // 13 - Approve Resignation (Supervisor)
  const approveResignationMutation = createMutation({
    mutationFn: ({ resignationId, clearanceStatus, remarks }: any) =>
      mutationHandler(
        axiosInterceptor.put(
          `/api/employees/resignations/${resignationId}/approve`,
          {
            status: "Approved",
            clearance_status: clearanceStatus,
            supervisor_remarks: remarks,
          },
        ),
        "Failed to approve resignation",
      ),
    successMsg: "Resignation approved successfully",
    showToast,
    invalidateKeys: ["resignations"],
  });

  // 14 - Reject Resignation (Supervisor)
  const rejectResignationMutation = createMutation({
    mutationFn: ({ resignationId, clearanceStatus, remarks }: any) =>
      mutationHandler(
        axiosInterceptor.put(
          `/api/employees/resignations/${resignationId}/reject`,
          {
            status: "Rejected",
            clearance_status: clearanceStatus,
            supervisor_remarks: remarks,
          },
        ),
        "Failed to reject resignation",
      ),
    successMsg: "Resignation rejected",
    showToast,
    invalidateKeys: ["resignations"],
  });

  return {
    fileResignationMutation,
    fileOffsetMutation,
    reviewLeaveMutation,
    reviewResignationMutation,
    submitLeaveMutation,
    reviewOffsetMutation,
    cancelMyPendingRequestMutation,
    requestCancellationApprovalMutation,
    addHrNoteMutation,
    autosaveResignationDraftMutation,
    submitResignationApplicationMutation,
    updateResignationClearanceStatusMutation,
    approveResignationMutation,
    rejectResignationMutation,
  };
};
