import React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useToast } from "@/hooks/useToast";
import { mutationHandler } from "../../hooks/createMutationHandler";
import axiosInterceptor from "@/hooks/interceptor";
import {
  exitInterviewQuestions,
  resignationReasonOptions,
  resignationStepLabels,
} from "@/assets/constantData";
import { useFieldStore } from "../../store/useFieldStore";
import {
  buildEmployeeDisplayName,
  safeText,
  toDateInputValue,
} from "@/utils/text.utils";
import { useAuthStore } from "@/stores/authStore";

function getErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message || error.message || fallback;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

function getDefaultResignationWizardState(
  currentUser?: CurrentUserLike | null,
): ResignationWizardState {
  const today = new Date().toISOString().slice(0, 10);
  return {
    resignation_letter: "",
    request_date: today,
    recipient_name: "Supervisor",
    recipient_emp_id: "",
    employee_name: buildEmployeeDisplayName(currentUser) || "Employee",
    position: safeText(currentUser?.position) || "N/A",
    designation: safeText(currentUser?.designation) || "N/A",
    hired_date: toDateInputValue(currentUser?.hired_date),
    resignation_date: "",
    last_working_day: "",
    leaving_reasons: [],
    leaving_reason_other: "",
    interview_answers: Array(16).fill(""),
    endorsement_file_key: "",
    endorsement_file_name: "",
  };
}

export default function ResignationForm({
  setApplicationModalOpen,
  fileResignationMutation,
  currentUser: currentUserProp,
}: ResignationFormProps) {
  const { showToast } = useToast();
  const authUser = useAuthStore((state) => state.user);
  const currentUser = useMemo<CurrentUserLike>(() => {
    if (currentUserProp) return currentUserProp;
    return authUser && typeof authUser === "object"
      ? (authUser as CurrentUserLike)
      : {};
  }, [authUser, currentUserProp]);

  const defaultResignationForm = useMemo(
    () => getDefaultResignationWizardState(currentUser),
    [currentUser],
  );

  const resignationForm = useFieldStore((state) => state.resignationForm);
  const setField = useFieldStore((state) => state.setField);
  const resetForm = useFieldStore((state) => state.resetForm);
  const setArrayField = useFieldStore((state) => state.setArrayField);

  const [resignationStep, setResignationStep] = useState(1);
  const [resignationInterviewPart, setResignationInterviewPart] = useState(1);
  const [resignationWizardError, setResignationWizardError] = useState("");
  const [isUploadingEndorsement, setIsUploadingEndorsement] = useState(false);
  const [isEndorsementActionsOpen, setIsEndorsementActionsOpen] =
    useState(false);
  const [hasLoadedResignationDraft, setHasLoadedResignationDraft] =
    useState(false);
  const lastSavedResignationDraftRef = useRef("");
  const endorsementObjectUrlRef = useRef("");

  const revokeEndorsementObjectUrl = () => {
    if (endorsementObjectUrlRef.current) {
      window.URL.revokeObjectURL(endorsementObjectUrlRef.current);
      endorsementObjectUrlRef.current = "";
    }
  };

  useEffect(() => {
    return () => revokeEndorsementObjectUrl();
  }, []);

  useEffect(() => {
    if (!safeText(resignationForm.request_date)) {
      setField("request_date", defaultResignationForm.request_date);
    }
    if (!safeText(resignationForm.recipient_name)) {
      setField("recipient_name", defaultResignationForm.recipient_name);
    }
    if (!safeText(resignationForm.employee_name)) {
      setField("employee_name", defaultResignationForm.employee_name);
    }
    if (!safeText(resignationForm.position)) {
      setField("position", defaultResignationForm.position);
    }
    if (!safeText(resignationForm.designation)) {
      setField("designation", defaultResignationForm.designation);
    }
    if (!safeText(resignationForm.hired_date)) {
      setField("hired_date", defaultResignationForm.hired_date);
    }
    if (
      !Array.isArray(resignationForm.interview_answers) ||
      resignationForm.interview_answers.length !== 16
    ) {
      setField("interview_answers", defaultResignationForm.interview_answers);
    }
    if (!Array.isArray(resignationForm.leaving_reasons)) {
      setField("leaving_reasons", []);
    }
  }, [defaultResignationForm, resignationForm, setField]);

  const { data: resignationRecipient = null } =
    useQuery<ResignationRecipient | null>({
      queryKey: ["resignation-recipient", currentUser?.emp_id],
      queryFn: async () => {
        try {
          return await mutationHandler(
            axiosInterceptor.get("/api/employees/resignations/recipient"),
            "Failed to load resignation recipient",
          );
        } catch {
          return null;
        }
      },
      enabled: Boolean(currentUser?.emp_id),
    });

  const { data: resignationDraftData = null } =
    useQuery<ResignationDraftData | null>({
      queryKey: ["resignation-draft", currentUser?.emp_id],
      queryFn: async () => {
        const result = await mutationHandler(
          axiosInterceptor.get("/api/employees/resignations/draft"),
          "Failed to load resignation draft",
        );
        return (result?.draft as ResignationDraftData | undefined) || null;
      },
      enabled: Boolean(currentUser?.emp_id),
      refetchOnWindowFocus: false,
    });

  const saveResignationDraftMutation = useMutation<
    unknown,
    Error,
    SaveResignationDraftVariables
  >({
    mutationFn: async ({ payload, step, interviewPart }) => {
      return mutationHandler(
        axiosInterceptor.put("/api/employees/resignations/draft", {
          payload,
          step,
          interviewPart,
        }),
        "Failed to save resignation draft",
      );
    },
    onError: (err) =>
      showToast(err.message || "Failed to auto-save draft.", "error"),
  });

  useEffect(() => {
    if (!resignationRecipient) return;
    const recipientName = safeText(resignationRecipient.recipient_name);
    setField(
      "request_date",
      resignationRecipient.request_date || defaultResignationForm.request_date,
    );
    setField(
      "recipient_name",
      recipientName || defaultResignationForm.recipient_name,
    );
    setField(
      "recipient_emp_id",
      resignationRecipient.recipient_emp_id ||
        defaultResignationForm.recipient_emp_id,
    );
  }, [defaultResignationForm, resignationRecipient, setField]);

  useEffect(() => {
    if (hasLoadedResignationDraft) return;
    if (resignationDraftData?.payload) {
      const loadedStep = Number(resignationDraftData.step) || 1;
      const loadedInterviewPart =
        Number(resignationDraftData.interviewPart) || 1;

      Object.entries(resignationDraftData.payload).forEach(([key, value]) => {
        if (key === "leaving_reasons" && Array.isArray(value)) {
          setField("leaving_reasons", value);
          return;
        }

        if (key === "interview_answers" && Array.isArray(value)) {
          setField("interview_answers", value);
          return;
        }

        if (key in resignationForm) {
          setField(key as keyof ResignationForm, value as never);
        }
      });
      setResignationStep(loadedStep);
      setResignationInterviewPart(loadedInterviewPart);
      lastSavedResignationDraftRef.current = JSON.stringify({
        payload: resignationDraftData.payload,
        step: loadedStep,
        interviewPart: loadedInterviewPart,
      });
    }

    setHasLoadedResignationDraft(true);
  }, [
    hasLoadedResignationDraft,
    resignationDraftData,
    resignationForm,
    setField,
  ]);

  useEffect(() => {
    if (!hasLoadedResignationDraft) return;

    const draftPayload = {
      payload: resignationForm,
      step: resignationStep,
      interviewPart: resignationInterviewPart,
    };
    const draftSignature = JSON.stringify(draftPayload);

    if (lastSavedResignationDraftRef.current === draftSignature) return;

    const timer = setTimeout(() => {
      saveResignationDraftMutation.mutate(draftPayload, {
        onSuccess: () => {
          lastSavedResignationDraftRef.current = draftSignature;
        },
      });
    }, 400);

    return () => clearTimeout(timer);
  }, [
    resignationForm,
    hasLoadedResignationDraft,
    resignationInterviewPart,
    resignationStep,
    saveResignationDraftMutation,
  ]);

  const uploadRequiredFile = async (file: File): Promise<UploadedFileMeta> => {
    const formData = new FormData();
    formData.append("requiredFiles", file);

    const result = await mutationHandler(
      axiosInterceptor.post("/api/file/upload", formData),
      "File upload failed",
    );

    const uploaded = Array.isArray(
      (result as { files?: UploadedFileMeta[] }).files,
    )
      ? (result as { files?: UploadedFileMeta[] }).files?.[0]
      : null;

    if (!uploaded?.key) {
      throw new Error("Upload succeeded but no file key was returned");
    }

    return uploaded;
  };

  const loadUploadedEndorsementObjectUrl = async (): Promise<string> => {
    const fileKey = String(resignationForm.endorsement_file_key || "").trim();

    if (!fileKey) {
      throw new Error("No uploaded endorsement file found.");
    }

    const blob = await mutationHandler(
      axiosInterceptor.get(
        `/api/file/get?filename=${encodeURIComponent(fileKey)}`,
        { responseType: "blob" },
      ),
      "Failed to retrieve uploaded endorsement file.",
    );
    revokeEndorsementObjectUrl();
    endorsementObjectUrlRef.current = window.URL.createObjectURL(blob);

    return endorsementObjectUrlRef.current;
  };

  const clearUploadedEndorsement = () => {
    revokeEndorsementObjectUrl();
    setField("endorsement_file_key", "");
    setField("endorsement_file_name", "");
    setIsEndorsementActionsOpen(false);
  };

  const validateEndorsementFile = (file: File): string => {
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    const extension = file.name.split(".").pop()?.toLowerCase() || "";
    const allowedExtensions = ["pdf", "doc", "docx"];
    const maxSizeInBytes = 10 * 1024 * 1024;

    if (
      !allowedTypes.includes(file.type) &&
      !allowedExtensions.includes(extension)
    ) {
      return "Only .doc, .docx, and .pdf files are allowed.";
    }

    if (file.size > maxSizeInBytes) {
      return "File size must be 10MB or less.";
    }

    return "";
  };

  const downloadUploadedEndorsement = async () => {
    try {
      const objectUrl = await loadUploadedEndorsementObjectUrl();
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download =
        resignationForm.endorsement_file_name || "endorsement-file";
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    } catch (error) {
      showToast(
        getErrorMessage(error, "Unable to download uploaded file."),
        "error",
      );
    }
  };

  const validateResignationStep = (step: number): string => {
    if (step === 1) {
      if (!String(resignationForm.resignation_letter || "").trim()) {
        return "Resignation letter body is required.";
      }
      return "";
    }

    if (step === 2) {
      if (
        !resignationForm.resignation_date ||
        !resignationForm.last_working_day
      ) {
        return "Resignation date and last working day are required.";
      }
      if ((resignationForm.leaving_reasons || []).length === 0) {
        return "Select at least one reason for leaving.";
      }
      if (
        (resignationForm.leaving_reasons || []).includes("Others") &&
        !String(resignationForm.leaving_reason_other || "").trim()
      ) {
        return "Please provide details for Others.";
      }
      return "";
    }

    if (step === 3) {
      const hasBlankAnswer = (resignationForm.interview_answers || []).some(
        (answer: string) => !String(answer || "").trim(),
      );
      if (hasBlankAnswer) {
        return "All 16 exit interview answers are required.";
      }
      return "";
    }

    if (step === 4) {
      if (!String(resignationForm.endorsement_file_key || "").trim()) {
        return "Upload your completed endorsement form before continuing.";
      }
      return "";
    }

    return "";
  };

  const goToNextResignationStep = async () => {
    const validationError = validateResignationStep(resignationStep);
    if (validationError) {
      setResignationWizardError(validationError);
      return;
    }

    try {
      await saveResignationDraftMutation.mutateAsync({
        payload: resignationForm,
        step: resignationStep,
        interviewPart: resignationInterviewPart,
      });
      lastSavedResignationDraftRef.current = JSON.stringify({
        payload: resignationForm,
        step: resignationStep,
        interviewPart: resignationInterviewPart,
      });
    } catch {
      // Keep the wizard usable even if draft save fails.
    }

    setResignationWizardError("");
    setResignationStep((prev) => Math.min(prev + 1, 5));
  };

  const goToPreviousResignationStep = () => {
    setResignationWizardError("");
    setResignationStep((prev) => Math.max(prev - 1, 1));
  };

  const resetResignationWizardState = () => {
    resetForm();
    setField("resignation_letter", defaultResignationForm.resignation_letter);
    setField("request_date", defaultResignationForm.request_date);
    setField("recipient_name", defaultResignationForm.recipient_name);
    setField("recipient_emp_id", defaultResignationForm.recipient_emp_id);
    setField("employee_name", defaultResignationForm.employee_name);
    setField("position", defaultResignationForm.position);
    setField("designation", defaultResignationForm.designation);
    setField("hired_date", defaultResignationForm.hired_date);
    setField("resignation_date", defaultResignationForm.resignation_date);
    setField("last_working_day", defaultResignationForm.last_working_day);
    setField("leaving_reasons", []);
    setField(
      "leaving_reason_other",
      defaultResignationForm.leaving_reason_other,
    );
    setField("interview_answers", Array(16).fill(""));
    setField(
      "endorsement_file_key",
      defaultResignationForm.endorsement_file_key,
    );
    setField(
      "endorsement_file_name",
      defaultResignationForm.endorsement_file_name,
    );
    setResignationStep(1);
    setResignationInterviewPart(1);
    setResignationWizardError("");
    setIsEndorsementActionsOpen(false);
    revokeEndorsementObjectUrl();
    lastSavedResignationDraftRef.current = JSON.stringify({
      payload: {
        ...defaultResignationForm,
        leaving_reasons: [],
        interview_answers: Array(16).fill(""),
      },
      step: 1,
      interviewPart: 1,
    });

    // Extra safeguard: clear persisted wizard storage after successful submit.
    try {
      localStorage.removeItem("resignation-form");
      const storeWithPersist = useFieldStore as typeof useFieldStore & {
        persist?: { clearStorage?: () => void };
      };
      storeWithPersist.persist?.clearStorage?.();
    } catch {
      // Ignore storage cleanup failures to keep submission flow uninterrupted.
    }
  };

  const submitResignationWizard = async () => {
    const validationError =
      validateResignationStep(1) ||
      validateResignationStep(2) ||
      validateResignationStep(3) ||
      validateResignationStep(4);

    if (validationError) {
      setResignationWizardError(validationError);
      return;
    }

    const reasons = resignationForm.leaving_reasons || [];
    const reasonSummary = reasons.includes("Others")
      ? `${reasons
          .filter((item: string) => item !== "Others")
          .join(
            ", ",
          )}; Others: ${String(resignationForm.leaving_reason_other || "").trim()}`
      : reasons.join(", ");

    const payload: SubmitResignationPayload = {
      emp_id: currentUser?.emp_id,
      resignation_type: "Voluntary Resignation",
      effective_date: resignationForm.last_working_day,
      reason: reasonSummary,
      resignation_letter: resignationForm.resignation_letter,
      recipient_name: resignationForm.recipient_name,
      recipient_emp_id: resignationForm.recipient_emp_id || null,
      resignation_date: resignationForm.resignation_date,
      last_working_day: resignationForm.last_working_day,
      leaving_reasons: resignationForm.leaving_reasons,
      leaving_reason_other: resignationForm.leaving_reason_other,
      exit_interview_answers: resignationForm.interview_answers,
      endorsement_file_key: resignationForm.endorsement_file_key,
    };

    let usedExternalMutation = false;
    const externalMutation = fileResignationMutation as
      | {
          mutateAsync?: (payload: SubmitResignationPayload) => Promise<unknown>;
          mutate?: (
            payload: SubmitResignationPayload,
            options?: {
              onSuccess?: () => void;
              onError?: (error: unknown) => void;
            },
          ) => void;
        }
      | undefined;

    try {
      // React Query mutation path from parent
      if (externalMutation?.mutateAsync) {
        usedExternalMutation = true;
        await externalMutation.mutateAsync(payload);
      } else if (externalMutation?.mutate) {
        usedExternalMutation = true;
        await new Promise<void>((resolve, reject) => {
          externalMutation.mutate?.(payload, {
            onSuccess: () => resolve(),
            onError: (mutationError: unknown) => reject(mutationError),
          });
        });
      } else {
        // Direct axios fallback
        await mutationHandler(
          axiosInterceptor.post("/api/employees/resignations", payload),
          "Failed to submit resignation",
        );
      }

      if (!usedExternalMutation) {
        showToast("Resignation filed successfully.");
      }

      resetResignationWizardState();
      setApplicationModalOpen(false);
    } catch (error) {
      showToast(
        getErrorMessage(error, "Failed to submit resignation"),
        "error",
      );
    }
  };
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-gray-500">
              Resignation Progress
            </p>
            <p className="mt-1 text-sm font-semibold text-gray-900">
              Step {resignationStep} of {resignationStepLabels.length}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-gray-500">
              {resignationStepLabels[resignationStep - 1]}
            </p>
            <p className="text-sm font-bold text-red-600">
              {Math.round(
                (resignationStep / resignationStepLabels.length) * 100,
              )}
              %
            </p>
          </div>
        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-linear-to-r from-red-500 via-rose-500 to-orange-400 transition-all duration-300"
            style={{
              width: `${Math.max(8, (resignationStep / resignationStepLabels.length) * 100)}%`,
            }}
          />
        </div>
      </div>

      {resignationWizardError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {resignationWizardError}
        </div>
      )}

      {resignationStep === 1 && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
              Current Date
            </label>
            <input
              type="date"
              value={resignationForm.request_date}
              disabled
              className="cursor-not-allowed rounded-md border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-600"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
              Recipient (Supervisor)
            </label>
            <input
              type="text"
              value={resignationForm.recipient_name}
              disabled
              className="cursor-not-allowed rounded-md border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-600"
            />
          </div>
          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
              Resignation Letter Body
            </label>
            <textarea
              rows={8}
              value={resignationForm.resignation_letter}
              onChange={(e) => setField("resignation_letter", e.target.value)}
              placeholder="Write your resignation letter here..."
              className="w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>
      )}

      {resignationStep === 2 && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
              Name
            </label>
            <input
              type="text"
              value={resignationForm.employee_name}
              disabled
              className="cursor-not-allowed rounded-md border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-600"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
              Position
            </label>
            <input
              type="text"
              value={resignationForm.position}
              disabled
              className="cursor-not-allowed rounded-md border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-600"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
              Department / Designation
            </label>
            <input
              type="text"
              value={resignationForm.designation}
              disabled
              className="cursor-not-allowed rounded-md border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-600"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
              Date of Joining
            </label>
            <input
              type="date"
              value={resignationForm.hired_date}
              disabled
              className="cursor-not-allowed rounded-md border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-600"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
              Resignation Date
            </label>
            <input
              type="date"
              value={resignationForm.resignation_date}
              onChange={(e) => setField("resignation_date", e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
              Last Working Day
            </label>
            <input
              type="date"
              value={resignationForm.last_working_day}
              onChange={(e) => setField("last_working_day", e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div className="md:col-span-2">
            <p className="m-0 mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-500">
              Reason for Leaving (Select one or more)
            </p>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {resignationReasonOptions.map((reasonOption) => {
                const checked = (
                  resignationForm.leaving_reasons || []
                ).includes(reasonOption);
                return (
                  <label
                    key={reasonOption}
                    className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setArrayField("leaving_reasons", reasonOption)
                      }
                    />
                    <span>{reasonOption}</span>
                  </label>
                );
              })}
            </div>
            {(resignationForm.leaving_reasons || []).includes("Others") && (
              <input
                type="text"
                value={resignationForm.leaving_reason_other}
                onChange={(e) =>
                  setField("leaving_reason_other", e.target.value)
                }
                placeholder="Specify other reason"
                className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500"
              />
            )}
          </div>
        </div>
      )}

      {resignationStep === 3 && (
        <div className="space-y-3">
          <div className="rounded-md border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm text-indigo-900">
            <p className="m-0 font-semibold">Instructions:</p>
            <p className="m-0 mt-1">
              Please answer each question honestly. Your responses will help
              Human Resources improve services and employee experience.
            </p>
          </div>

          <div className="flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600">
            <span>Exit Interview Part {resignationInterviewPart} of 2</span>
            <span>Q{resignationInterviewPart === 1 ? "1-8" : "9-16"}</span>
          </div>

          <div className="space-y-3">
            {exitInterviewQuestions
              .slice(
                resignationInterviewPart === 1 ? 0 : 8,
                resignationInterviewPart === 1 ? 8 : 16,
              )
              .map((question, idx) => {
                const questionIndex =
                  (resignationInterviewPart === 1 ? 0 : 8) + idx;
                return (
                  <div key={question} className="space-y-1">
                    <label className="block text-xs font-bold text-gray-600">
                      {questionIndex + 1}. {question}
                    </label>
                    <textarea
                      rows={3}
                      value={
                        resignationForm.interview_answers?.[questionIndex] || ""
                      }
                      onChange={(e) =>
                        setArrayField(
                          "interview_answers",
                          e.target.value,
                          questionIndex,
                        )
                      }
                      className="w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                );
              })}
          </div>

          <div className="flex justify-end">
            {resignationInterviewPart === 1 ? (
              <button
                type="button"
                onClick={() => setResignationInterviewPart(2)}
                className="cursor-pointer rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700"
              >
                Proceed to Part 2
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setResignationInterviewPart(1)}
                className="cursor-pointer rounded-lg bg-gray-200 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-300"
              >
                Back to Part 1
              </button>
            )}
          </div>
        </div>
      )}

      {resignationStep === 4 && (
        <div className="space-y-3">
          <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
            Download the endorsement form, complete it offline, then upload the
            signed copy.
          </div>
          <a
            href="/forms/Resignee_Endorsement-Form.docx"
            download
            className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-bold text-white no-underline hover:bg-blue-700"
          >
            Download Endorsement Form (DOC)
          </a>

          <div className="rounded-md border border-gray-200 bg-white p-3">
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">
              Upload Completed Endorsement Form
            </label>
            <input
              type="file"
              accept=".doc,.docx,.pdf"
              disabled={isUploadingEndorsement}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                // setField("endorsement_file", file);
                const fileError = validateEndorsementFile(file);

                if (fileError) {
                  showToast(fileError, "error");
                  e.target.value = "";
                  return;
                }

                setIsUploadingEndorsement(true);
                try {
                  const uploaded = await uploadRequiredFile(file);
                  setField("endorsement_file_key", uploaded.key);
                  setField(
                    "endorsement_file_name",
                    uploaded.fileName || file.name,
                  );
                  setResignationWizardError("");
                  showToast("Endorsement form uploaded.");
                } catch (error) {
                  showToast(
                    getErrorMessage(
                      error,
                      "Failed to upload endorsement form.",
                    ),
                    "error",
                  );
                } finally {
                  setIsUploadingEndorsement(false);
                  e.target.value = "";
                }
              }}
              className="block w-full text-sm"
            />
            {resignationForm.endorsement_file_key && (
              <div className="mt-2 space-y-2">
                <p className="text-xs font-medium text-emerald-700">
                  Uploaded: {resignationForm.endorsement_file_name}
                </p>
                <button
                  type="button"
                  onClick={() => setIsEndorsementActionsOpen(true)}
                  className="rounded-md border border-indigo-200 bg-indigo-100 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-indigo-700 hover:bg-indigo-200"
                >
                  View Uploaded File
                </button>
                <button
                  type="button"
                  onClick={clearUploadedEndorsement}
                  className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-red-700 hover:bg-red-100"
                >
                  Remove File
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {isEndorsementActionsOpen && (
        <div className="fixed inset-0 z-72 flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-4 shadow-xl">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="m-0 text-sm font-bold text-gray-900">
                  Uploaded Endorsement File
                </p>
                <p className="m-0 mt-1 text-xs text-gray-600">
                  {resignationForm.endorsement_file_name || "endorsement-file"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEndorsementActionsOpen(false)}
                className="rounded-md border-0 bg-transparent px-2 py-1 text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
            </div>

            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={downloadUploadedEndorsement}
                className="rounded-md border border-blue-200 bg-blue-100 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-blue-700 hover:bg-blue-200"
              >
                Download File
              </button>
            </div>
          </div>
        </div>
      )}

      {resignationStep === 5 && (
        <div className="space-y-3">
          <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
            Review your details below, then click Submit Application for
            supervisor approval.
          </div>
          <div className="rounded-md border border-gray-200 bg-white p-3 text-sm">
            <p className="m-0">
              <span className="font-semibold">Recipient:</span>{" "}
              {resignationForm.recipient_name}
            </p>
            <p className="m-0 mt-1">
              <span className="font-semibold">Resignation Date:</span>{" "}
              {resignationForm.resignation_date || "-"}
            </p>
            <p className="m-0 mt-1">
              <span className="font-semibold">Last Working Day:</span>{" "}
              {resignationForm.last_working_day || "-"}
            </p>
            <p className="m-0 mt-1">
              <span className="font-semibold">Reasons Selected:</span>{" "}
              {(resignationForm.leaving_reasons || []).join(", ") || "-"}
            </p>
            <p className="m-0 mt-1">
              <span className="font-semibold">Endorsement:</span>{" "}
              {resignationForm.endorsement_file_name || "Not uploaded"}
            </p>
          </div>
        </div>
      )}

      <div className="mt-2 flex justify-between gap-2">
        <button
          type="button"
          onClick={() => {
            if (resignationStep === 1) {
              setApplicationModalOpen(false);
            } else {
              goToPreviousResignationStep();
            }
          }}
          className="cursor-pointer rounded-lg bg-gray-200 px-5 py-2 text-sm font-bold text-gray-700 hover:bg-gray-300"
        >
          {resignationStep === 1 ? "Cancel" : "Back"}
        </button>

        {resignationStep < 5 ? (
          <button
            type="button"
            onClick={goToNextResignationStep}
            className="cursor-pointer rounded-lg bg-red-600 px-5 py-2 text-sm font-bold text-white hover:bg-red-700"
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            disabled={fileResignationMutation?.isPending}
            onClick={submitResignationWizard}
            className="cursor-pointer rounded-lg bg-red-600 px-5 py-2 text-sm font-bold text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
          >
            Submit Application
          </button>
        )}
      </div>
    </div>
  );
}
