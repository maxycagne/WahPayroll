import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { getFileTemplates, downloadTemplate, deleteTemplate, uploadTemplate } from "../api";
import { buildDownloadBlobUrl } from "../utils";
import { FileTemplate } from "../types";

export const useFileTemplates = (role: string, showToast: (msg: string, type?: string) => void) => {
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isUploadingTemplate, setIsUploadingTemplate] = useState(false);
  const [isReplacingTemplate, setIsReplacingTemplate] = useState(false);
  const [templateTitle, setTemplateTitle] = useState("");
  const [templateCategory, setTemplateCategory] = useState("");
  const [templateReplaceTarget, setTemplateReplaceTarget] = useState<FileTemplate | null>(null);

  const templateInputRef = useRef<HTMLInputElement>(null);
  const templateReplaceInputRef = useRef<HTMLInputElement>(null);

  const {
    data: uploadedTemplates = [],
    refetch: refetchTemplates,
    isLoading: isLoadingTemplates,
  } = useQuery({
    queryKey: ["file-templates", role],
    queryFn: getFileTemplates,
  });

  const downloadUploadedTemplate = async (template: FileTemplate) => {
    try {
      const downloadUrl = await downloadTemplate(template.id);
      if (downloadUrl) {
        window.open(downloadUrl, "_blank", "noopener,noreferrer");
      }
    } catch (error: any) {
      showToast(error.message || "Failed to download template", "error");
    }
  };

  const handleDeleteTemplate = async (template: FileTemplate) => {
    try {
      await deleteTemplate(template.id);
      showToast("Template deleted successfully.");
      await refetchTemplates();
    } catch (error: any) {
      showToast(error.message || "Failed to delete template", "error");
    }
  };

  const openTemplateReplacePicker = (template: FileTemplate) => {
    setTemplateReplaceTarget(template);
    if (templateReplaceInputRef.current) {
      templateReplaceInputRef.current.value = "";
      templateReplaceInputRef.current.click();
    }
  };

  const handleTemplateReplaceChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !templateReplaceTarget) return;

    setIsReplacingTemplate(true);
    try {
      const uploadPayload = new FormData();
      uploadPayload.append("template_file", file);
      uploadPayload.append("title", templateReplaceTarget.title || "");
      uploadPayload.append("category", templateReplaceTarget.category || "");

      await uploadTemplate(uploadPayload);
      await deleteTemplate(templateReplaceTarget.id);

      showToast("Template replaced successfully.");
      await refetchTemplates();
    } catch (error: any) {
      showToast(error.message || "Failed to replace template", "error");
    } finally {
      setIsReplacingTemplate(false);
      setTemplateReplaceTarget(null);
      if (event.target) event.target.value = "";
    }
  };

  const handleTemplateUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingTemplate(true);
    try {
      const payload = new FormData();
      payload.append("template_file", file);
      payload.append("title", templateTitle);
      payload.append("category", templateCategory);

      await uploadTemplate(payload);

      setTemplateTitle("");
      setTemplateCategory("");
      showToast("Template uploaded successfully.");
      await refetchTemplates();
    } catch (error: any) {
      showToast(error.message || "Failed to upload template", "error");
    } finally {
      setIsUploadingTemplate(false);
      if (event.target) event.target.value = "";
    }
  };

  return {
    isTemplatesOpen,
    setIsTemplatesOpen,
    isUploadingTemplate,
    isReplacingTemplate,
    templateTitle,
    setTemplateTitle,
    templateCategory,
    setTemplateCategory,
    templateInputRef,
    templateReplaceInputRef,
    uploadedTemplates,
    isLoadingTemplates,
    downloadUploadedTemplate,
    handleDeleteTemplate,
    openTemplateReplacePicker,
    handleTemplateReplaceChange,
    handleTemplateUpload,
  };
};
