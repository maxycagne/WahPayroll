import { useToast } from "@/hooks/useToast";
import { useMemo, useState } from "react";

export const useFormData = () => {
  const currentUser = useMemo(
    () => JSON.parse(localStorage.getItem("wah_user") || "{}"),
    [],
  );
  const [applicationModalOpen, setApplicationModalOpen] = useState(false);
  const [applicationType, setApplicationType] = useState("leave");
  const [myPendingModalOpen, setMyPendingModalOpen] = useState(false);
  const [pendingModalOpen, setPendingModalOpen] = useState(false);
  const [pendingTypeFilter, setPendingTypeFilter] = useState("all");
  const [formError, setFormError] = useState("");
  const [confirmAction, setConfirmAction] = useState(null);
  const [reviewConfirm, setReviewConfirm] = useState(null);
  const [cancelApprovalConfirm, setCancelApprovalConfirm] = useState(null);
  const [cancelPendingConfirm, setCancelPendingConfirm] = useState(null);
  const [hrNoteConfirm, setHrNoteConfirm] = useState(null);
  const [formData, setFormData] = useState({
    emp_id: currentUser?.emp_id || "",
    leaveType: "Birthday Leave",
    fromDate: "",
    toDate: "",
    daysApplied: "",
    reason: "",
    priority: "Low",
    OCP: undefined,
  });
  const [resignationForm, setResignationForm] = useState({
    // Multi-step wizard state
    resignationId: null,
    currentStep: 1,
    autosaveLoading: false,
    submitLoading: false,

    // Step 1: Resignation Letter
    resignationLetter: "",

    // Step 2: Details & Reasons
    resignationDate: "",
    lastWorkingDay: "",
    reasons: [],
    otherReason: "",

    // Step 3: Exit Interview (16 questions)
    exitInterviewAnswers: {
      q1: "",
      q2: "",
      q3: "",
      q4: "",
      q5: "",
      q6: "",
      q7: "",
      q8: "",
      q9: "",
      q10: "",
      q11: "",
      q12: "",
      q13: "",
      q14: "",
      q15: "",
      q16: "",
    },

    // Step 4: Endorsements
    endorsementFileKey: "",
    endorsementFileName: "",

    // Step 5: Status handling and clearance upload
    status: "Pending",
    clearanceFileKey: "",
    clearanceFileName: "",

    // Step 5: Review & Submit
    selectedSupervisor: null,
    recipientSupervisors: [],

    reason: "",
  });
  const { toast, showToast, clearToast } = useToast();

  const difference = useMemo(() => {
    const toDate = new Date(formData.toDate);
    const fromDate = new Date(formData.fromDate);
    const diffTime = toDate.getTime() - fromDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, [formData.fromDate, formData.toDate]);

  return {
    user: {
      currentUser: currentUser,
    },
    form: {
      data: formData,
      setData: setFormData,
      error: formError,
      setError: setFormError,
      resignation: resignationForm,
      setResignation: setResignationForm,
    },
    modals: {
      application: {
        isOpen: applicationModalOpen,
        setOpen: setApplicationModalOpen,
        type: applicationType,
        setType: setApplicationType,
      },
      myPending: {
        isOpen: myPendingModalOpen,
        setOpen: setMyPendingModalOpen,
      },
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
    },
    toast: {
      instance: toast,
      show: showToast,
      clear: clearToast,
    },
    computed: {
      dateDifference: difference,
    },
  };
};

// const clearFormData = () => {
//   setFormData({
//     emp_id: currentUser?.emp_id || "",
//     leaveType: "Birthday Leave",
//     fromDate: "",
//     toDate: "",
//     daysApplied: "",
//     reason: "",
//     priority: "Low",
//     OCP: undefined,
//   });
// };
// clearFormData,
