import {
  isDeductibleLeave,
  isMandatedLeave,
  getRequiredDocuments,
  getLeaveHelperText,
} from "../../leaveConstants";
import LeaveUploadField from "./LeaveUploadField";
import Toast from "@/components/Toast"; // Import your Toast component
import { useToast } from "@/hooks/useToast";
export default function LeaveForm({
  handleLeaveTypeChange,
  handleFromDateChange,
  handleToDateChange,
  getMaxToDate,
  setApplicationModalOpen,
  formData,
  setFormData,
  currentUser,
  availableLeaveTypes,
  difference,
  totalCredits,
  handleSubmitLeave,
}) {
  const isMandated = isMandatedLeave(formData.leaveType);
  const isDeductible = isDeductibleLeave(formData.leaveType);
  const requiredDocs = getRequiredDocuments(formData.leaveType);
  const helperText = getLeaveHelperText(formData.leaveType);
  const { toast, showToast, clearToast } = useToast();
  // Determine if we should show OCP (5+ days for vacation or scheduled leaves)
  const shouldShowOCP =
    formData.leaveType === "Scheduled - Vacation Leave" && difference >= 5;

  // Check if this leave type requires doctor certificate for 3+ days
  const shouldShowDoctorCert =
    formData.leaveType === "Unscheduled - Sick Leave" && difference >= 3;

  // Check if this leave type requires death certificate
  const shouldShowDeathCert =
    formData.leaveType === "Unscheduled - Bereavement Leave";

  // Check if this is leave without pay
  const isLWOP = formData.leaveType === "Leave Without Pay";

  // Check if Emergency Leave (max 1 day)
  const isEmergency = formData.leaveType === "Unscheduled - Emergency Leave";

  // Check if Birthday Leave
  const isBirthdayLeave = formData.leaveType === "Birthday Leave";
  const handleValidation = (e) => {
    e.preventDefault();

    if (!formData.fromDate) {
      return showToast("Please select a start date (From Date).", "error");
    }

    if (!formData.toDate) {
      return showToast("Please select an end date (To Date).", "error");
    }

    if (!formData.reason || formData.reason.trim() === "") {
      return showToast("Please provide a reason for your leave.", "error");
    }

    // 2. Document Validation
    if (shouldShowOCP && !formData.OCP) {
      return showToast(
        "OCP document is required for vacations of 5 days or more.",
        "error",
      );
    }

    if (shouldShowDoctorCert && !formData.doctorCert) {
      return showToast(
        "Medical Certificate is required for sick leave of 3 or more days.",
        "error",
      );
    }

    if (shouldShowDeathCert && !formData.deathCert) {
      return showToast(
        "Please upload a Death Certificate or Funeral Notice.",
        "error",
      );
    }

    if (isMandated) {
      const missingDoc = requiredDocs.find((doc) => !formData[doc]);
      if (missingDoc) {
        return showToast(
          `Please upload the required: ${missingDoc.replace(/_/g, " ")}`,
          "error",
        );
      }
    }

    handleSubmitLeave(e);
  };
  return (
    <>
      <Toast toast={toast} onClose={clearToast} />
      <form
        onSubmit={handleValidation}
        className="grid grid-cols-1 gap-4 md:grid-cols-3"
      >
        {/* Filing As */}
        <div className="flex flex-col gap-2 md:col-span-3">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Filing As
          </label>
          <input
            type="text"
            disabled
            value={`${currentUser.emp_id} - ${currentUser.name}`}
            className="cursor-not-allowed rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-bold text-gray-600 outline-none"
          />
        </div>

        {/* Leave Type Info Box (for mandated/LWOP) */}
        {(isMandated || isLWOP) && (
          <div
            className={`md:col-span-3 rounded-lg border px-4 py-3 text-sm ${
              isMandated
                ? "border-blue-200 bg-blue-50"
                : "border-amber-200 bg-amber-50"
            }`}
          >
            <p className="m-0 font-semibold">
              {isMandated
                ? "📋 Legally Mandated Leave"
                : "⚠️ Leave Without Balance Deduction"}
            </p>
            <p className="m-0 text-xs text-gray-700 mt-1">
              {isMandated
                ? "This leave does not reduce your leave balance and has legal entitlements."
                : "This leave does not deduct from your available balance. ED approval required."}
            </p>
          </div>
        )}

        {/* Leave Type */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Leave Type<span className="text-red-500">*</span>
          </label>
          <select
            value={formData.leaveType}
            onChange={handleLeaveTypeChange}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500"
          >
            {availableLeaveTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          {helperText && (
            <p className="m-0 text-xs text-gray-600 italic mt-1">
              {helperText}
            </p>
          )}
        </div>

        {/* From Date */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
            From Date<span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={formData.fromDate}
            onChange={handleFromDateChange}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* To Date */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
            To Date<span className="text-red-500">*</span>
            {isEmergency && (
              <span className="ml-1 text-red-600 font-bold">(Max 1 Day)</span>
            )}
          </label>
          <input
            type="date"
            value={formData.toDate}
            onChange={handleToDateChange}
            disabled={isBirthdayLeave}
            max={getMaxToDate()}
            min={formData.fromDate}
            className={`rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500 ${isBirthdayLeave ? "cursor-not-allowed bg-gray-100 text-gray-500" : ""}`}
          />
        </div>

        {/* OCP Upload (for 5+ day leaves) */}
        {shouldShowOCP && (
          <LeaveUploadField
            label="OCP"
            required
            file={formData.OCP}
            onChange={(selectedFile) =>
              setFormData((prev) => ({
                ...prev,
                OCP: selectedFile,
              }))
            }
            onRemove={() =>
              setFormData((prev) => ({
                ...prev,
                OCP: undefined,
              }))
            }
            helperText="OCP required 5 days before leave start date"
          />
        )}

        {/* Doctor Certificate (for Unscheduled Sick Leave 3+ days) */}
        {shouldShowDoctorCert && (
          <LeaveUploadField
            label="Medical Certificate"
            required
            file={formData.doctorCert}
            onChange={(selectedFile) =>
              setFormData((prev) => ({
                ...prev,
                doctorCert: selectedFile,
              }))
            }
            onRemove={() =>
              setFormData((prev) => ({
                ...prev,
                doctorCert: undefined,
              }))
            }
            helperText="Medical certificate required for sick leaves of 3 or more days"
          />
        )}

        {/* Death Certificate (for Bereavement Leave) */}
        {shouldShowDeathCert && (
          <LeaveUploadField
            label="Death Certificate / Funeral Notice"
            required
            file={formData.deathCert}
            onChange={(selectedFile) =>
              setFormData((prev) => ({
                ...prev,
                deathCert: selectedFile,
              }))
            }
            onRemove={() =>
              setFormData((prev) => ({
                ...prev,
                deathCert: undefined,
              }))
            }
            helperText="Death certificate or funeral notice required for bereavement leave"
          />
        )}

        {/* Mandated Leave Documents */}
        {isMandated &&
          requiredDocs.map((docType) => (
            <LeaveUploadField
              key={docType}
              label={docType.replace(/_/g, " ")}
              required
              file={formData[docType]}
              onChange={(selectedFile) =>
                setFormData((prev) => ({
                  ...prev,
                  [docType]: selectedFile,
                }))
              }
              onRemove={() =>
                setFormData((prev) => ({
                  ...prev,
                  [docType]: undefined,
                }))
              }
              helperText="Required document for this leave type"
            />
          ))}

        {/* Priority Level (hidden for Offset and Mandated leaves) */}
        {formData.leaveType !== "Offset" && !isMandated && (
          <div className="flex flex-col gap-2 md:col-span-3">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Priority Level<span className="text-red-500">*</span>
            </label>
            <select
              value={formData.priority}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  priority: e.target.value,
                })
              }
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
        )}

        {/* Reason / Details */}
        <div className="flex flex-col gap-2 md:col-span-3">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Reason / Details<span className="text-red-500">*</span>
          </label>
          <textarea
            rows={3}
            value={formData.reason}
            onChange={(e) =>
              setFormData({ ...formData, reason: e.target.value })
            }
            className="resize-none rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-500"
            placeholder={
              isMandated
                ? "Provide details about your mandated leave (e.g., estimated delivery date for maternity, relationship to deceased for bereavement)"
                : "Provide reason or additional details for this leave request"
            }
          />
        </div>

        <div className="mt-1 flex items-center justify-between md:col-span-3">
          <div className="flex flex-col">
            {isDeductible ? (
              <>
                <p className="m-0 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  Estimated Cost
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-black text-indigo-700">
                    {totalCredits.toFixed(2)}
                  </span>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">
                    Credits Used
                  </span>
                  <span className="text-[10px] font-bold text-gray-300">|</span>
                  <span className="text-[11px] font-semibold text-gray-500 italic">
                    ({difference} working days)
                  </span>
                </div>
              </>
            ) : (
              <>
                <p className="m-0 text-[11px] font-semibold text-blue-600 uppercase tracking-wider">
                  ✓ No Balance Deduction
                </p>
                <p className="m-0 text-[10px] text-gray-500 italic">
                  This leave does not reduce your balance
                </p>
              </>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setApplicationModalOpen(false)}
              className="cursor-pointer rounded-lg bg-gray-200 px-5 py-2 text-sm font-bold text-gray-700 hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="cursor-pointer rounded-lg bg-green-600 px-5 py-2 text-sm font-bold text-white hover:bg-green-700 transition-colors shadow-sm"
            >
              Review Application
            </button>
          </div>
        </div>
      </form>
    </>
  );
}
