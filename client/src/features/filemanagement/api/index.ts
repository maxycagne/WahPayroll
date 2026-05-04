import axiosInterceptor from "@/hooks/interceptor";
import { mutationHandler } from "@/features/leave/hooks/createMutationHandler";
import { FileInventory, FileTemplate } from "../types";

export const getFileInventory = async (): Promise<FileInventory> => {
  return mutationHandler(
    axiosInterceptor.get("/api/employees/file-management"),
    "Failed to load file inventory",
  );
};

export const getFileTemplates = async (): Promise<FileTemplate[]> => {
  const payload = await mutationHandler(
    axiosInterceptor.get("/api/employees/file-templates"),
    "Failed to load templates",
  );
  return Array.isArray(payload) ? payload : [];
};

export const downloadTemplate = async (
  templateId: string | number,
): Promise<string> => {
  const res = await mutationHandler(
    axiosInterceptor.get(
      `/api/employees/file-templates/${templateId}/download`,
    ),
    "Failed to download template",
  );
  return res.download_url;
};

export const deleteTemplate = async (
  templateId: string | number,
): Promise<void> => {
  return mutationHandler(
    axiosInterceptor.delete(`/api/employees/file-templates/${templateId}`),
    "Failed to delete template",
  );
};

export const uploadTemplate = async (payload: FormData): Promise<any> => {
  return mutationHandler(
    axiosInterceptor.post("/api/employees/file-templates", payload),
    "Failed to upload template",
  );
};

export const uploadFile = async (
  payload: FormData,
): Promise<{ files: { key: string }[] }> => {
  return mutationHandler(
    axiosInterceptor.post("/api/file/upload", payload),
    "File upload failed",
  );
};

export const replaceFile = async (
  recordId: string | number,
  data: { file_field: string; file_key: string; old_file_key?: string },
): Promise<void> => {
  return mutationHandler(
    axiosInterceptor.put(`/api/employees/resignations/${recordId}/file`, data),
    "Failed to replace file",
  );
};

export const removeFile = async (
  recordId: string | number,
  data: { file_field: string; old_file_key?: string },
): Promise<void> => {
  return mutationHandler(
    axiosInterceptor.delete(`/api/employees/resignations/${recordId}/file`, {
      data,
    }),
    "Failed to remove file",
  );
};

export const removeProfilePhoto = async (empId: string): Promise<void> => {
  return mutationHandler(
    axiosInterceptor.delete(`/api/employees/employees/${empId}/photo`),
    "Failed to remove profile photo",
  );
};

export const downloadFile = async (url: string): Promise<Blob> => {
  return mutationHandler(
    axiosInterceptor.get(url, { responseType: "blob" }),
    "Failed to download file",
  );
};
export const archiveFileRecord = async (
  source: string,
  recordId: string | number,
  isArchived: boolean,
  fileType?: string,
): Promise<void> => {
  return mutationHandler(
    axiosInterceptor.put(`/api/employees/file-management/archive/${source}/${recordId}`, {
      is_archived: isArchived,
      file_type: fileType,
    }),
    `Failed to ${isArchived ? "archive" : "unarchive"} file`,
  );
};

export const archiveFileTemplate = async (
  templateId: string | number,
  isArchived: boolean,
): Promise<void> => {
  return mutationHandler(
    axiosInterceptor.put(`/api/employees/file-templates/${templateId}/archive`, {
      is_archived: isArchived,
    }),
    `Failed to ${isArchived ? "archive" : "unarchive"} template`,
  );
};
export const deleteFileRecord = async (
  source: string,
  recordId: string | number,
): Promise<void> => {
  return mutationHandler(
    axiosInterceptor.delete(`/api/employees/file-management/record/${source}/${recordId}`),
    "Failed to delete record permanently",
  );
};

export interface TemplateActivityEntry {
  id: number;
  template_id: number | null;
  template_title: string | null;
  action: string;
  performed_by: string | null;
  performed_by_name: string | null;
  details: string | null;
  created_at: string;
}

export const getTemplateActivityLog = async (): Promise<TemplateActivityEntry[]> => {
  const payload = await mutationHandler(
    axiosInterceptor.get("/api/employees/file-templates/activity-log"),
    "Failed to load template activity log",
  );
  return Array.isArray(payload) ? payload : [];
};

export interface FileActivityEntry {
  id: number;
  record_id: string | null;
  source: string | null;
  file_type: string | null;
  target_employee_name: string | null;
  file_name: string | null;
  action: string;
  performed_by: string | null;
  performed_by_name: string | null;
  details: string | null;
  created_at: string;
}

export const getFileActivityLog = async (): Promise<FileActivityEntry[]> => {
  const payload = await mutationHandler(
    axiosInterceptor.get("/api/employees/file-management/activity-log"),
    "Failed to load file activity log",
  );
  return Array.isArray(payload) ? payload : [];
};
