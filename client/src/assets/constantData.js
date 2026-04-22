export const STANDARD_DOCUMENTS = [
  "Resume / CV",
  "NBI Clearance",
  "Medical Certificate",
  "SSS E-1 Form / ID",
  "PhilHealth ID / MDR",
  "Pag-IBIG MID No.",
  "TIN / BIR Form 1902",
  "Transcript of Records (TOR)",
  "Diploma",
  "Birth Certificate (PSA)",
  "Marriage Certificate",
  "Certificate of Employment (COE)",
];

export const HR_DASHBOARD_QUICK_ACCESS = [
  {
    icon: "👥",
    label: "View Employees",
    sub: "Manage employee records",
    path: "/employees",
    color: "purple",
  },
  {
    icon: "📋",
    label: "Attendance",
    sub: "View & manage attendance",
    path: "/attendance",
    color: "green",
  },
  {
    icon: "📅",
    label: "Leave Requests",
    sub: "Process employee leave",
    path: "/leave",
    color: "amber",
  },
];
export const resignationReasonOptions = [
  "Family and/or personal reasons",
  "Better career opportunity",
  "Pregnancy",
  "Poor health / physical disability",
  "Relocation to another city/country",
  "Termination",
  "Dissatisfaction with salary/allowances",
  "Dissatisfaction with type of work",
  "Conflict with employees/supervisor/manager",
  "Others",
];

export const exitInterviewQuestions = [
  "What caused you to start looking for a new job?",
  "Why have you decided to leave the company?",
  "Was a single event responsible for your decision to leave?",
  "What does your new company offer that influenced your decision?",
  "What do you value about this company?",
  "What did you dislike about the company?",
  "How was your relationship with your manager?",
  "What could your supervisor improve in their management style?",
  "What did you like most about your job?",
  "What did you dislike about your job? What would you change?",
  "Did you have the resources and support needed to do your job? If not, what was missing?",
  "Were your goals clear and expectations well defined?",
  "Did you receive adequate feedback on your performance?",
  "Did you feel aligned with the company’s mission and goals?",
  "Any recommendations regarding compensation, benefits, or recognition?",
  "What would make you consider returning? Would you recommend this company to others?",
];

export const resignationStepLabels = [
  "Resignation Letter",
  "Employee Resignation Form",
  "Exit Interview Form",
  "Endorsement Form",
  "Submit Application",
];

export const EmptyResigationField = {
  resignation_letter: "",
  request_date: "",
  recipient_name: "",
  recipient_emp_id: "",
  employee_name: "",
  position: "",
  designation: "",
  hired_date: "",
  resignation_date: "",
  last_working_day: "",
  leaving_reasons: [],
  leaving_reason_other: "",
  interview_answers: Array(16).fill(""),
  endorsement_file_key: "",
  endorsement_file_name: "",
};
