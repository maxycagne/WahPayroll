// ----
export const parseDateOnly = (value: DateInput) => {
  if (value instanceof Date)
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  const raw = String(value || "").trim();
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    const [, y, m, d] = match;
    return new Date(Number(y), Number(m) - 1, Number(d));
  }
  const parsed = new Date(raw);
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
};

export function formatLongDate(value: DateInput) {
  return parseDateOnly(value).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
// ----
const getDateDiffInclusiveCore = ({ start, end }: DateDiffInclusive) => {
  const from = parseDateOnly(start).getTime();
  const to = parseDateOnly(end).getTime();
  return Math.floor((to - from) / (1000 * 60 * 60 * 24)) + 1;
};

// Use this for ({ start, end })
export const getDateDiffInclusive = (
  arg1: DateDiffInclusive | DateInput,
  arg2?: DateInput,
) => {
  if (arg1 && typeof arg1 === "object" && "start" in arg1 && "end" in arg1) {
    return getDateDiffInclusiveCore(arg1 as DateDiffInclusive);
  }
  return getDateDiffInclusiveCore({
    start: arg1 as DateInput,
    end: arg2 as DateInput,
  });
};

// Use this for (start, end)
export const getDateDiffInclusiveCompat = (
  start: DateInput,
  end: DateInput,
) => {
  return getDateDiffInclusiveCore({ start, end });
};
// ----
export const isInRange = ({ date, from, to }: IsInRange): boolean => {
  const d = parseDateOnly(date).getTime();
  const f = parseDateOnly(from).getTime();
  const t = parseDateOnly(to).getTime();
  return d >= f && d <= t;
};
// ----
export function getDaysInMonth({
  year,
  month,
}: {
  year: number;
  month: number;
}): number {
  return new Date(year, month + 1, 0).getDate();
}
// ----
export function getWorkweekTypeForDate(dateValue: DateInput, configs: any[] = []): string {
  if (!configs || configs.length === 0) return "5-day"; // default to 5-day
  
  const target = parseDateOnly(dateValue).getTime();
  
  // Sort configs by effective_from descending to find the latest applicable config
  const sorted = [...configs].sort((a, b) => {
    return new Date(b.effective_from).getTime() - new Date(a.effective_from).getTime();
  });

  for (const cfg of sorted) {
    const fromTime = parseDateOnly(cfg.effective_from).getTime();
    const toTime = cfg.effective_to ? parseDateOnly(cfg.effective_to).getTime() : Infinity;
    
    if (target >= fromTime && target <= toTime) {
      return cfg.workweek_type || "5-day";
    }
  }
  
  return "5-day";
}

export function isNonWorkingDay(dateValue: DateInput, configs: any[] = []): boolean {
  if (!dateValue) return false;
  const target = parseDateOnly(dateValue);
  const dayOfWeek = target.getDay();
  const workweekType = getWorkweekTypeForDate(dateValue, configs);
  
  if (dayOfWeek === 0 || dayOfWeek === 6) return true; // Sunday, Saturday always off
  if (workweekType === "4-day" && dayOfWeek === 5) return true; // Friday off for 4-day
  
  return false;
}

// ----
function calculateBusinessDaysCore({
  startDate,
  endDate,
  configs = [],
}: {
  startDate: DateInput;
  endDate: DateInput;
  configs?: any[];
}) {
  if (!startDate || !endDate) return;
  let count = 0;
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    if (!isNonWorkingDay(current, configs)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
}

/**
 * Calculates total leave credits based on workweek-type multipliers
 */
export function calculateTotalCredits(startDate: DateInput, endDate: DateInput, configs: any[] = []) {
  if (!startDate || !endDate) return 0;
  let total = 0;
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    if (!isNonWorkingDay(current, configs)) {
      const type = getWorkweekTypeForDate(current, configs);
      total += type === "4-day" ? 1.25 : 1.0;
    }
    current.setDate(current.getDate() + 1);
  }
  return total;
}
export function calculateBusinessDays(
  arg1:
    | {
        startDate: DateInput;
        endDate: DateInput;
        configs?: any[];
      }
    | DateInput,
  arg2?: DateInput,
  arg3?: any[],
) {
  if (arg1 && typeof arg1 === "object" && "startDate" in arg1) {
    return calculateBusinessDaysCore(arg1 as { startDate: DateInput; endDate: DateInput; configs?: any[] });
  }
  return calculateBusinessDaysCore({
    startDate: arg1 as DateInput,
    endDate: arg2 as DateInput,
    configs: arg3 as any[],
  });
}
// Compatibility shim: supports both calculateBusinessDays({ startDate, endDate, configs }) and calculateBusinessDays(startDate, endDate, configs).
export function calculateBusinessDaysCompat(
  arg1:
    | {
        startDate: DateInput;
        endDate: DateInput;
        configs?: any[];
      }
    | DateInput,
  arg2?: DateInput,
  arg3?: any[],
) {
  if (arg1 && typeof arg1 === "object" && "startDate" in arg1) {
    return calculateBusinessDaysCore(arg1 as { startDate: DateInput; endDate: DateInput; configs?: any[] });
  }
  return calculateBusinessDaysCore({
    startDate: arg1 as DateInput,
    endDate: arg2 as DateInput,
    configs: arg3 as any[],
  });
}
// --
function getDateRangeInclusiveCore({ start, end }: DateDiffInclusive) {
  const dates = [];
  const current = parseDateOnly(start);
  const to = parseDateOnly(end);

  while (current <= to) {
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, "0");
    const day = String(current.getDate()).padStart(2, "0");
    dates.push(`${year}-${month}-${day}`);
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

function getWorkingDateRangeInclusiveCore({
  start,
  end,
  configs = [],
}: DateDiffInclusive & { configs?: any[] }) {
  const dates = [];
  const current = parseDateOnly(start);
  const to = parseDateOnly(end);

  while (current <= to) {
    if (!isNonWorkingDay(current, configs)) {
      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, "0");
      const day = String(current.getDate()).padStart(2, "0");
      dates.push(`${year}-${month}-${day}`);
    }
    current.setDate(current.getDate() + 1);
  }

  return dates;
}
export function getDateRangeInclusive(
  arg1: DateDiffInclusive | DateInput,
  arg2?: DateInput,
) {
  if (arg1 && typeof arg1 === "object" && "start" in arg1 && "end" in arg1) {
    return getDateRangeInclusiveCore(arg1 as DateDiffInclusive);
  }
  return getDateRangeInclusiveCore({
    start: arg1 as DateInput,
    end: arg2 as DateInput,
  });
}

export function getWorkingDateRangeInclusive(
  arg1:
    | (DateDiffInclusive & { configs?: any[] })
    | DateInput,
  arg2?: DateInput,
  arg3?: any[],
) {
  if (
    arg1 &&
    typeof arg1 === "object" &&
    "start" in arg1 &&
    "end" in arg1
  ) {
    return getWorkingDateRangeInclusiveCore(
      arg1 as DateDiffInclusive & { configs?: any[] },
    );
  }

  return getWorkingDateRangeInclusiveCore({
    start: arg1 as DateInput,
    end: arg2 as DateInput,
    configs: arg3 as any[],
  });
}
// Compatibility shim: supports both getDateRangeInclusive({ start, end }) and getDateRangeInclusive(start, end).
export function getDateRangeInclusiveCompat(
  arg1: DateDiffInclusive | DateInput,
  arg2?: DateInput,
) {
  if (arg1 && typeof arg1 === "object" && "start" in arg1 && "end" in arg1) {
    return getDateRangeInclusiveCore(arg1 as DateDiffInclusive);
  }
  return getDateRangeInclusiveCore({
    start: arg1 as DateInput,
    end: arg2 as DateInput,
  });
}

// --

// --
export function isFutureDateString(dateValue: DateInput) {
  if (!dateValue) return false;
  const target = new Date(dateValue);
  if (Number.isNaN(target.getTime())) return false;
  target.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return target > today;
}

/**
 * Calculates the end date for mandated leave given a start date and number of working days.
 * Excludes weekends (Saturday and Sunday) from the count.
 * @param startDate - The start date of the leave
 * @param workingDaysRequired - Number of working days (excluding weekends) needed
 * @param configs - Optional workweek configurations
 * @returns The calculated end date in YYYY-MM-DD format
 */
export function calculateMandatedLeaveEndDate(
  startDate: DateInput,
  workingDaysRequired: number,
  configs: any[] = []
): string {
  if (!startDate || workingDaysRequired <= 0) return "";
  
  let count = 0;
  const current = parseDateOnly(startDate);
  
  while (count < workingDaysRequired) {
    // Check if current day is a working day (not a weekend)
    // For mandated leaves, we only exclude Sat/Sun, not considering 4-day workweek
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
      count++;
    }
    
    if (count < workingDaysRequired) {
      current.setDate(current.getDate() + 1);
    }
  }
  
  const year = current.getFullYear();
  const month = String(current.getMonth() + 1).padStart(2, "0");
  const day = String(current.getDate()).padStart(2, "0");
  
  return `${year}-${month}-${day}`;
}

/**
 * Counts working days (excluding weekends) between two dates
 * Useful for determining effective leave days in mandated leave requests
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Number of working days (Mon-Fri) between dates inclusive
 */
export function countWorkingDaysExcludingWeekends(
  startDate: DateInput,
  endDate: DateInput
): number {
  if (!startDate || !endDate) return 0;
  
  let count = 0;
  const current = parseDateOnly(startDate);
  const end = parseDateOnly(endDate);
  
  while (current <= end) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday or Saturday
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
}
