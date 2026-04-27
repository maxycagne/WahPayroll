export const leaveTypes = [
  // Legacy leave types (kept for backward compatibility)
  "Birthday Leave",
  "PGT Leave",
  "Offset",
  // New: Unscheduled Leave (within year, immediate filing)
  "Unscheduled - Sick Leave",
  "Unscheduled - Emergency Leave",
  "Unscheduled - Bereavement Leave",
  // New: Scheduled Leave (advance notice required)
  "Scheduled - Vacation Leave",
  // New: Leave Without Pay (for unregularized or zero-balance)
  "Leave Without Pay",
  // New: Legally Mandated Leaves (non-deductible, entitlement-based)
  "Mandated - Maternity Leave",
  "Mandated - Special Leave for Women",
  "Mandated - Paternity Leave",
  "Mandated - Solo Parent Leave",
  "Mandated - VAWC Leave",
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
  // ============ LEGACY LEAVE TYPES ============
  "Birthday Leave": {
    category: "legacy",
    maxDays: 1,
    excludeWeekends: true,
    annualEntitlement: 1,
    deductsFromBalance: true,
    requiresDocument: [],
    minNoticeHours: 0, // Can be filed immediately
    requiredApprovals: ["supervisor"],
  },
  "Vacation Leave": {
    category: "legacy",
    maxDays: 20,
    excludeWeekends: true,
    annualEntitlement: 20,
    deductsFromBalance: true,
    requiresDocument: [],
    minNoticeHours: 168, // 1 week notice
    requiredApprovals: ["supervisor"],
  },
  "Sick Leave": {
    category: "legacy",
    maxDays: 10,
    excludeWeekends: true,
    annualEntitlement: 10,
    deductsFromBalance: true,
    requiresDocument: [],
    minNoticeHours: 0, // Immediate filing
    requiredApprovals: ["supervisor"],
  },
  "PGT Leave": {
    category: "legacy",
    maxDays: 20,
    excludeWeekends: true,
    annualEntitlement: 20,
    deductsFromBalance: true,
    requiresDocument: [],
    minNoticeHours: 168,
    requiredApprovals: ["supervisor"],
  },
  "Job Order MAC Leave": {
    category: "legacy",
    maxDays: 12,
    excludeWeekends: true,
    annualEntitlement: 12,
    deductsFromBalance: true,
    requiresDocument: [],
    minNoticeHours: 168,
    requiredApprovals: ["supervisor"],
  },
  Offset: {
    category: "legacy",
    maxDays: 999,
    excludeWeekends: false,
    annualEntitlement: null,
    deductsFromBalance: false, // Special: adjusts balance by application
    requiresDocument: [],
    minNoticeHours: 0,
    requiredApprovals: [],
  },

  // ============ NEW: UNSCHEDULED LEAVE (Within-Year) ============
  "Unscheduled - Sick Leave": {
    category: "unscheduled",
    maxDays: 7, // Max consecutive days per occurrence
    excludeWeekends: true,
    annualEntitlement: 10, // Total days per year
    deductsFromBalance: true,
    requiresDocument: ["doctor_cert"], // Medical certificate for 3+ days
    minNoticeHours: 0, // Can file upon return or same-day if notified by 9 AM
    requiredApprovals: ["supervisor"],
    helperText:
      "File upon return or notify supervisor by 9 AM same-day. Medical certificate required for leaves ≥ 3 days.",
  },
  "Unscheduled - Emergency Leave": {
    category: "unscheduled",
    maxDays: 1, // One-time emergency only
    excludeWeekends: true,
    annualEntitlement: 1,
    deductsFromBalance: true,
    requiresDocument: [], // Supporting documents if extended
    minNoticeHours: 0, // Immediate filing on occurrence day
    requiredApprovals: ["supervisor"],
    helperText:
      "For unexpected personal emergencies. Limited to 1 day per occurrence. Must notify supervisor immediately.",
  },
  "Unscheduled - Bereavement Leave": {
    category: "unscheduled",
    maxDays: 5, // Up to 5 days for family death
    excludeWeekends: true,
    annualEntitlement: 5,
    deductsFromBalance: true,
    requiresDocument: ["death_cert"], // Death certificate or funeral notice
    minNoticeHours: 0, // Immediate filing
    requiredApprovals: ["supervisor"],
    helperText:
      "For immediate family member death (spouse, child, parent, sibling). Death certificate or funeral notice required.",
  },

  // ============ NEW: SCHEDULED LEAVE ============
  "Scheduled - Vacation Leave": {
    category: "scheduled",
    maxDays: 12, // Maximum consecutive vacation days
    excludeWeekends: true,
    annualEntitlement: 12, // Total days per year
    deductsFromBalance: true,
    requiresDocument: ["ocp"], // OCP required if 5+ days
    minNoticeHours: 168, // 1 week (7 days) advance notice; OCP due 5 days before
    requiredApprovals: ["supervisor", "executive_director"],
    helperText:
      "Minimum 1-week notice required. OCP required for leaves ≥ 5 days (due 5 days before start). Supervisor & ED approval needed.",
  },

  // ============ NEW: LEAVE WITHOUT PAY ============
  "Leave Without Pay": {
    category: "lwop",
    maxDays: 999, // Unlimited, subject to approval
    excludeWeekends: true,
    annualEntitlement: null, // Not counted toward entitlement
    deductsFromBalance: false, // Does not deduct from shared balance
    requiresDocument: ["lwop_approval"], // ED approval letter
    minNoticeHours: 168 * 2, // 2 weeks notice (or more, per ED discretion)
    requiredApprovals: ["executive_director"],
    helperText:
      "For unregularized or zero-balance employees. ED approval required. Does not reduce leave balance.",
  },

  // ============ NEW: LEGALLY MANDATED LEAVES (Non-Deductible) ============
  "Mandated - Maternity Leave": {
    category: "mandated",
    maxDays: 105, // RA 11210: 105 days paid leave (60 regular + 45 after delivery)
    excludeWeekends: true, // Count only working days (Mon-Fri)
    annualEntitlement: 105,
    deductsFromBalance: false, // Mandated: does NOT reduce balance
    requiresDocument: ["maternity_cert"], // Medical certificate or SSS maternity benefit form
    minNoticeHours: 672, // 4 weeks advance notice if possible
    requiredApprovals: ["executive_director", "hr"],
    eligibilityRequirements: {
      minContributionMonths: 3, // Requires at least 3 months contributions
      applicableTo: ["all"], // All pregnant employees
      notes: "60 days transferable to caregiver; +30 additional days for qualified solo parents"
    },
    helperText:
      "Legal entitlement (RA 11210): 105 paid days, 60 transferable. Requires ≥3 months contributions. Medical certificate required. Does not reduce balance.",
  },
  "Mandated - Special Leave for Women": {
    category: "mandated",
    maxDays: 60, // RA 9710: 2 months (60 days) for gynecological surgery or medical procedures
    excludeWeekends: true, // Count only working days
    annualEntitlement: 60,
    deductsFromBalance: false, // Does NOT reduce balance
    requiresDocument: ["medical_cert"], // Medical certificate from OB/GYN specialist
    minNoticeHours: 168, // 1 week if possible (or as per medical necessity)
    requiredApprovals: ["supervisor", "executive_director"],
    eligibilityRequirements: {
      applicableTo: ["female"], // Only for female employees
      notes: "For gynecological surgery or medical procedures. Can be emergency-filed if medical necessary."
    },
    helperText:
      "Legal entitlement (RA 9710): 2 months (60 days) for gynecological surgery/medical procedures. Female employees only. Medical certificate required. Does not reduce balance.",
  },
  "Mandated - Paternity Leave": {
    category: "mandated",
    maxDays: 7, // RA 8187: 7 days per year for married male employees
    excludeWeekends: true, // Count only working days
    annualEntitlement: 7,
    deductsFromBalance: false, // Does NOT reduce balance
    requiresDocument: ["birth_cert"], // Birth certificate of child / SSS registration
    minNoticeHours: 168, // Advance notice if possible
    requiredApprovals: ["executive_director", "hr"],
    eligibilityRequirements: {
      applicableTo: ["married_male"], // Married male employees only
      notes: "7 days per calendar year for child birth assistance"
    },
    helperText:
      "Legal entitlement (RA 8187): 7 days/year for married male employees on child birth. Birth certificate required. Does not reduce balance.",
  },
  "Mandated - Solo Parent Leave": {
    category: "mandated",
    maxDays: 7, // RA 8972: 7 days per year for qualified solo parents
    excludeWeekends: true, // Count only working days
    annualEntitlement: 7,
    deductsFromBalance: false, // Does NOT reduce balance
    requiresDocument: ["solo_parent_cert"], // DSWD Solo Parent ID or LGU certificate
    minNoticeHours: 168, // 1 week if possible
    requiredApprovals: ["supervisor", "executive_director"],
    eligibilityRequirements: {
      applicableTo: ["solo_parent"], // Registered solo parents only
      notes: "Must have valid DSWD Solo Parent ID"
    },
    helperText:
      "Legal entitlement (RA 8972): 7 days/year for qualified solo parents. DSWD ID/LGU certificate required. Does not reduce balance.",
  },
  "Mandated - VAWC Leave": {
    category: "mandated",
    maxDays: 10, // RA 9262: Up to 10 days per year, extendable by court/barangay order
    excludeWeekends: true, // Count only working days
    annualEntitlement: 10,
    deductsFromBalance: false, // Does NOT reduce balance
    requiresDocument: ["vawc_cert"], // Protection order, police report, or barangay certification
    minNoticeHours: 0, // Emergency: can be filed immediately for safety
    requiredApprovals: ["executive_director", "hr"],
    eligibilityRequirements: {
      applicableTo: ["female"], // Primarily for female victims of violence
      notes: "Can be extended beyond 10 days with valid court/barangay order. Emergency filing allowed."
    },
    helperText:
      "Legal entitlement (RA 9262): Up to 10 days/year for violence victims. Protection order/police report required. Extendable by court order. Does not reduce balance.",
  },
};

export const badgeClass = {
  Approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  Denied: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  Pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  "Pending Approval": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  "Cancellation Requested": "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  Rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  "Partially Approved": "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
};

export const calendarStatusOrder = {
  Pending: 0,
  Approved: 1,
  "Partially Approved": 1,
  Denied: 2,
};

export const calendarStatusCardClass = {
  Pending: "border border-yellow-200 dark:border-yellow-900/30 bg-yellow-50/80 dark:bg-yellow-900/20",
  Approved: "border border-green-200 dark:border-green-900/30 bg-green-50/80 dark:bg-green-900/20",
  "Partially Approved": "border border-amber-200 dark:border-amber-900/30 bg-amber-50/80 dark:bg-amber-900/20",
  Denied: "border border-red-200 dark:border-red-900/30 bg-red-50/80 dark:bg-red-900/20",
};

export const statusColors = {
  Approved: {
    bg: "bg-green-50 dark:bg-green-900/20",
    border: "border-l-4 border-l-green-500",
    text: "text-green-700 dark:text-green-400",
  },
  Pending: {
    bg: "bg-yellow-50 dark:bg-yellow-900/20",
    border: "border-l-4 border-l-yellow-500",
    text: "text-yellow-700 dark:text-yellow-400",
  },
  Denied: {
    bg: "bg-red-50 dark:bg-red-900/20",
    border: "border-l-4 border-l-red-500",
    text: "text-red-700 dark:text-red-400",
  },
  "Partially Approved": {
    bg: "bg-amber-50 dark:bg-amber-900/20",
    border: "border-l-4 border-l-amber-500",
    text: "text-amber-700 dark:text-amber-400",
  },
};

export const attendanceColors = {
  Present: "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20",
  Absent: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20",
  Late: "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20",
  Undertime: "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20",
  "Half-Day": "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20",
};

// ============ HELPER FUNCTIONS ============

/**
 * Get policy for a specific leave type
 * @param {string} leaveType - The leave type to look up
 * @returns {Object} Policy object or null if not found
 */
export function getLeavePolicy(leaveType) {
  return leavePolicy[leaveType] || null;
}

/**
 * Check if a leave type deducts from balance
 * @param {string} leaveType - The leave type to check
 * @returns {boolean} True if it deducts, false otherwise
 */
export function isDeductibleLeave(leaveType) {
  const policy = getLeavePolicy(leaveType);
  return policy ? policy.deductsFromBalance : true; // Default true for safety
}

/**
 * Check if a leave type is mandated (non-deductible)
 * @param {string} leaveType - The leave type to check
 * @returns {boolean} True if mandated, false otherwise
 */
export function isMandatedLeave(leaveType) {
  const policy = getLeavePolicy(leaveType);
  return policy ? policy.category === "mandated" : false;
}

/**
 * Check if a leave type requires a document
 * @param {string} leaveType - The leave type to check
 * @returns {Array} Array of required documents or empty array
 */
export function getRequiredDocuments(leaveType) {
  const policy = getLeavePolicy(leaveType);
  return policy ? policy.requiresDocument || [] : [];
}

/**
 * Check if a leave type requires specific approval chain
 * @param {string} leaveType - The leave type to check
 * @returns {Array} Array of required approvers or empty array
 */
export function getRequiredApprovals(leaveType) {
  const policy = getLeavePolicy(leaveType);
  return policy ? policy.requiredApprovals || [] : [];
}

/**
 * Get annual entitlement for a leave type
 * @param {string} leaveType - The leave type to check
 * @returns {number|null} Annual entitlement or null if not applicable
 */
export function getAnnualEntitlement(leaveType) {
  const policy = getLeavePolicy(leaveType);
  return policy ? policy.annualEntitlement : null;
}

/**
 * Get helper text for a leave type (e.g., filing requirements)
 * @param {string} leaveType - The leave type to check
 * @returns {string} Helper text or empty string
 */
export function getLeaveHelperText(leaveType) {
  const policy = getLeavePolicy(leaveType);
  return policy ? policy.helperText || "" : "";
}

/**
 * Get leave category (legacy, unscheduled, scheduled, lwop, mandated)
 * @param {string} leaveType - The leave type to check
 * @returns {string} Category or 'legacy' as default
 */
export function getLeaveCategory(leaveType) {
  const policy = getLeavePolicy(leaveType);
  return policy ? policy.category : "legacy";
}

export const leaveUploadFieldKeys = [
  "OCP",
  "doctorCert",
  "deathCert",
  "lwopApproval",
  "maternity_cert",
  "family_care_doc",
  "birth_cert",
  "solo_parent_cert",
  "vawc_cert",
];
