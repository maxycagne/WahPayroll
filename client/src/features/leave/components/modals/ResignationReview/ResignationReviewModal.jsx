import { useEffect, useState } from "react";
import {
  exitInterviewQuestions,
  resignationSteps,
} from "@/features/leave/leaveConstants";

const ResignationReviewModal = ({
  resignationReviewOpen,
  setResignationReviewOpen,
  selectedResignation,
  onFinalApprove,
  onKeepPending,
  isProcessing,
}) => {
  const [clearanceStatus, setClearanceStatus] = useState(
    selectedResignation?.clearance_status || "pending",
  );
  const [remarks, setRemarks] = useState(
    selectedResignation?.supervisor_remarks || "",
  );
  const [activeStep, setActiveStep] = useState(1);

  useEffect(() => {
    setClearanceStatus(selectedResignation?.clearance_status || "pending");
    setRemarks(selectedResignation?.supervisor_remarks || "");
  }, [selectedResignation]);

  if (!resignationReviewOpen || !selectedResignation) return null;

  const resignation = selectedResignation;
  const questions = exitInterviewQuestions;
  const part1 = questions.filter((q) => q.part === 1);
  const part2 = questions.filter((q) => q.part === 2);

  // Parse JSON fields from database
  const recipientSupervisors =
    typeof resignation.recipient_supervisors === "string"
      ? JSON.parse(resignation.recipient_supervisors || "[]")
      : resignation.recipient_supervisors || [];

  const reasons =
    typeof resignation.reasons_json === "string"
      ? JSON.parse(resignation.reasons_json || "[]")
      : resignation.reasons_json || [];

  const exitAnswers =
    typeof resignation.exit_interview_answers === "string"
      ? JSON.parse(resignation.exit_interview_answers || "{}")
      : resignation.exit_interview_answers || {};

  const totalAnsweredQuestions = Object.values(exitAnswers).filter(
    (value) => String(value || "").trim().length > 0,
  ).length;

  const sectionChecks = [
    {
      step: 1,
      title: "Resignation Letter",
      done: Boolean(String(resignation.resignation_letter || "").trim()),
    },
    {
      step: 2,
      title: "Employee Resignation Form",
      done: Boolean(
        resignation.resignation_date &&
        resignation.last_working_day &&
        (Array.isArray(reasons) ? reasons.length > 0 : false),
      ),
    },
    {
      step: 3,
      title: "Exit Interview",
      done: totalAnsweredQuestions >= 16,
    },
    {
      step: 4,
      title: "Endorsement Form",
      done: Boolean(resignation.endorsement_file_key),
    },
    {
      step: 5,
      title: "Submit Application",
      done: Boolean(resignation.submitted_at),
    },
  ];

  const completedSections = sectionChecks.filter(
    (section) => section.done,
  ).length;

  const renderStep1 = () => (
    <div className="space-y-3">
      <div>
        <p className="mb-2 text-xs font-semibold text-gray-600">
          Resignation Letter
        </p>
        <div className="rounded-md bg-gray-50 p-3 text-xs text-gray-700 whitespace-pre-wrap">
          {resignation.resignation_letter || "No letter provided"}
        </div>
      </div>
      <div className="rounded-md bg-blue-50 p-3 text-xs text-blue-700">
        <p className="font-semibold">Resignation Date:</p>
        <p>
          {resignation.created_at
            ? new Date(resignation.created_at).toLocaleDateString()
            : "N/A"}
        </p>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-md bg-gray-50 p-3">
          <p className="text-xs font-semibold text-gray-600">
            Resignation Date
          </p>
          <p className="mt-1 text-sm text-gray-700">
            {resignation.resignation_date
              ? new Date(resignation.resignation_date).toLocaleDateString()
              : "N/A"}
          </p>
        </div>
        <div className="rounded-md bg-gray-50 p-3">
          <p className="text-xs font-semibold text-gray-600">
            Last Working Day
          </p>
          <p className="mt-1 text-sm text-gray-700">
            {resignation.last_working_day
              ? new Date(resignation.last_working_day).toLocaleDateString()
              : "N/A"}
          </p>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold text-gray-600">
          Reasons for Resignation
        </p>
        <div className="rounded-md bg-gray-50 p-3 text-xs text-gray-700">
          {reasons && reasons.length > 0 ? (
            <ul className="list-inside list-disc space-y-1">
              {reasons.map((reason, idx) => (
                <li key={idx}>{reason}</li>
              ))}
            </ul>
          ) : (
            "No reasons provided"
          )}
        </div>
      </div>

      {resignation.other_reason && (
        <div>
          <p className="mb-2 text-xs font-semibold text-gray-600">
            Other Reason
          </p>
          <div className="rounded-md bg-gray-50 p-3 text-xs text-gray-700">
            {resignation.other_reason}
          </div>
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h4 className="mb-3 font-semibold text-gray-700">
          Part 1: Questions 1-8
        </h4>
        <div className="space-y-3">
          {part1.map((q) => (
            <div key={q.id}>
              <p className="mb-1 text-xs font-semibold text-gray-700">
                {q.id.toUpperCase()}: {q.question}
              </p>
              <div className="rounded-md bg-gray-50 p-2 text-xs text-gray-700">
                {exitAnswers[q.id] || "No answer provided"}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="mb-3 font-semibold text-gray-700">
          Part 2: Questions 9-16
        </h4>
        <div className="space-y-3">
          {part2.map((q) => (
            <div key={q.id}>
              <p className="mb-1 text-xs font-semibold text-gray-700">
                {q.id.toUpperCase()}: {q.question}
              </p>
              <div className="rounded-md bg-gray-50 p-2 text-xs text-gray-700">
                {exitAnswers[q.id] || "No answer provided"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-4">
      {resignation.endorsement_file_key ? (
        <div className="rounded-md border border-green-200 bg-green-50 p-3">
          <p className="text-xs font-semibold text-green-900">
            ✓ Document Uploaded
          </p>
          <p className="mt-1 text-xs text-green-700">
            File: {resignation.endorsement_file_name || "Document"}
          </p>
          <a
            href={`/api/file/get?filename=${resignation.endorsement_file_key}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block rounded-md bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700"
          >
            View Document
          </a>
        </div>
      ) : (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
          <p className="font-semibold">No endorsement document uploaded</p>
        </div>
      )}
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-3">
      <div className="rounded-md bg-blue-50 p-3 text-xs text-blue-700">
        <p className="font-semibold mb-2">Assigned Supervisor</p>
        {recipientSupervisors && recipientSupervisors.length > 0 ? (
          <div className="space-y-1">
            {recipientSupervisors.map((sup) => (
              <div key={sup.emp_id}>
                <p className="font-medium">{sup.name}</p>
                <p className="text-blue-600">{sup.designation}</p>
              </div>
            ))}
          </div>
        ) : (
          "No supervisors assigned"
        )}
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (activeStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      case 5:
        return renderStep5();
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
      <div className="w-full max-w-4xl overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-4">
          <div>
            <h3 className="m-0 text-lg font-bold text-gray-900">
              Resignation Review
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {resignation.first_name} {resignation.last_name} •{" "}
              {resignation.designation}
            </p>
          </div>
          <button
            onClick={() => setResignationReviewOpen(false)}
            className="cursor-pointer rounded-md border-0 bg-transparent px-2 py-1 text-lg text-gray-500 hover:text-gray-700"
          >
            &times;
          </button>
        </div>

        <div className="max-h-[70vh] overflow-auto">
          <div className="border-b border-gray-200 bg-slate-50 px-6 py-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-md border border-slate-200 bg-white p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Current Application Status
                </p>
                <p className="mt-1 text-sm font-bold text-slate-800">
                  {resignation.status || "Pending Approval"}
                </p>
              </div>
              <div className="rounded-md border border-slate-200 bg-white p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Submitted Sections
                </p>
                <p className="mt-1 text-sm font-bold text-slate-800">
                  {completedSections} / 5
                </p>
              </div>
              <div className="rounded-md border border-slate-200 bg-white p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Exit Interview Progress
                </p>
                <p className="mt-1 text-sm font-bold text-slate-800">
                  {totalAnsweredQuestions} / 16 answers
                </p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-5">
              {sectionChecks.map((section) => (
                <button
                  key={section.step}
                  type="button"
                  onClick={() => setActiveStep(section.step)}
                  className={`rounded-md border px-2 py-2 text-left text-xs ${
                    section.done
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-amber-200 bg-amber-50 text-amber-800"
                  }`}
                >
                  <p className="font-bold">Step {section.step}</p>
                  <p>{section.title}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Step Tabs */}
          <div className="sticky top-0 z-10 border-b border-gray-200 bg-white">
            <div className="flex gap-0 px-6 pt-4">
              {resignationSteps.map((step) => (
                <button
                  key={step.number}
                  onClick={() => setActiveStep(step.number)}
                  className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
                    activeStep === step.number
                      ? "border-red-600 text-red-600"
                      : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Step {step.number}: {step.title}
                </button>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <div className="p-6 space-y-4">{renderStepContent()}</div>

          {/* Clearance Status & Remarks */}
          <div className="border-t border-gray-200 bg-gray-50 p-6 space-y-4">
            <div>
              <p className="mb-3 text-sm font-semibold text-gray-700">
                Clearance Status
              </p>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="clearance_status"
                    value="pending"
                    checked={clearanceStatus === "pending"}
                    onChange={(e) => setClearanceStatus(e.target.value)}
                    disabled={isProcessing}
                    className="h-4 w-4 text-red-600"
                  />
                  <span className="text-sm text-gray-700">
                    Pending (Under Review)
                  </span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="clearance_status"
                    value="approved"
                    checked={clearanceStatus === "approved"}
                    onChange={(e) => setClearanceStatus(e.target.value)}
                    disabled={isProcessing}
                    className="h-4 w-4 text-green-600"
                  />
                  <span className="text-sm text-gray-700">Approved</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-700">
                Remarks / Feedback
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                disabled={isProcessing}
                placeholder="Add any remarks or feedback regarding this resignation..."
                rows={3}
                className="w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200 disabled:bg-gray-50"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="border-t border-gray-200 bg-white px-6 py-4 flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => setResignationReviewOpen(false)}
              disabled={isProcessing}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => onKeepPending(resignation, "pending", remarks)}
              disabled={isProcessing}
              className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
            >
              {isProcessing ? "Processing..." : "Keep Pending"}
            </button>
            <button
              type="button"
              onClick={() => onFinalApprove(resignation, "approved", remarks)}
              disabled={isProcessing}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
            >
              {isProcessing ? "Processing..." : "Final Approve"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResignationReviewModal;
