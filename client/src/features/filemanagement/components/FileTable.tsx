import React from "react";
import { ArrowDownToLine, Upload, Trash2, Archive } from "lucide-react";
import { FileDocument } from "../types";
import { formatDate } from "../utils";

interface FileTableProps {
  files: FileDocument[];
  onDownload: (file: FileDocument) => void;
  onReplace: (file: FileDocument) => void;
  onRemove: (file: FileDocument) => void;
  onArchive: (file: FileDocument) => void;
  onDelete: (file: FileDocument) => void;
  canArchive: boolean;
  showArchived: boolean;
  role: string;
}

export const FileTable: React.FC<FileTableProps> = ({
  files,
  onDownload,
  onReplace,
  onRemove,
  onArchive,
  onDelete,
  canArchive,
  showArchived,
  role,
}) => {
  const isRankAndFile = role === "RankAndFile";

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="sticky top-0 bg-slate-50 dark:bg-gray-800">
            <tr className="border-b border-slate-200 dark:border-gray-700 text-[11px] uppercase tracking-wider text-slate-500 dark:text-gray-400">
              <th className="px-5 py-3">{isRankAndFile ? "Source" : "Employee"}</th>
              <th className="px-5 py-3">File Type</th>
              <th className="px-5 py-3">File Name</th>
              <th className="px-5 py-3">Uploaded</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
            {files.map((file) => (
              <tr key={file.id} className="hover:bg-slate-50/70 dark:hover:bg-gray-800/50">
                <td className="px-5 py-4">
                  {isRankAndFile ? (
                    <div className="font-semibold text-slate-900 dark:text-gray-100 capitalize">
                      {file.source === "generated" ? "System Generated" : file.source}
                    </div>
                  ) : (
                    <>
                      <div className="font-semibold text-slate-900 dark:text-gray-100">
                        {file.employee_name}
                      </div>
                      <div className="mt-1 text-xs text-slate-500 dark:text-gray-400">
                        {file.position || "-"} • {file.designation || "-"}
                      </div>
                    </>
                  )}
                </td>
                <td className="px-5 py-4 font-medium text-slate-800 dark:text-gray-200">
                  {file.file_type}
                </td>
                <td className="px-5 py-4 text-slate-600 dark:text-gray-400">
                  {file.file_name || file.file_key}
                </td>
                <td className="px-5 py-4 text-slate-600 dark:text-gray-400">
                  {formatDate(file.uploaded_at)}
                </td>
                <td className="px-5 py-4 text-right">
                  <div className="inline-flex gap-2">
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
