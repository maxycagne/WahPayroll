import React from "react";
import { X, Eye, ArrowDownToLine, Upload, Trash2, Archive } from "lucide-react";
import { Employee, FileDocument } from "../types";
import { getDisplayName, formatDate, isPreviewSupported } from "../utils";

interface EmployeeFilesModalProps {
  employee: Employee | null;
  onClose: () => void;
  modalSourceFilter: string;
  setModalSourceFilter: (filter: string) => void;
  modalSourceCounts: { all: number; generated: number; resignation: number };
  modalFileGroups: any[];
  onPreview: (file: FileDocument) => void;
  onDownload: (file: FileDocument) => void;
  onReplace: (file: FileDocument) => void;
  onRemove: (file: FileDocument) => void;
  onArchive: (file: FileDocument) => void;
  onDelete: (file: FileDocument) => void;
  showArchived: boolean;
  canArchive: boolean;
}

export const EmployeeFilesModal: React.FC<EmployeeFilesModalProps> = ({
  employee,
  onClose,
  modalSourceFilter,
  setModalSourceFilter,
  modalSourceCounts,
  modalFileGroups,
  onPreview,
  onDownload,
  onReplace,
  onRemove,
  onArchive,
  onDelete,
  showArchived,
  canArchive,
}) => {
  if (!employee) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
      <div className="flex h-[88vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-gray-800 bg-slate-50 dark:bg-gray-800/50 px-5 py-4">
          <div>
            <p className="m-0 text-xs font-bold uppercase tracking-[0.24em] text-slate-500 dark:text-gray-400">
              Employee Files
            </p>
            <h2 className="m-0 flex items-center gap-3 text-lg font-bold text-gray-900 dark:text-white">
              Documents for {employee.display_name || getDisplayName(employee)}
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white ${
                showArchived ? "bg-amber-500" : "bg-sky-500"
              }`}>
                {showArchived ? "Archive" : "Active"}
              </span>
            </h2>
            <p className="m-0 mt-1 text-sm text-slate-600 dark:text-gray-400">
              {employee.position || "-"} • {employee.designation || "-"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-semibold text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700 cursor-pointer"
          >
            <X className="h-4 w-4" />
            Close
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto bg-white dark:bg-gray-900">
          <div className="min-h-0 overflow-auto">
            <div className="sticky top-0 z-10 border-b border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3">
              <div className="flex flex-wrap gap-2">
                {[
                  { key: "all", label: "All", count: modalSourceCounts.all },
                  {
                    key: "generated",
                    label: "Generated",
                    count: modalSourceCounts.generated,
                  },
                  {
                    key: "resignation",
                    label: "Resignation",
                    count: modalSourceCounts.resignation,
                  },
                ].map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setModalSourceFilter(option.key)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${
                      modalSourceFilter === option.key
                        ? "bg-slate-900 dark:bg-gray-100 text-white dark:text-gray-900"
                        : "bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-gray-700"
                    }`}
                  >
                    {option.label} ({option.count})
                  </button>
                ))}
              </div>
            </div>

            {modalFileGroups.length === 0 ? (
              <div className="p-8 text-center text-slate-600">
                <p className="m-0 text-sm font-semibold text-slate-800">
                  No files in this source filter.
                </p>
              </div>
            ) : (
              <div className="space-y-3 p-4">
                {modalFileGroups.map((group) => (
                  <section
                    key={group.id}
                    className="rounded-xl border border-slate-200 dark:border-gray-800 bg-slate-50 dark:bg-gray-800/40 p-3"
                  >
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <p className="m-0 text-xs font-bold uppercase tracking-wide text-slate-700 dark:text-gray-300">
                        {group.requestType} Application #{group.id}
                      </p>
                      <span className="rounded-full bg-white dark:bg-gray-700 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600 dark:text-gray-400">
                        {group.requestStatus}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {group.files.map((file: FileDocument) => (
                        <div
                          key={file.id}
                          className="w-full rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-left"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="m-0 truncate text-sm font-bold text-slate-900 dark:text-gray-100">
                                {file.file_type}
                              </p>
                              <p className="m-0 mt-1 truncate text-xs text-slate-600 dark:text-gray-400">
                                {file.file_name ||
                                  file.file_key ||
                                  "Generated document"}
                              </p>
                              <p className="m-0 mt-1 text-[11px] text-slate-500 dark:text-gray-500">
                                {formatDate(file.uploaded_at)}
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                                {file.file_status ||
                                  (file.source === "generated"
                                    ? "Generated"
                                    : "Uploaded")}
                              </span>
                            </div>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {isPreviewSupported(file) && (
                              <button
                                type="button"
                                onClick={() => onPreview(file)}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                Preview
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => onDownload(file)}
                              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800/50 px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700"
                            >
                              <ArrowDownToLine className="h-3.5 w-3.5" />
                              Download
                            </button>
                            {file.replaceable && (
                              <button
                                type="button"
                                onClick={() => onReplace(file)}
                                className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-2 text-xs font-bold uppercase tracking-wide text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
                              >
                                <Upload className="h-3.5 w-3.5" />
                                Replace
                              </button>
                            )}
                            {canArchive && (
                              <button
                                type="button"
                                onClick={() => onArchive(file)}
                                className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold uppercase tracking-wide transition-colors ${
                                  file.is_archived
                                    ? "border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
                                    : "border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50"
                                }`}
                              >
                                <Archive className="h-3.5 w-3.5" />
                                {file.is_archived ? "Unarchive" : "Archive"}
                              </button>
                            )}
                            {showArchived && canArchive && (
                              <button
                                type="button"
                                onClick={() => onDelete(file)}
                                className="inline-flex items-center gap-2 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-900/30 px-3 py-2 text-xs font-bold uppercase tracking-wide text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete
                              </button>
                            )}
                              {file.replaceable && (
                                <button
                                  type="button"
                                  onClick={() => onRemove(file)}
                                  className="inline-flex items-center gap-2 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-900/30 px-3 py-2 text-xs font-bold uppercase tracking-wide text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Remove
                                </button>
                              )}
                            </div>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
