import { useState, useRef } from "react";
import { pdf } from "@react-pdf/renderer";
import React from "react";
import { downloadFile, uploadFile, replaceFile, removeFile, removeProfilePhoto } from "../api";
import { 
  isPreviewSupported, 
  buildDownloadBlobUrl,
  RESIGNATION_REASON_OPTIONS,
  normalizeString,
  formatDocDate
} from "../utils";
import { FileDocument } from "../types";

// PDF Templates
import NDADocument from "@/components/pdfTemps/NDADocument.jsx";
import ResignationFormDocument from "@/components/pdfTemps/ResignationFormDoc.jsx";
import ExitClearanceFormDocument from "@/components/pdfTemps/ExitClearanceForm.jsx";
import ExitInterviewFormDocument from "@/components/pdfTemps/ExitInterviewForm.jsx";
import ResignationLetterDoc from "@/components/pdfTemps/ResignationLetterDoc.jsx";

export const useFileOperations = (showToast: (msg: string, type?: string) => void, refetch: () => void) => {
  const [isReplacing, setIsReplacing] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [replaceTarget, setReplaceTarget] = useState<FileDocument | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const buildGeneratedDocument = (file: FileDocument) => {
    const data = file.document_data || {};
    const employeeName = String(data.employee_name || "").trim() || file.employee_name || "Employee";
    const interviewAnswers = Array.isArray(data.exit_interview_answers) ? data.exit_interview_answers : [];
    const checkedReasons = (Array.isArray(data.leaving_reasons) ? data.leaving_reasons : [])
      .map((reason: string) =>
        RESIGNATION_REASON_OPTIONS.findIndex((option) => normalizeString(option) === normalizeString(reason))
      )
      .filter((index) => index >= 0);

    switch (file.template_type) {
      case "resignation_letter":
        return (
          <ResignationLetterDoc
            employeeName={employeeName}
            recipientName={data.recipient_name || ""}
            resignationDate={data.resignation_date || data.generated_at || ""}
            lastWorkingDay={data.last_working_day || ""}
            letterBody={data.resignation_letter || ""}
            position={data.position || ""}
          />
        );
      case "resignation_form":
        return (
          <ResignationFormDocument
            name={employeeName}
            position={data.position || ""}
            department={data.designation || ""}
            dateOfJoining={formatDocDate(data.hired_date)}
            resignationDate={formatDocDate(data.resignation_date)}
            lastWorkingDay={formatDocDate(data.last_working_day)}
            checkedReasons={checkedReasons}
            otherReason={data.leaving_reason_other || ""}
            employeeSignDate={formatDocDate(data.resignation_date)}
            employeeSignName={employeeName}
            supervisorSignDate=""
            supervisorSignName={data.recipient_name || ""}
          />
        );
      case "exit_interview":
        return (
          <ExitInterviewFormDocument
            answers={interviewAnswers}
            name={employeeName}
            position={data.position || ""}
            date={formatDocDate(data.resignation_date)}
          />
        );
      case "exit_clearance":
        return (
          <ExitClearanceFormDocument
            employeeNumber={data.emp_id || file.emp_id || ""}
            employeeName={employeeName}
            supervisorName={data.recipient_name || ""}
            department={data.designation || ""}
            dateOfHire={formatDocDate(data.hired_date)}
            lastWorkingDay={formatDocDate(data.last_working_day)}
            effectivityDate={formatDocDate(data.effective_date)}
          />
        );
      case "nda":
        return (
          <NDADocument
            employeeName={employeeName}
            employeeId={data.emp_id || file.emp_id || ""}
            employeeAddress={data.employee_address || ""}
            witness1Name="Ms. Jhuvy C. Dizon"
            witness1Title="Admin & Operations Officer"
            witness2Name="Robert Michael Martinez"
            witness2Title="Supervising Partner for Network and System"
          />
        );
      default:
        return null;
    }
  };

  const handlePreview = async (file: FileDocument) => {
    try {
      if (!isPreviewSupported(file)) {
        throw new Error("Preview is only available for PDF and supported file types");
      }

      if (file.source === "generated") {
        const documentNode = buildGeneratedDocument(file);
        if (!documentNode) throw new Error("Document preview is not available");
        const blob = await pdf(documentNode).toBlob();
        const previewUrl = window.URL.createObjectURL(blob);
        window.open(previewUrl, "_blank", "noopener,noreferrer");
        return;
      }

      if (file.download_url) window.open(file.download_url, "_blank", "noopener,noreferrer");
    } catch (error: any) {
      showToast(error.message || "Failed to preview file", "error");
    }
  };

  const handleDownload = async (file: FileDocument) => {
    try {
      if (file.source === "generated") {
        const documentNode = buildGeneratedDocument(file);
        if (!documentNode) throw new Error("Document generation failed");
        const blob = await pdf(documentNode).toBlob();
        buildDownloadBlobUrl(file, blob);
        return;
      }

      if (file.download_url) {
        const blob = await downloadFile(file.download_url);
        buildDownloadBlobUrl(file, blob);
      }
    } catch (error: any) {
      showToast(error.message || "Failed to download file", "error");
    }
  };

  const openReplacePicker = (file: FileDocument) => {
    setReplaceTarget(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleReplaceChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !replaceTarget) return;

    setIsReplacing(true);
    try {
      if (replaceTarget.source === "profile") {
        showToast("Profile photo replacement is not supported.", "error");
      } else {
        const uploadPayload = new FormData();
        uploadPayload.append("requiredFiles", file);

        const uploadResult = await uploadFile(uploadPayload);
        const uploaded = Array.isArray(uploadResult.files) ? uploadResult.files[0] : null;

        if (!uploaded?.key) throw new Error("Upload succeeded but no file key was returned");

        await replaceFile(replaceTarget.record_id!, {
          file_field: replaceTarget.file_field!,
          file_key: uploaded.key,
          old_file_key: replaceTarget.file_key,
        });

        showToast("File replaced successfully.");
        refetch();
      }
    } catch (error: any) {
      showToast(error.message || "Failed to replace file", "error");
    } finally {
      setIsReplacing(false);
      setReplaceTarget(null);
      if (event.target) event.target.value = "";
    }
  };

  const handleRemove = async (file: FileDocument) => {
    if (!file?.replaceable) {
      showToast("This file cannot be removed.", "error");
      return;
    }

    const fileLabel = file.file_type || file.file_name || "this file";
    const shouldProceed = window.confirm(`Remove ${fileLabel}? This action cannot be undone.`);
    if (!shouldProceed) return;

    setIsRemoving(true);
    try {
      if (file.source === "profile") {
        await removeProfilePhoto(file.emp_id);
      } else {
        await removeFile(file.record_id!, {
          file_field: file.file_field!,
          old_file_key: file.file_key,
        });
      }

      showToast("File removed successfully.");
      refetch();
    } catch (error: any) {
      showToast(error.message || "Failed to remove file", "error");
    } finally {
      setIsRemoving(false);
    }
  };

  return {
    isReplacing,
    isRemoving,
    fileInputRef,
    handlePreview,
    handleDownload,
    openReplacePicker,
    handleReplaceChange,
    handleRemove,
    isArchiving,
    handleArchive: async (file: FileDocument) => {
      const currentStatus = file.is_archived || false;
      const newStatus = !currentStatus;

      if (file.source === "profile") {
        showToast("Profile photos cannot be archived.", "error");
        return;
      }

      let source = file.source;
      if (source === "generated") {
        source = file.template_type === "nda" ? "employee" : "resignation";
      }

      if (!["resignation", "leave", "employee", "profile"].includes(source)) {
        showToast("This file type cannot be archived directly.", "error");
        return;
      }

      const shouldProceed = window.confirm(
        `${newStatus ? "Archive" : "Unarchive"} this file and its associated record?`,
      );
      if (!shouldProceed) return;

      setIsArchiving(true);
      try {
        const { archiveFileRecord } = await import("../api");
        console.log(`[FileOperations] Archiving record. Source: ${source}, ID: ${file.record_id}, New Status: ${newStatus}`);
        await archiveFileRecord(source, file.record_id!, newStatus);
        showToast(`File ${newStatus ? "archived" : "unarchived"} successfully.`);
        await refetch();
      } catch (error: any) {
        showToast(error.message || "Failed to archive file", "error");
      } finally {
        setIsArchiving(false);
      }
    },
    isDeleting: isRemoving, // Reuse the loading state or add a new one
    handlePermanentDelete: async (file: FileDocument) => {
      let source = file.source;
      if (source === "generated") {
        source = file.template_type === "nda" ? "employee" : "resignation";
      }

      const shouldProceed = window.confirm(
        "PERMANENTLY DELETE this entire record? This action is IRREVERSIBLE and will remove the data from the database.",
      );
      if (!shouldProceed) return;

      setIsRemoving(true);
      try {
        const { deleteFileRecord } = await import("../api");
        await deleteFileRecord(source, file.record_id!);
        showToast("Record permanently deleted.");
        await refetch();
      } catch (error: any) {
        showToast(error.message || "Failed to delete record", "error");
      } finally {
        setIsRemoving(false);
      }
    },
  };
};
