export const badgeClass: Record<string, string> = {
  Present: "bg-green-100 text-green-800",
  Late: "bg-amber-100 text-amber-800",
  Undertime: "bg-rose-100 text-rose-800",
  "Half-Day": "bg-orange-100 text-orange-800",
  Absent: "bg-red-100 text-red-800",
  "On Leave": "bg-purple-100 text-purple-800",
  "No-notice-via-text": "bg-pink-100 text-pink-800",
  "No-notice-email": "bg-fuchsia-100 text-fuchsia-800",
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

export const getCurrentPeriod = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

export const formatMonthLabel = (monthValue: string): string => {
  if (!/^\d{4}-\d{2}$/.test(String(monthValue || ""))) return monthValue || "";

  const [yearValue, monthIndex] = String(monthValue).split("-").map(Number);
  return new Date(yearValue, monthIndex - 1, 1).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });
};

export const formatLeaveDays = (value: number | string): string => {
  const amount = Number(value || 0);
  return `${amount.toFixed(2)} day${amount === 1 ? "" : "s"}`;
};

export const pad = (n: number): string => (n < 10 ? "0" + n : "" + n);
