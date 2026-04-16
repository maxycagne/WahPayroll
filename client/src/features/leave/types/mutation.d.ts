type useRequestMutation = {
  showToast: (message: any, type?: string, duration?: number) => void;
  setFormData: Dispatch<
    SetStateAction<{
      emp_id: any;
      leaveType: string;
      fromDate: string;
      toDate: string;
      daysApplied: string;
      reason: string;
      priority: string;
      OCP: undefined;
    }>
  >;
  setApplicationModalOpen: Dispatch<SetStateAction<boolean>>;
  formData?: {
    emp_id: any;
    leaveType: string;
    fromDate: string;
    toDate: string;
    daysApplied: string;
    reason: string;
    priority: string;
    OCP: undefined;
  };
};

type RequestGroup = "leave" | "offset" | "resignation";
