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

export const status = ["Present", "Late", "Undertime", "Absent", "Pending"];
// SELECT DATE_FORMAT(date, '%Y-%m') as month,
// COUNT(CASE WHEN status ="Absent" THEN 1 END) as Absent,
// COUNT(CASE WHEN status ="Present" THEN 1 END) as Present,
// COUNT(CASE WHEN status ="Late" THEN 1 END) as Late,
// COUNT(CASE WHEN status ="Undertime" THEN 1 END) as Undetime,
// COUNT(CASE WHEN status ="Pending" THEN 1 END) as Pending
// FROM attendance GROUP BY month
