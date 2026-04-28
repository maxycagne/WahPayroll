import React from "react";
import { ArrowDownToLine, Upload, Trash2 } from "lucide-react";
import { FileDocument } from "../types";
import { formatDate } from "../utils";

interface FileTableProps {
  files: FileDocument[];
  onDownload: (file: FileDocument) => void;
  onReplace: (file: FileDocument) => void;
  onRemove: (file: FileDocument) => void;
}

export const FileTable: React.FC<FileTableProps> = ({
  files,
  onDownload,
  onReplace,
  onRemove,
}) => {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="sticky top-0 bg-slate-50 dark:bg-gray-800">
            <tr className="border-b border-slate-200 dark:border-gray-700 text-[11px] uppercase tracking-wider text-slate-500 dark:text-gray-400">
              <th className="px-5 py-3">Employee</th>
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
                  <div className="font-semibold text-slate-900 dark:text-gray-100">
                    {file.employee_name}
                  </div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-gray-400">
                    {file.position || "-"} • {file.designation || "-"}
                  </div>
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
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-700 hover:bg-slate-100"
                    >
                      <ArrowDownToLine className="h-3.5 w-3.5" />
                      Download
                    </button>
                    {file.replaceable && (
                      <button
                        type="button"
                        onClick={() => onReplace(file)}
                        className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-bold uppercase tracking-wide text-indigo-700 hover:bg-indigo-100"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        Replace
                      </button>
                    )}
                    {file.replaceable && (
                      <button
                        type="button"
                        onClick={() => onRemove(file)}
                        className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold uppercase tracking-wide text-rose-700 hover:bg-rose-100"
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
