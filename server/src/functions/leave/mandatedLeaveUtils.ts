import { leavePolicy } from "../../constants/leavePolicy";

/**
 * Calculate end date for mandated leave given start date and duration
 * @param startDate - Start date of the leave (YYYY-MM-DD format)
 * @param daysRequired - Number of days required
 * @param excludeWeekends - If true, only count working days (Mon-Fri). If false, include all calendar days
 * @returns End date in YYYY-MM-DD format
 */
export function calculateMandatedLeaveEndDate(
  startDate: string,
  daysRequired: number,
  excludeWeekends: boolean = true
): string {
  if (!startDate || daysRequired <= 0) return "";

  const current = new Date(startDate);
  if (isNaN(current.getTime())) return "";

  let count = 0;

  if (excludeWeekends) {
    // Count only working days (Mon-Fri)
    while (count < daysRequired) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        // Not Sunday (0) or Saturday (6)
        count++;
      }

      if (count < daysRequired) {
        current.setDate(current.getDate() + 1);
      }
    }
  } else {
    // Count all calendar days including weekends
    count = 1; // Start date counts as day 1
    while (count < daysRequired) {
      current.setDate(current.getDate() + 1);
      count++;
    }
  }

  const year = current.getFullYear();
  const month = String(current.getMonth() + 1).padStart(2, "0");
  const day = String(current.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/**
 * Count days between two dates with weekend handling options
 * @param startDate - Start date (YYYY-MM-DD)
 * @param endDate - End date (YYYY-MM-DD)
 * @param excludeWeekends - If true, count only working days (Mon-Fri). If false, count all calendar days
 * @returns Number of days (or working days) between dates inclusive
 */
export function countMandatedLeaveDays(
  startDate: string,
  endDate: string,
  excludeWeekends: boolean = true
): number {
  if (!startDate || !endDate) return 0;

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;

  let count = 0;
  const current = new Date(start);

  if (excludeWeekends) {
    // Count only working days (Mon-Fri)
    while (current <= end) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        // Not Sunday or Saturday
        count++;
      }
      current.setDate(current.getDate() + 1);
    }
  } else {
    // Count all calendar days
    while (current <= end) {
      count++;
      current.setDate(current.getDate() + 1);
    }
  }

  return count;
}

/**
 * Legacy function: Count working days (Mon-Fri) between two dates (inclusive)
 * Kept for backward compatibility. Use countMandatedLeaveDays instead.
 * @deprecated Use countMandatedLeaveDays(startDate, endDate, true) instead
 */
export function countWorkingDaysExcludingWeekends(
  startDate: string,
  endDate: string
): number {
  return countMandatedLeaveDays(startDate, endDate, true);
}

/**
 * Validate mandated leave eligibility
 * @param leaveType - Type of mandated leave
 * @param employee - Employee object with properties like status, hire_date, etc.
 * @returns { isEligible: boolean, remarks: string }
 */
export function validateMandatedLeaveEligibility(
  leaveType: string,
  employee: any
): { isEligible: boolean; remarks: string } {
  const policy = leavePolicy[leaveType];

  if (!policy || policy.category !== "mandated") {
    return {
      isEligible: false,
      remarks: `Leave type "${leaveType}" is not a mandated leave type`,
    };
  }

  const requirements = policy.eligibilityRequirements || {};

  // Check employment status for contribution months (Maternity Leave)
  if (requirements.minContributionMonths) {
    const minMonths = requirements.minContributionMonths;
    if (employee.hired_date) {
      const hireDate = new Date(employee.hired_date);
      const now = new Date();
      const monthsDiff =
        (now.getFullYear() - hireDate.getFullYear()) * 12 +
        (now.getMonth() - hireDate.getMonth());

      if (monthsDiff < minMonths) {
        return {
          isEligible: false,
          remarks: `Requires at least ${minMonths} months of contributions. Current tenure: ${monthsDiff} months.`,
        };
      }
    }
  }

  // Check gender-specific eligibility
  if (requirements.applicableTo && requirements.applicableTo.length > 0) {
    const applicableTo = requirements.applicableTo;

    if (applicableTo.includes("female")) {
      // Normalize gender field
      const gender = String(employee.gender || "").trim().toLowerCase();
      if (gender !== "female" && gender !== "f" && gender !== "woman") {
        return {
          isEligible: false,
          remarks: `${leaveType} is only available for female employees.`,
        };
      }
    }

    if (applicableTo.includes("married_male")) {
      const gender = String(employee.gender || "").trim().toLowerCase();
      const maritalStatus = String(employee.marital_status || "")
        .trim()
        .toLowerCase();

      if (gender !== "male" && gender !== "m") {
        return {
          isEligible: false,
          remarks: `${leaveType} is only available for male employees.`,
        };
      }

      if (maritalStatus !== "married") {
        return {
          isEligible: false,
          remarks: `${leaveType} is only available for married male employees.`,
        };
      }
    }

    if (applicableTo.includes("solo_parent")) {
      const soloParentStatus = String(employee.solo_parent_status || "")
        .trim()
        .toLowerCase();
      if (soloParentStatus !== "yes" && soloParentStatus !== "true") {
        return {
          isEligible: false,
          remarks: `${leaveType} is only available for registered solo parents. Valid DSWD ID required.`,
        };
      }
    }
  }

  return {
    isEligible: true,
    remarks: "Employee meets all eligibility requirements for this leave type.",
  };
}

/**
 * Get mandated leave entitlement details
 * @param leaveType - Type of mandated leave
 * @returns Entitlement object with maxDays, requirements, etc.
 */
export function getMandatedLeaveEntitlement(leaveType: string) {
  const policy = leavePolicy[leaveType];

  if (!policy || policy.category !== "mandated") {
    return null;
  }

  return {
    leaveType,
    maxDays: policy.maxDays,
    annualEntitlement: policy.annualEntitlement,
    requiresDocument: policy.requiresDocument,
    requiredApprovals: policy.requiredApprovals,
    eligibilityRequirements: policy.eligibilityRequirements || {},
  };
}

/**
 * Validate mandated leave filing parameters
 * @param leaveType - Type of leave
 * @param dateFrom - Start date
 * @param dateTo - End date
 * @param excludeWeekendsCount - Count of working days provided
 * @returns { valid: boolean, errors: string[] }
 */
export function validateMandatedLeaveFiling(
  leaveType: string,
  dateFrom: string,
  dateTo: string,
  excludeWeekendsCount?: number
): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  const policy = leavePolicy[leaveType];
  if (!policy || policy.category !== "mandated") {
    errors.push(`Invalid mandated leave type: ${leaveType}`);
    return { valid: false, errors, warnings };
  }

  // Validate dates
  const fromDate = new Date(dateFrom);
  const toDate = new Date(dateTo);

  if (isNaN(fromDate.getTime())) {
    errors.push("Invalid start date provided");
  }

  if (isNaN(toDate.getTime())) {
    errors.push("Invalid end date provided");
  }

  if (fromDate > toDate) {
    errors.push("Start date cannot be after end date");
  }

  // Check working days count
  if (!excludeWeekendsCount || excludeWeekendsCount <= 0) {
    warnings.push(
      "Working days count should be calculated and included for mandated leaves"
    );
  }

  if (excludeWeekendsCount && excludeWeekendsCount > policy.maxDays) {
    errors.push(
      `Working days requested (${excludeWeekendsCount}) exceeds maximum allowed (${policy.maxDays}) for ${leaveType}`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
