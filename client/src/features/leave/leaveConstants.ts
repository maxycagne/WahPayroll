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
    maxDays: 105, // 60 before, 45 after delivery (standard PH entitlement)
    excludeWeekends: false, // Calendar days, not working days
    annualEntitlement: 105,
    deductsFromBalance: false, // Mandated: does NOT reduce balance
    requiresDocument: ["maternity_cert"], // Medical certificate or SSS maternity benefit form
    minNoticeHours: 672, // 4 weeks advance notice if possible
    requiredApprovals: ["executive_director", "hr"],
    helperText:
      "Legal entitlement (RA 11165). Medical certificate and SSS maternity benefit form required. Does not reduce balance.",
  },
  "Mandated - Special Leave for Women": {
    category: "mandated",
    maxDays: 60, // Annual entitlement for women (for family care)
    excludeWeekends: true,
    annualEntitlement: 60,
    deductsFromBalance: false, // Does NOT reduce balance
    requiresDocument: ["family_care_doc"], // Document supporting reason (e.g., child sick leave, parent care)
    minNoticeHours: 168, // 1 week if possible
    requiredApprovals: ["supervisor", "executive_director"],
    helperText:
      "Legal entitlement for women employees (RA 9710). For child or family care. Does not reduce balance.",
  },
  "Mandated - Paternity Leave": {
    category: "mandated",
    maxDays: 7, // Standard paternity leave (some companies allow up to 10)
    excludeWeekends: false, // Calendar days
    annualEntitlement: 7,
    deductsFromBalance: false, // Does NOT reduce balance
    requiresDocument: ["birth_cert"], // Birth certificate of child
    minNoticeHours: 168, // Advance notice if possible
    requiredApprovals: ["executive_director", "hr"],
    helperText:
      "Legal entitlement (RA 8187). Birth certificate required. Does not reduce balance.",
  },
  "Mandated - Solo Parent Leave": {
    category: "mandated",
    maxDays: 7, // Annual solo parent entitlement
    excludeWeekends: true,
    annualEntitlement: 7,
    deductsFromBalance: false, // Does NOT reduce balance
    requiresDocument: ["solo_parent_cert"], // Solo parent certificate from DSWD or Local Government
    minNoticeHours: 168,
    requiredApprovals: ["supervisor", "executive_director"],
    helperText:
      "Legal entitlement for registered solo parents (RA 8972). DSWD certificate required. Does not reduce balance.",
  },
  "Mandated - VAWC Leave": {
    category: "mandated",
    maxDays: 10, // Annual VAWC leave
    excludeWeekends: true,
    annualEntitlement: 10,
    deductsFromBalance: false, // Does NOT reduce balance
    requiresDocument: ["vawc_cert"], // Protection order, police report, or barangay certification
    minNoticeHours: 0, // Emergency: can be filed immediately for safety
    requiredApprovals: ["executive_director", "hr"],
    helperText:
      "Legal entitlement for victims of violence (RA 9262). Protection order or police report required. Does not reduce balance.",
  },
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

export const calendarStatusOrder = {
  Pending: 0,
  Approved: 1,
  "Partially Approved": 1,
  Denied: 2,
};

export const calendarStatusCardClass = {
  Pending: "border border-yellow-200 bg-yellow-50/80",
  Approved: "border border-green-200 bg-green-50/80",
  "Partially Approved": "border border-amber-200 bg-amber-50/80",
  Denied: "border border-red-200 bg-red-50/80",
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
