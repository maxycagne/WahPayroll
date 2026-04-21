/**
 * Server-side Leave Policy Definitions
 * Mirror of client-side leaveConstants.ts for validation
 */

export const leavePolicy = {
  // ============ LEGACY LEAVE TYPES ============
  "Birthday Leave": {
    category: "legacy",
    maxDays: 1,
    annualEntitlement: 1,
    deductsFromBalance: true,
    requiresDocument: [],
    minNoticeHours: 0,
    requiredApprovals: ["supervisor"],
  },
  "Vacation Leave": {
    category: "legacy",
    maxDays: 20,
    annualEntitlement: 20,
    deductsFromBalance: true,
    requiresDocument: [],
    minNoticeHours: 168,
    requiredApprovals: ["supervisor"],
  },
  "Sick Leave": {
    category: "legacy",
    maxDays: 10,
    annualEntitlement: 10,
    deductsFromBalance: true,
    requiresDocument: [],
    minNoticeHours: 0,
    requiredApprovals: ["supervisor"],
  },
  "PGT Leave": {
    category: "legacy",
    maxDays: 20,
    annualEntitlement: 20,
    deductsFromBalance: true,
    requiresDocument: [],
    minNoticeHours: 168,
    requiredApprovals: ["supervisor"],
  },
  "Job Order MAC Leave": {
    category: "legacy",
    maxDays: 12,
    annualEntitlement: 12,
    deductsFromBalance: true,
    requiresDocument: [],
    minNoticeHours: 168,
    requiredApprovals: ["supervisor"],
  },
  Offset: {
    category: "legacy",
    maxDays: 999,
    annualEntitlement: null,
    deductsFromBalance: false,
    requiresDocument: [],
    minNoticeHours: 0,
    requiredApprovals: [],
  },

  // ============ NEW: UNSCHEDULED LEAVE ============
  "Unscheduled - Sick Leave": {
    category: "unscheduled",
    maxDays: 7,
    annualEntitlement: 10,
    deductsFromBalance: true,
    requiresDocument: ["doctor_cert"], // Medical cert for 3+ days
    minNoticeHours: 0,
    requiredApprovals: ["supervisor"],
  },
  "Unscheduled - Emergency Leave": {
    category: "unscheduled",
    maxDays: 1,
    annualEntitlement: 1,
    deductsFromBalance: true,
    requiresDocument: [],
    minNoticeHours: 0,
    requiredApprovals: ["supervisor"],
  },
  "Unscheduled - Bereavement Leave": {
    category: "unscheduled",
    maxDays: 5,
    annualEntitlement: 5,
    deductsFromBalance: true,
    requiresDocument: ["death_cert"],
    minNoticeHours: 0,
    requiredApprovals: ["supervisor"],
  },

  // ============ NEW: SCHEDULED LEAVE ============
  "Scheduled - Vacation Leave": {
    category: "scheduled",
    maxDays: 12,
    annualEntitlement: 12,
    deductsFromBalance: true,
    requiresDocument: ["ocp"], // OCP for 5+ days
    minNoticeHours: 168, // 1 week
    requiredApprovals: ["supervisor", "executive_director"],
  },

  // ============ NEW: LEAVE WITHOUT PAY ============
  "Leave Without Pay": {
    category: "lwop",
    maxDays: 999,
    annualEntitlement: null,
    deductsFromBalance: false,
    requiresDocument: [],
    minNoticeHours: 336, // 2 weeks
    requiredApprovals: ["executive_director"],
  },

  // ============ NEW: LEGALLY MANDATED LEAVES ============
  "Mandated - Maternity Leave": {
    category: "mandated",
    maxDays: 105,
    annualEntitlement: 105,
    deductsFromBalance: false,
    requiresDocument: ["maternity_cert"],
    minNoticeHours: 672, // 4 weeks if possible
    requiredApprovals: ["executive_director", "hr"],
  },
  "Mandated - Special Leave for Women": {
    category: "mandated",
    maxDays: 60,
    annualEntitlement: 60,
    deductsFromBalance: false,
    requiresDocument: ["family_care_doc"],
    minNoticeHours: 168,
    requiredApprovals: ["supervisor", "executive_director"],
  },
  "Mandated - Paternity Leave": {
    category: "mandated",
    maxDays: 7,
    annualEntitlement: 7,
    deductsFromBalance: false,
    requiresDocument: ["birth_cert"],
    minNoticeHours: 168,
    requiredApprovals: ["executive_director", "hr"],
  },
  "Mandated - Solo Parent Leave": {
    category: "mandated",
    maxDays: 7,
    annualEntitlement: 7,
    deductsFromBalance: false,
    requiresDocument: ["solo_parent_cert"],
    minNoticeHours: 168,
    requiredApprovals: ["supervisor", "executive_director"],
  },
  "Mandated - VAWC Leave": {
    category: "mandated",
    maxDays: 10,
    annualEntitlement: 10,
    deductsFromBalance: false,
    requiresDocument: ["vawc_cert"],
    minNoticeHours: 0, // Emergency
    requiredApprovals: ["executive_director", "hr"],
  },
};

/**
 * Get policy for a leave type
 */
export function getLeavePolicy(leaveType: string) {
  return leavePolicy[leaveType] || null;
}

/**
 * Check if leave type deducts from balance
 */
export function isDeductibleLeave(leaveType: string): boolean {
  const policy = getLeavePolicy(leaveType);
  return policy ? policy.deductsFromBalance : true;
}

/**
 * Check if leave type is mandated
 */
export function isMandatedLeave(leaveType: string): boolean {
  const policy = getLeavePolicy(leaveType);
  return policy ? policy.category === "mandated" : false;
}

/**
 * Get required documents for a leave type
 */
export function getRequiredDocuments(leaveType: string): string[] {
  const policy = getLeavePolicy(leaveType);
  return policy ? policy.requiresDocument || [] : [];
}

/**
 * Validate leave filing against policy
 */
export function validateLeavePolicy(
  leaveType: string,
  dateDifference: number,
  hasRequiredDocuments: boolean
): { valid: boolean; errors: string[] } {
  const policy = getLeavePolicy(leaveType);
  const errors: string[] = [];

  if (!policy) {
    errors.push(`Unknown leave type: ${leaveType}`);
    return { valid: false, errors };
  }

  if (dateDifference > policy.maxDays) {
    errors.push(
      `${leaveType} cannot exceed ${policy.maxDays} days (requested: ${dateDifference})`
    );
  }

  if (policy.requiresDocument.length > 0 && !hasRequiredDocuments) {
    errors.push(
      `Required documents missing for ${leaveType}: ${policy.requiresDocument.join(", ")}`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
