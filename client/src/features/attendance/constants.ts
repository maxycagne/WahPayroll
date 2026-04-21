export const badgeClass: Record<string, string> = {
  Present: "bg-green-100 text-green-800",
  Late: "bg-amber-100 text-amber-800",
  Undertime: "bg-rose-100 text-rose-800",
  "Half-Day": "bg-orange-100 text-orange-800",
  Absent: "bg-red-100 text-red-800",
  "On Leave": "bg-purple-100 text-purple-800",
  Pending: "bg-gray-100 text-gray-500",
  "": "bg-gray-100 text-gray-500",
};

export const designationMap: Record<string, string[]> = {
  Operations: [
    "Supervisor(Finance & Operations)",
    "Assistant Finance & Operations Partner",
    "Admin & Human Resources Partner",
  ],
  "Health Program Partners": [
    "Supervisor(Health Program Partner)",
    "Health Program Partner",
    "Profiler",
  ],
  "Platform Innovation": [
    "Supervisor(Platform Innovation)",
    "Senior Platform Innovation Partner",
    "Platform Innovation Partner",
    "Data Analyst",
    "Business Analyst/Quality Assurance",
  ],
  "Network & System": [
    "Supervisor(Network & Systems)",
    "Network & Systems Partner",
  ],
};
