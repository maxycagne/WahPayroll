import { useState, useEffect, useMemo } from "react";
import { leavePolicy, isMandatedLeave } from "@/features/leave/leaveConstants";
import {
  calculateMandatedLeaveEndDate,
  countMandatedLeaveDays,
  countWorkingDaysExcludingWeekends,
} from "@/features/leave/utils/date.utils";
import { getLeaveHelperText } from "@/features/leave/leaveConstants";

/**
 * MandatedLeaveFilingModal
 * Component for filing legally mandated leaves with auto-date computation
 */
export default function MandatedLeaveFilingModal({
  isOpen,
  onClose,
  onSubmit,
  leaveType,
  currentUser,
  isSubmitting = false,
}) {
  const [startDate, setStartDate] = useState("");
  const [computedEndDate, setComputedEndDate] = useState("");
  const [effectiveDays, setEffectiveDays] = useState(0);
  const [reason, setReason] = useState("");
  const [documents, setDocuments] = useState({});
  const [eligibilityInfo, setEligibilityInfo] = useState(null);

  const policy = leavePolicy[leaveType] || {};

  // Compute end date and effective days when start date changes
  useEffect(() => {
    if (startDate && isMandatedLeave(leaveType)) {
      // Get the excludeWeekendsInDuration flag (default to true for backward compatibility)
      const excludeWeekends = policy.excludeWeekendsInDuration !== false;
      
      const endDate = calculateMandatedLeaveEndDate(
        startDate,
        policy.maxDays || 7,
        excludeWeekends
      );
      setComputedEndDate(endDate);

      // Calculate effective days (working days or calendar days based on the flag)
      const effectiveDays = countMandatedLeaveDays(startDate, endDate, excludeWeekends);
      setEffectiveDays(effectiveDays);
    }
  }, [startDate, leaveType, policy.maxDays, policy.excludeWeekendsInDuration]);

  // Display eligibility info based on leave type
  useEffect(() => {
    if (leaveType && policy.eligibilityRequirements) {
      const requirements = policy.eligibilityRequirements;
      let info = [];

      if (requirements.minContributionMonths) {
        info.push(
          `Requires ≥${requirements.minContributionMonths} months contributions`,
        );
      }

      if (requirements.applicableTo) {
        const applicable = requirements.applicableTo.join(", ");
        info.push(`Eligible for: ${applicable}`);
      }

      if (requirements.notes) {
        info.push(requirements.notes);
      }

      setEligibilityInfo(info);
    }
  }, [leaveType, policy]);

  const handleDocumentUpload = (e, docType) => {
    const file = e.target.files?.[0];
    if (file) {
      setDocuments((prev) => ({
        ...prev,
        [docType]: file,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!startDate) {
      alert("Start date is required");
      return;
    }

    if (!reason.trim()) {
      alert("Reason is required");
      return;
    }

    // Validate required documents
    const requiredDocs = policy.requiresDocument || [];
    for (const docType of requiredDocs) {
      if (!documents[docType]) {
        alert(
          `Required document missing: ${docType.replace(/_/g, " ").toUpperCase()}`,
        );
        return;
      }
    }

    // Prepare form data
    const formData = new FormData();
    formData.append("leave_type", leaveType);
    formData.append("date_from", startDate);
    formData.append("date_to", computedEndDate);
    formData.append("supervisor_remarks", reason);
    formData.append("priority", "High"); // Mandated leaves are typically high priority
    formData.append("emp_id", currentUser?.emp_id);

    // Add documents
    for (const [docType, file] of Object.entries(documents)) {
      formData.append(docType, file);
    }

    await onSubmit(formData);

    // Reset form
    setStartDate("");
    setComputedEndDate("");
    setEffectiveDays(0);
    setReason("");
    setDocuments({});
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-blue-600 text-white p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">{leaveType}</h2>
              <p className="text-blue-100 text-sm mt-1">
                {policy.maxDays} days entitlement • 
                {policy.excludeWeekendsInDuration === false 
                  ? " Includes weekends (calendar days)" 
                  : " Excludes weekends (working days only)"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Policy Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
              {getLeaveHelperText(leaveType)}
            </p>
            {eligibilityInfo && eligibilityInfo.length > 0 && (
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                {eligibilityInfo.map((info, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>{info}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Start Date *
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Auto-computed End Date and Effective Days */}
          {computedEndDate && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Auto-Computed End Date
                </label>
                <input
                  type="date"
                  value={computedEndDate}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Based on {policy.maxDays} day entitlement
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Effective Leave Duration
                </label>
                <div className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 font-semibold">
                  {effectiveDays} days 
                  {policy.excludeWeekendsInDuration === false 
                    ? " (calendar days)" 
                    : " (working days, excluding weekends)"}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Calculated automatically
                </p>
              </div>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Reason *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe the reason for filing this leave"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
              required
            />
          </div>

          {/* Required Documents */}
          {policy.requiresDocument && policy.requiresDocument.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                Required Documents *
              </h3>
              {policy.requiresDocument.map((docType) => (
                <div key={docType} className="flex items-center">
                  <input
                    type="file"
                    onChange={(e) => handleDocumentUpload(e, docType)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    required
                  />
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                    {documents[docType]?.name && (
                      <span className="text-green-600 dark:text-green-400">
                        ✓ {documents[docType].name}
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Disclaimer */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <p className="text-xs text-amber-700 dark:text-amber-300">
              ℹ️ This leave request will NOT deduct from your regular leave
              balance. It is a legally mandated entitlement. Your leave balance
              remains unaffected.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting || !startDate || !reason.trim()}
            >
              {isSubmitting ? "Submitting..." : "Submit Leave Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
