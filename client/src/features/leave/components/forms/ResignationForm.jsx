import { useEffect, useMemo, useState } from "react";
import {
  exitInterviewQuestions,
  resignationReasons,
} from "@/features/leave/leaveConstants";
import { useToast } from "@/hooks/useToast";
import axiosInterceptor from "@/hooks/interceptor";

const resignationStepLabels = [
  "Resignation Letter",
  "Employee Resignation Form",
  "Exit Interview Form",
  "Endorsement Form",
  "Submit Application",
];

function safeText(value) {
  const text = String(value || "").trim();
  const lowered = text.toLowerCase();
  if (!text) return "";
  if (
    lowered === "undefined" ||
    lowered === "null" ||
    lowered === "undefined undefined" ||
    lowered === "null null"
  ) {
    return "";
  }
  return text;
}

function toDateInputValue(value) {
  const normalized = safeText(value);
  if (!normalized) return "";
  return normalized.slice(0, 10);
}

function buildEmployeeDisplayName(user) {
  const name = safeText(user?.name);
  if (name) return name;
  return safeText(`${safeText(user?.first_name)} ${safeText(user?.last_name)}`);
}

const ResignationForm = ({
  resignationForm,
  setResignationForm,
  resignationTypes,
  fileResignationMutation,
  setApplicationModalOpen,
  autosaveResignationMutation,
  submitResignationMutation,
}) => {
  const { showToast } = useToast();
  const [filePreview, setFilePreview] = useState(null);
  const [fileError, setFileError] = useState("");
  const [profile, setProfile] = useState(null);
  const [interviewPart, setInterviewPart] = useState(1);
  const currentUser = useMemo(
    () => JSON.parse(localStorage.getItem("wah_user") || "{}"),
    [],
  );
  const currentStepNumber = resignationForm.currentStep || 1;
  const resignationStatus = String(resignationForm.status || "Pending");
  const isApproved = resignationStatus.toLowerCase() === "approved";

  const questionsByPart = useMemo(() => {
    const part1 = exitInterviewQuestions.filter((q) => q.part === 1);
    const part2 = exitInterviewQuestions.filter((q) => q.part === 2);
    return { part1, part2 };
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      try {
        const response = await axiosInterceptor.get("/api/auth/me");
        const nextUser = response?.data?.user || null;
        if (!nextUser || !mounted) return;

        setProfile(nextUser);
        localStorage.setItem("wah_user", JSON.stringify(nextUser));

        if (
          !resignationForm.selectedSupervisor &&
          nextUser.assigned_supervisor
        ) {
          setResignationForm((prev) => ({
            ...prev,
            selectedSupervisor: nextUser.assigned_supervisor,
          }));
        }
      } catch (error) {
        console.error("Failed to load profile for resignation form:", error);
      }
    };

    loadProfile();

    return () => {
      mounted = false;
    };
  }, []);

  const handleNextStep = async () => {
    if (!validateCurrentStep()) return;
    if (resignationForm.resignationId && currentStepNumber < 5) {
      await triggerAutosave();
    }

    setResignationForm((prev) => ({
      ...prev,
      currentStep: Math.min(5, (prev.currentStep || 1) + 1),
    }));
  };

  const handlePrevStep = () => {
    setResignationForm((prev) => ({
      ...prev,
      currentStep: Math.max(1, (prev.currentStep || 1) - 1),
    }));
  };

  const validateCurrentStep = () => {
    switch (currentStepNumber) {
      case 1:
        if (!resignationForm.resignationLetter.trim()) {
          showToast(
            "Please write your resignation letter",
            "error",
            "top-right",
          );
          return false;
        }
        return true;
      case 2:
        if (!resignationForm.resignationDate) {
          showToast("Please select resignation date", "error", "top-right");
          return false;
        }
        if (!resignationForm.lastWorkingDay) {
          showToast(
            "Please select your last working day",
            "error",
            "top-right",
          );
          return false;
        }
        if (resignationForm.reasons.length === 0) {
          showToast("Please select at least one reason", "error", "top-right");
          return false;
        }
        if (
          resignationForm.reasons.includes("Others") &&
          !resignationForm.otherReason.trim()
        ) {
          showToast("Please specify your other reason", "error", "top-right");
          return false;
        }
        return true;
      case 3:
        const answers = Object.values(resignationForm.exitInterviewAnswers);
        if (answers.some((a) => !a.trim())) {
          showToast(
            "Please answer all exit interview questions",
            "error",
            "top-right",
          );
          return false;
        }
        return true;
      case 4:
        return true;
      default:
        return true;
    }
  };

  const triggerAutosave = async () => {
    if (
      !resignationForm.resignationId ||
      !autosaveResignationMutation?.mutateAsync
    )
      return;

    setResignationForm((prev) => ({
      ...prev,
      autosaveLoading: true,
    }));

    try {
      const stepData = getStepData(currentStepNumber);
      await autosaveResignationMutation.mutateAsync({
        resignationId: resignationForm.resignationId,
        step: currentStepNumber,
        data: stepData,
      });
    } catch (error) {
      console.error("Autosave failed:", error);
    } finally {
      setResignationForm((prev) => ({
        ...prev,
        autosaveLoading: false,
      }));
    }
  };

  const getStepData = (step) => {
    switch (step) {
      case 1:
        return { resignationLetter: resignationForm.resignationLetter };
      case 2:
        return {
          resignationDate: resignationForm.resignationDate,
          lastWorkingDay: resignationForm.lastWorkingDay,
          reasons: resignationForm.reasons,
          otherReason: resignationForm.otherReason,
        };
      case 3:
        return { exitInterviewAnswers: resignationForm.exitInterviewAnswers };
      case 4:
        return {
          endorsementFileKey: resignationForm.endorsementFileKey,
          endorsementFileName: resignationForm.endorsementFileName,
        };
      case 5:
        return {
          selectedSupervisor: resignationForm.selectedSupervisor,
          clearanceFileName: resignationForm.clearanceFileName,
          clearanceFileKey: resignationForm.clearanceFileKey,
        };
      default:
        return {};
    }
  };

  const handleFileUpload = (e, fieldPrefix = "endorsement") => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!validTypes.includes(file.type)) {
      setFileError("Please upload PDF or Word document");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setFileError("File size must be less than 10MB");
      return;
    }

    setFileError("");
    setResignationForm({
      ...resignationForm,
      [`${fieldPrefix}FileName`]: file.name,
    });

    const reader = new FileReader();
    reader.onload = () => {
      setFilePreview({
        name: file.name,
        type: file.type,
        data: reader.result, // This will be a data URL
      });
    };
    reader.readAsDataURL(file);
  };

  const userSource = profile || currentUser || {};

  const requesterName =
    buildEmployeeDisplayName(userSource) ||
    resignationForm?.name ||
    "Not available";
  const requesterPosition =
    safeText(userSource?.position) ||
    userSource?.job_title ||
    userSource?.title ||
    userSource?.rank ||
    resignationForm?.position ||
    resignationForm?.job_title ||
    "Not available";
  const requesterDept =
    safeText(userSource?.department) ||
    safeText(userSource?.designation) ||
    userSource?.dept ||
    resignationForm?.department ||
    resignationForm?.designation ||
    "Not available";
  const requesterHireDate = toDateInputValue(
    userSource?.hire_date ||
      userSource?.date_hired ||
      userSource?.date_joined ||
      userSource?.hired_at ||
      resignationForm?.date_hired ||
      resignationForm?.hire_date,
  );

  const selectedReasons = resignationForm.reasons || [];
  const includesOthers = selectedReasons.includes("Others");
  const recipients = resignationForm.recipientSupervisors || [];
  const assignedSupervisor =
    recipients[0] ||
    resignationForm.selectedSupervisor ||
    profile?.assigned_supervisor ||
    currentUser?.assigned_supervisor ||
    resignationForm.recipientSupervisor ||
    null;

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
            Current Date
          </p>
          <p className="mt-1 text-sm font-semibold text-gray-800">
            {new Date().toISOString().slice(0, 10)}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
            Recipient (Supervisor)
          </p>
          <p className="mt-1 text-sm font-semibold text-gray-800">
            {assignedSupervisor?.name || "Supervisor"}
          </p>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-lg font-semibold text-gray-900">
          Resignation Letter
        </h3>
        <p className="mb-4 text-sm text-gray-600">
          Provide the full body of your resignation letter.
        </p>
        <textarea
          value={resignationForm.resignationLetter}
          onChange={(e) =>
            setResignationForm({
              ...resignationForm,
              resignationLetter: e.target.value,
            })
          }
          placeholder="Dear [Manager Name],

I am writing to formally notify you of my resignation from my position as [Job Title] at [Company Name]. My last working day will be [Date].

Thank you for the opportunities and experiences I have gained during my time here..."
          rows={10}
          className="w-full resize-none rounded-xl border border-rose-200 bg-white px-4 py-3 text-sm leading-relaxed text-gray-800 shadow-sm focus:border-rose-500 focus:outline-none focus:ring-4 focus:ring-rose-100"
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
          Employee Details
        </p>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <p className="text-xs text-slate-500">Name</p>
            <p className="text-sm font-semibold text-slate-900">
              {requesterName}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Position</p>
            <p className="text-sm font-semibold text-slate-900">
              {requesterPosition}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Department / Designation</p>
            <p className="text-sm font-semibold text-slate-900">
              {requesterDept}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">
              Date of Joining (Hire Date)
            </p>
            <p className="text-sm font-semibold text-slate-900">
              {requesterHireDate
                ? new Date(requesterHireDate).toLocaleDateString()
                : "N/A"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600">
            Resignation Date
          </label>
          <input
            type="date"
            value={resignationForm.resignationDate}
            onChange={(e) =>
              setResignationForm({
                ...resignationForm,
                resignationDate: e.target.value,
              })
            }
            className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-rose-500 focus:outline-none focus:ring-4 focus:ring-rose-100"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600">
            Last Working Day
          </label>
          <input
            type="date"
            value={resignationForm.lastWorkingDay}
            onChange={(e) =>
              setResignationForm({
                ...resignationForm,
                lastWorkingDay: e.target.value,
              })
            }
            className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-rose-500 focus:outline-none focus:ring-4 focus:ring-rose-100"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-800">
          Reasons for Resignation
        </label>
        <p className="mb-3 text-xs text-gray-500">Select one or more reasons</p>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {resignationReasons.map((reason) => (
            <label
              key={reason}
              className="flex items-start gap-2 rounded-lg border border-gray-200 bg-white p-2 hover:border-rose-300"
            >
              <input
                type="checkbox"
                checked={selectedReasons.includes(reason)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setResignationForm({
                      ...resignationForm,
                      reasons: [...selectedReasons, reason],
                    });
                  } else {
                    setResignationForm({
                      ...resignationForm,
                      reasons: selectedReasons.filter((r) => r !== reason),
                    });
                  }
                }}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
              />
              <span className="text-xs text-gray-700">{reason}</span>
            </label>
          ))}
          <label className="flex items-start gap-2 rounded-lg border border-gray-200 bg-white p-2 hover:border-rose-300">
            <input
              type="checkbox"
              checked={includesOthers}
              onChange={(e) => {
                if (e.target.checked) {
                  setResignationForm({
                    ...resignationForm,
                    reasons: [...selectedReasons, "Others"],
                  });
                } else {
                  setResignationForm({
                    ...resignationForm,
                    reasons: selectedReasons.filter((r) => r !== "Others"),
                    otherReason: "",
                  });
                }
              }}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
            />
            <span className="text-xs text-gray-700">Others</span>
          </label>
        </div>
      </div>

      {includesOthers && (
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600">
            Please Specify
          </label>
          <textarea
            value={resignationForm.otherReason}
            onChange={(e) =>
              setResignationForm({
                ...resignationForm,
                otherReason: e.target.value,
              })
            }
            placeholder="Please explain your other reasons..."
            rows={3}
            className="mt-2 w-full resize-none rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-4 focus:ring-rose-100"
          />
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 text-xs text-indigo-800">
        <p className="font-semibold">Instructions</p>
        <p className="mt-1">
          Please answer each question honestly. Your responses will help Human
          Resources improve services and employee experience. All answers will
          remain confidential.
        </p>
      </div>

      <div className="flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600">
        <span>Exit Interview Part {interviewPart} of 2</span>
        <span>{interviewPart === 1 ? "Q1-8" : "Q9-16"}</span>
      </div>

      <div className="space-y-4">
        {(interviewPart === 1
          ? questionsByPart.part1
          : questionsByPart.part2
        ).map((q) => (
          <div
            key={q.id}
            className="rounded-xl border border-gray-200 bg-white p-3"
          >
            <label className="mb-2 block text-xs font-semibold text-gray-700">
              {q.id.replace("q", "")}. {q.question}
            </label>
            <textarea
              value={resignationForm.exitInterviewAnswers[q.id]}
              onChange={(e) =>
                setResignationForm({
                  ...resignationForm,
                  exitInterviewAnswers: {
                    ...resignationForm.exitInterviewAnswers,
                    [q.id]: e.target.value,
                  },
                })
              }
              placeholder="Your answer..."
              rows={3}
              className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-4 focus:ring-rose-100"
            />
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        {interviewPart === 1 ? (
          <button
            type="button"
            onClick={() => setInterviewPart(2)}
            className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
          >
            Proceed to Part 2
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setInterviewPart(1)}
            className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-300"
          >
            Back to Part 1
          </button>
        )}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-4">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
        <p className="font-semibold">Endorsement Documents</p>
        <p className="mt-1">1) Download the endorsement form (DOC file)</p>
        <p>2) Fill out the form offline</p>
        <p>3) Upload the completed document using the upload button</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
          Download Form
        </p>
        <a
          href="/forms/Resignee_Endorsement-Form.docx"
          download
          className="mt-2 inline-flex items-center rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
        >
          Download Endorsement Form (DOC)
        </a>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600">
          Upload Completed Endorsement Form
        </label>
        <div className="mt-2 flex items-center gap-2">
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) => handleFileUpload(e, "endorsement")}
            className="block w-full text-sm text-gray-700 file:mr-4 file:rounded-md file:border-0 file:bg-red-50 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-red-700 hover:file:bg-red-100"
          />
        </div>
        {fileError && <p className="mt-1 text-xs text-red-600">{fileError}</p>}

        {resignationForm.endorsementFileName && (
          <div className="mt-3 flex items-center justify-between rounded-md bg-green-50 p-2 text-xs">
            <span className="text-green-700">
              ✓ {resignationForm.endorsementFileName}
            </span>
            <button
              type="button"
              onClick={() => {
                setResignationForm({
                  ...resignationForm,
                  endorsementFileName: "",
                  endorsementFileKey: "",
                });
                setFilePreview(null);
              }}
              className="text-green-600 hover:text-green-800"
            >
              Remove
            </button>
          </div>
        )}
      </div>

      {/* File Preview */}
      {filePreview && (
        <div className="rounded-md border border-gray-200 p-3">
          <p className="mb-2 text-xs font-semibold text-gray-700">Preview:</p>
          {filePreview.type === "application/pdf" ? (
            <embed
              src={filePreview.data}
              type="application/pdf"
              className="h-96 w-full"
            />
          ) : (
            <div className="flex items-center justify-center rounded-md bg-gray-100 py-8">
              <p className="text-xs text-gray-600">
                {filePreview.type.includes("word")
                  ? "Word document preview is not available in-browser."
                  : "Document uploaded successfully"}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-5">
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <p className="mb-3 text-xs font-semibold text-blue-900">
          Resignation Application Summary
        </p>
        <div className="space-y-2 text-xs text-blue-800">
          <p>
            <span className="font-medium">Letter:</span> Provided
          </p>
          <p>
            <span className="font-medium">Resignation Date:</span>{" "}
            {resignationForm.resignationDate || "Not provided"}
          </p>
          <p>
            <span className="font-medium">Last Working Day:</span>{" "}
            {resignationForm.lastWorkingDay || "Not provided"}
          </p>
          <p>
            <span className="font-medium">Reasons:</span>{" "}
            {resignationForm.reasons.join(", ") || "Not provided"}
          </p>
          <p>
            <span className="font-medium">Exit Interview:</span> Completed
          </p>
          <p>
            <span className="font-medium">Document:</span>{" "}
            {resignationForm.endorsementFileName || "Not uploaded"}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
          Status Handling
        </p>
        <p className="mt-2 text-xs text-amber-900">
          Current Status: {resignationStatus}
        </p>
        {!isApproved ? (
          <p className="mt-2 text-xs text-amber-700">
            Clearance form actions will appear only after approval.
          </p>
        ) : (
          <p className="mt-2 text-xs text-amber-700">
            Approved: You can now download and upload the clearance form.
          </p>
        )}
      </div>

      {isApproved && (
        <>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600">
              Download Clearance Form (DOC)
            </label>
            <a
              href="/forms/Resignee_Exit-Clearance-Form.docx"
              download
              className="mt-2 inline-flex items-center rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              Download Clearance Form
            </a>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600">
              Upload Completed Clearance Form
            </label>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => handleFileUpload(e, "clearance")}
              className="mt-2 block w-full text-sm text-gray-700 file:mr-4 file:rounded-md file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-emerald-700 hover:file:bg-emerald-100"
            />
            <p className="mt-2 text-xs text-gray-500">
              Upload your completed clearance document.
            </p>
          </div>
        </>
      )}

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600">
          Assigned Supervisor
        </label>

        {assignedSupervisor ? (
          <div className="rounded-md border border-gray-200 p-3">
            <p className="text-sm font-semibold text-gray-800">
              {assignedSupervisor.name}
            </p>
            <p className="text-xs text-gray-500">
              {assignedSupervisor.designation || "Supervisor"}
            </p>
          </div>
        ) : (
          <div className="rounded-md bg-amber-50 p-3 text-xs text-amber-700">
            <p className="font-semibold">No supervisor assigned yet</p>
            <p>Supervisor will be auto-assigned based on your designation.</p>
          </div>
        )}
      </div>

      <div className="rounded-md bg-green-50 p-3 text-xs text-green-900">
        <p className="font-semibold">Ready to submit?</p>
        <p>Click “Submit Application” for supervisor approval.</p>
      </div>
    </div>
  );

  return (
    <form className="space-y-5">
      <div className="rounded-2xl bg-gradient-to-br from-rose-50 via-white to-amber-50 p-5 shadow-inner">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              Process: File Resignation
            </h3>
            <p className="text-xs text-gray-500">
              Step {currentStepNumber} of 5
            </p>
          </div>
          {resignationForm.autosaveLoading && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold text-amber-800">
              Saving draft...
            </span>
          )}
        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-rose-500 via-red-500 to-orange-400 transition-all duration-300"
            style={{ width: `${Math.max(8, (currentStepNumber / 5) * 100)}%` }}
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-5">
          {resignationStepLabels.map((label, index) => (
            <button
              type="button"
              key={label}
              onClick={() =>
                setResignationForm({
                  ...resignationForm,
                  currentStep: index + 1,
                })
              }
              className={`rounded-xl border px-3 py-2 text-left transition ${
                index + 1 === currentStepNumber
                  ? "border-rose-200 bg-rose-100"
                  : index + 1 < currentStepNumber
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-gray-200 bg-white"
              }`}
            >
              <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
                Step {index + 1}
              </p>
              <p className="text-xs font-semibold text-gray-800">{label}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-96 space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        {currentStepNumber === 1 && renderStep1()}
        {currentStepNumber === 2 && renderStep2()}
        {currentStepNumber === 3 && renderStep3()}
        {currentStepNumber === 4 && renderStep4()}
        {currentStepNumber === 5 && renderStep5()}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={handlePrevStep}
          disabled={currentStepNumber === 1}
          className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>

        {currentStepNumber < 5 && (
          <button
            type="button"
            onClick={handleNextStep}
            disabled={resignationForm.autosaveLoading}
            className="flex-1 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {resignationForm.autosaveLoading ? "Saving..." : "Next"}
          </button>
        )}

        {currentStepNumber === 5 && (
          <button
            type="submit"
            disabled={
              submitResignationMutation?.isPending ||
              resignationForm.submitLoading
            }
            onClick={async (e) => {
              e.preventDefault();
              if (!validateCurrentStep()) return;

              setResignationForm((prev) => ({
                ...prev,
                submitLoading: true,
              }));

              try {
                const submitPayload = {
                  ...resignationForm,
                  selectedSupervisor: assignedSupervisor,
                };
                if (submitResignationMutation?.mutateAsync) {
                  await submitResignationMutation.mutateAsync(submitPayload);
                } else if (fileResignationMutation?.mutateAsync) {
                  await fileResignationMutation.mutateAsync(submitPayload);
                }
                showToast("Resignation submitted successfully!", "success");
                setApplicationModalOpen(false);
              } catch (error) {
                console.error("Submit failed:", error);
                showToast(
                  error?.message || "Failed to submit resignation",
                  "error",
                );
              } finally {
                setResignationForm((prev) => ({
                  ...prev,
                  submitLoading: false,
                }));
              }
            }}
            className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {resignationForm.submitLoading
              ? "Submitting..."
              : "Submit Application"}
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => setApplicationModalOpen(false)}
        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
      >
        Cancel
      </button>
    </form>
  );
};

export default ResignationForm;
