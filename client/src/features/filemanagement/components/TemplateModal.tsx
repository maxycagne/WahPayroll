import React from "react";
import { Upload, Download, Trash2 } from "lucide-react";
import { FileTemplate } from "../types";
import { formatDate } from "../utils";

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  canManageTemplates: boolean;
  templateTitle: string;
  setTemplateTitle: (value: string) => void;
  templateCategory: string;
  setTemplateCategory: (value: string) => void;
  isUploadingTemplate: boolean;
  onUploadClick: () => void;
  isLoadingTemplates: boolean;
  uploadedTemplates: FileTemplate[];
  onDownload: (template: FileTemplate) => void;
  onReplace: (template: FileTemplate) => void;
  onDelete: (template: FileTemplate) => void;
  isReplacingTemplate: boolean;
}

export const TemplateModal: React.FC<TemplateModalProps> = ({
  isOpen,
  onClose,
  canManageTemplates,
  templateTitle,
  setTemplateTitle,
  templateCategory,
  setTemplateCategory,
  isUploadingTemplate,
  onUploadClick,
  isLoadingTemplates,
  uploadedTemplates,
  onDownload,
  onReplace,
  onDelete,
  isReplacingTemplate,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
      role="dialog"
      aria-modal="true"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 px-5 py-4">
          <div>
            <p className="m-0 text-xs font-bold uppercase tracking-[0.24em] text-gray-500 dark:text-gray-400">
              Templates
            </p>
            <h2 className="m-0 mt-1 text-lg font-bold text-gray-900 dark:text-gray-100">
              Downloadable Templates
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border-0 bg-transparent px-2 py-1 text-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer"
          >
            &times;
          </button>
        </div>

        <div className="max-h-[72vh] overflow-auto p-5">
          {canManageTemplates && (
            <div className="mb-5 rounded-2xl border border-slate-200 dark:border-gray-800 bg-slate-50 dark:bg-gray-800/30 p-4">
              <p className="m-0 text-sm font-bold text-slate-900 dark:text-gray-100">
                Manage Uploaded Templates
              </p>
              <p className="m-0 mt-1 text-sm text-slate-600 dark:text-gray-400">
                Upload shared templates for all users in the file management
                portal.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={templateTitle}
                  onChange={(event) => setTemplateTitle(event.target.value)}
                  placeholder="Template title"
                  className="min-w-[220px] rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-sky-500"
                />
                <input
                  type="text"
                  value={templateCategory}
                  onChange={(event) =>
                    setTemplateCategory(event.target.value)
                  }
                  placeholder="Category (optional)"
                  className="min-w-[220px] rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-sky-500"
                />
                <button
                  type="button"
                  disabled={isUploadingTemplate}
                  onClick={onUploadClick}
                  className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Upload className="h-4 w-4" />
                  {isUploadingTemplate ? "Uploading..." : "Upload Template"}
                </button>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 dark:border-gray-800 bg-slate-50 dark:bg-gray-800/30 p-4 text-sm text-slate-700 dark:text-gray-400">
            Resignation documents are generated dynamically per application in
            File Management. This section is for uploaded shared templates.
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
            <p className="m-0 text-sm font-bold text-slate-900 dark:text-gray-100">
              Uploaded Templates
            </p>
            <p className="m-0 mt-1 text-sm text-slate-600 dark:text-gray-400">
              Download shared templates uploaded by Admin/HR.
            </p>

            {isLoadingTemplates ? (
              <p className="m-0 mt-3 text-sm text-slate-500">
                Loading templates...
              </p>
            ) : uploadedTemplates.length === 0 ? (
              <p className="m-0 mt-3 text-sm text-slate-500">
                No uploaded templates yet.
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                {uploadedTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-gray-800 bg-slate-50 dark:bg-gray-800/50 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="m-0 truncate text-sm font-semibold text-slate-900 dark:text-gray-100">
                        {template.title}
                      </p>
                      <p className="m-0 mt-0.5 text-xs text-slate-500 dark:text-gray-400">
                        {template.category || "General"} •{" "}
                        {template.original_name} •{" "}
                        {formatDate(template.created_at)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => onDownload(template)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </button>
                      {canManageTemplates && (
                        <button
                          type="button"
                          disabled={isReplacingTemplate}
                          onClick={() => onReplace(template)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-2 text-xs font-bold uppercase tracking-wide text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Upload className="h-3.5 w-3.5" />
                          {isReplacingTemplate ? "Replacing..." : "Replace"}
                        </button>
                      )}
                      {canManageTemplates && (
                        <button
                          type="button"
                          onClick={() => onDelete(template)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-900/30 px-3 py-2 text-xs font-bold uppercase tracking-wide text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
