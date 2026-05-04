import { Employee, FileDocument } from "../types";

export function formatDate(value: string | number | Date | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("default", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(value: string | number | Date | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("default", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function getDisplayName(employee: Partial<Employee>): string {
  const firstName = String(employee?.first_name || "").trim();
  const lastName = String(employee?.last_name || "").trim();
  return `${firstName} ${lastName}`.trim() || employee?.emp_id || "Employee";
}

export function normalizeString(value: string | null | undefined): string {
  return String(value || "")
    .trim()
    .toLowerCase();
}

export function isDocOrDocxFile(file: Partial<FileDocument>): boolean {
  const target = String(file?.file_name || file?.file_key || "").toLowerCase();
  return /\.(doc|docx)(?:$|[?#])/.test(target);
}

export function isPreviewSupported(file: Partial<FileDocument> | null | undefined): boolean {
  if (!file) return false;
  if (file.source === "generated") return true;
  if (!file.download_url) return false;
  return !isDocOrDocxFile(file);
}

export function buildDownloadBlobUrl(file: Partial<FileDocument> | { file_name: string; file_type: string }, blob: Blob): void {
  const blobUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = blobUrl;
  anchor.download = (file as FileDocument).file_name || (file as any).file_type || "download";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(blobUrl);
}

export const RESIGNATION_REASON_OPTIONS = [
  "Family and/or personal reasons",
  "Better career opportunity",
  "Pregnancy",
  "Poor Health/Physical Disability",
  "Relocation to another City/Country",
  "Termination",
  "Dissatisfaction with salary/allowances",
  "Dissatisfaction with the type of work",
  "Conflict with other employees/Supervisor/Manager",
];

export const formatDocDate = (value: string | number | Date | null | undefined): string => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
};
