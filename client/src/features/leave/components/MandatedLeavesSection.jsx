import { useState } from "react";
import { leaveTypes, leavePolicy } from "@/features/leave/leaveConstants";
import MandatedLeaveFilingModal from "./MandatedLeaveFilingModal";

/**
 * MandatedLeavesSection
 * Displays available mandated leaves and allows filing them
 */
export default function MandatedLeavesSection({
  currentUser,
  onSubmitMandatedLeave,
  isSubmitting = false,
}) {
  const [selectedMandatedLeave, setSelectedMandatedLeave] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter to get only mandated leave types
  const mandatedLeaveTypes = leaveTypes.filter(
    (type) => leavePolicy[type]?.category === "mandated"
  );

  const handleOpenModal = (leaveType) => {
    setSelectedMandatedLeave(leaveType);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMandatedLeave(null);
  };

  const handleSubmitLeave = async (formData) => {
    await onSubmitMandatedLeave(formData);
    handleCloseModal();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          Legally Mandated Leaves
        </h2>
        <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded">
          Non-deductible from balance
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mandatedLeaveTypes.map((leaveType) => {
          const policy = leavePolicy[leaveType];
          const displayName = leaveType.replace("Mandated - ", "");

          return (
            <div
              key={leaveType}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    {displayName}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Entitlement: <span className="font-medium">{policy.maxDays} days/year</span>
                  </p>
                </div>
                <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full">
                  RA
                </span>
              </div>

              <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 line-clamp-2">
                {policy.helperText}
              </p>

              {/* Eligibility Requirements Summary */}
              {policy.eligibilityRequirements && (
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-3 space-y-1">
                  {policy.eligibilityRequirements.minContributionMonths && (
                    <p>
                      • Min. contributions:{" "}
                      <span className="font-medium">
                        {policy.eligibilityRequirements.minContributionMonths} months
                      </span>
                    </p>
                  )}
                  {policy.eligibilityRequirements.applicableTo && (
                    <p>
                      • For:{" "}
                      <span className="font-medium">
                        {policy.eligibilityRequirements.applicableTo.join(", ")}
                      </span>
                    </p>
                  )}
                </div>
              )}

              <button
                onClick={() => handleOpenModal(leaveType)}
                className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                File {displayName}
              </button>
            </div>
          );
        })}
      </div>

      {/* Mandated Leave Filing Modal */}
      {selectedMandatedLeave && (
        <MandatedLeaveFilingModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSubmit={handleSubmitLeave}
          leaveType={selectedMandatedLeave}
          currentUser={currentUser}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-6">
        <h4 className="font-semibold text-blue-900 dark:text-blue-100 text-sm mb-2">
          ℹ️ About Legally Mandated Leaves
        </h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>
            • These leaves are legally mandated benefits under Philippine labor laws
          </li>
          <li>
            • Filing dates are automatically computed excluding weekends (Sat-Sun)
          </li>
          <li>• These leaves do NOT reduce your regular leave balance</li>
          <li>
            • Required documents and eligibility vary by leave type
          </li>
          <li>• Approval required from HR and/or Executive Director</li>
        </ul>
      </div>
    </div>
  );
}
