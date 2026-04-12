export const leaveTypes = [
  "Birthday Leave",
  "Vacation Leave",
  "Sick Leave",
  "PGT Leave",
  "Offset", // ADDED: Offset as a leave type
];

export const resignationTypes = [
  "Voluntary Resignation",
  "Health Reasons",
  "Relocation",
  "Career Change",
  "Further Education",
  "Other",
];

export const leavePolicy = {
  "Birthday Leave": { maxDays: 1, excludeWeekends: true },
  "Vacation Leave": { maxDays: 20, excludeWeekends: true },
  "Sick Leave": { maxDays: 10, excludeWeekends: true },
  "PGT Leave": { maxDays: 20, excludeWeekends: true },
  "Job Order MAC Leave": { maxDays: 12, excludeWeekends: true },
  Offset: { maxDays: 999, excludeWeekends: false }, // Prevent maxDays error for offsets
};

export const badgeClass = {
  Approved: "bg-green-100 text-green-800",
  Denied: "bg-red-100 text-red-800",
  Pending: "bg-yellow-100 text-yellow-800",
  "Pending Approval": "bg-yellow-100 text-yellow-800",
  "Cancellation Requested": "bg-amber-100 text-amber-800",
  Rejected: "bg-red-100 text-red-800",
  "Partially Approved": "bg-amber-100 text-amber-800",
};

export const statusColors = {
  Approved: {
    bg: "bg-green-50",
    border: "border-l-4 border-l-green-500",
    text: "text-green-700",
  },
  Pending: {
    bg: "bg-yellow-50",
    border: "border-l-4 border-l-yellow-500",
    text: "text-yellow-700",
  },
  Denied: {
    bg: "bg-red-50",
    border: "border-l-4 border-l-red-500",
    text: "text-red-700",
  },
  "Partially Approved": {
    bg: "bg-amber-50",
    border: "border-l-4 border-l-amber-500",
    text: "text-amber-700",
  },
};

export const attendanceColors = {
  Present: "text-green-600 bg-green-50",
  Absent: "text-red-600 bg-red-50",
  Late: "text-orange-600 bg-orange-50",
  Undertime: "text-orange-600 bg-orange-50",
  "Half-Day": "text-purple-600 bg-purple-50",
};

// --- RESIGNATION PROCESS CONSTANTS ---
export const resignationReasons = [
  "Family and/or personal reasons",
  "Better career opportunity",
  "Pregnancy",
  "Poor health / physical disability",
  "Relocation to another city/country",
  "Termination",
  "Dissatisfaction with salary/allowances",
  "Dissatisfaction with type of work",
  "Conflict with employees/supervisor/manager",
];

export const exitInterviewQuestions = [
  { id: "q1", part: 1, question: "What caused you to start looking for a new job?" },
  { id: "q2", part: 1, question: "Why have you decided to leave the company?" },
  { id: "q3", part: 1, question: "Was a single event responsible for your decision to leave?" },
  { id: "q4", part: 1, question: "What does your new company offer that influenced your decision?" },
  { id: "q5", part: 1, question: "What do you value about this company?" },
  { id: "q6", part: 1, question: "What did you dislike about the company?" },
  { id: "q7", part: 1, question: "How was your relationship with your manager?" },
  { id: "q8", part: 1, question: "What could your supervisor improve in their management style?" },
  { id: "q9", part: 2, question: "What did you like most about your job?" },
  { id: "q10", part: 2, question: "What did you dislike about your job? What would you change?" },
  { id: "q11", part: 2, question: "Did you have the resources and support needed to do your job? If not, what was missing?" },
  { id: "q12", part: 2, question: "Were your goals clear and expectations well defined?" },
  { id: "q13", part: 2, question: "Did you receive adequate feedback on your performance?" },
  { id: "q14", part: 2, question: "Did you feel aligned with the company’s mission and goals?" },
  { id: "q15", part: 2, question: "Any recommendations regarding compensation, benefits, or recognition?" },
  { id: "q16", part: 2, question: "What would make you consider returning? Would you recommend this company to others?" },
];

export const resignationSteps = [
  {
    number: 1,
    title: "Resignation Letter",
    description: "Draft your resignation letter",
  },
  {
    number: 2,
    title: "Details & Reasons",
    description: "Provide dates and reasons for resignation",
  },
  {
    number: 3,
    title: "Exit Interview",
    description: "Complete exit interview questionnaire",
  },
  {
    number: 4,
    title: "Endorsements",
    description: "Upload clearance documents",
  },
  {
    number: 5,
    title: "Review & Submit",
    description: "Review and finalize submission",
  },
];
