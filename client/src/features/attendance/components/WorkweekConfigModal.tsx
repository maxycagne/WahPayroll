import React from "react";
import { WorkweekConfig } from "../types";

interface WorkweekConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: {
    workweek_type: string;
    effective_from: string;
    effective_to: string;
  };
  setForm: (val: any) => void;
  editingId: number | null;
  onSubmit: (e: React.FormEvent) => void;
  onCancelEdit: () => void;
  onEdit: (cfg: WorkweekConfig) => void;
  onDelete: (cfg: WorkweekConfig) => void;
  configs: WorkweekConfig[];
  isLoading: boolean;
}

export const WorkweekConfigModal: React.FC<WorkweekConfigModalProps> = ({
  isOpen,
  onClose,
  form,
  setForm,
  editingId,
  onSubmit,
  onCancelEdit,
  onEdit,
  onDelete,
  configs,
  isLoading,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden border border-gray-200 dark:border-gray-800">
        <div className="bg-indigo-600 px-4 py-3 flex justify-between items-center text-white">
          <h2 className="text-base font-bold m-0">Workweek Configuration</h2>
          <button onClick={onClose} className="text-white text-xl bg-transparent border-0 cursor-pointer hover:text-gray-200">&times;</button>
        </div>
        <div className="p-4 max-h-[75vh] overflow-y-auto space-y-4">
          <form className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end mb-4" onSubmit={onSubmit}>
            <label className="flex flex-col gap-1 text-xs font-semibold text-gray-700 dark:text-gray-400 uppercase">
              Workweek Type
              <select value={form.workweek_type} onChange={(e) => setForm((p: any) => ({ ...p, workweek_type: e.target.value }))} className="px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="5-day">5-day (8h, 1.00)</option>
                <option value="4-day">4-day (10h, 1.25)</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-gray-700 dark:text-gray-400 uppercase">
              From
              <input required type="date" value={form.effective_from} onChange={(e) => setForm((p: any) => ({ ...p, effective_from: e.target.value }))} className="px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-xs outline-none focus:ring-2 focus:ring-indigo-500" />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-gray-700 dark:text-gray-400 uppercase">
              To (Opt.)
              <input type="date" value={form.effective_to} onChange={(e) => setForm((p: any) => ({ ...p, effective_to: e.target.value }))} className="px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-xs outline-none focus:ring-2 focus:ring-indigo-500" />
            </label>
            <button type="submit" disabled={isLoading} className="h-9 px-3 rounded-lg border-0 bg-indigo-600 text-white text-xs font-bold cursor-pointer hover:bg-indigo-700 disabled:opacity-60">
              {isLoading ? "Saving..." : editingId ? "Update" : "Save"}
            </button>
          </form>
          {editingId && <button type="button" onClick={onCancelEdit} className="px-3 py-1 text-xs font-semibold rounded-md border border-indigo-300 dark:border-indigo-700 text-indigo-800 dark:text-indigo-300 bg-white dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-gray-700 transition-colors">Cancel</button>}
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30">
            <table className="w-full text-xs">
              <thead className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-3 py-2 text-left font-bold text-gray-700 dark:text-gray-300 uppercase text-[10px]">Type</th>
                  <th className="px-3 py-2 text-left font-bold text-gray-700 dark:text-gray-300 uppercase text-[10px]">From</th>
                  <th className="px-3 py-2 text-left font-bold text-gray-700 dark:text-gray-300 uppercase text-[10px]">To</th>
                  <th className="px-3 py-2 text-left font-bold text-gray-700 dark:text-gray-300 uppercase text-[10px]">Hrs/Day</th>
                  <th className="px-3 py-2 text-left font-bold text-gray-700 dark:text-gray-300 uppercase text-[10px]">Unit</th>
                  <th className="px-3 py-2 text-right text-[10px] dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && configs.length === 0 ? (
                  <tr><td className="px-3 py-2 text-gray-500 dark:text-gray-400 text-xs" colSpan={6}>Loading...</td></tr>
                ) : configs.length === 0 ? (
                  <tr><td className="px-3 py-2 text-gray-500 dark:text-gray-400 text-xs" colSpan={6}>No rules configured.</td></tr>
                ) : (
                  configs.map((cfg) => (
                    <tr key={cfg.id} className="border-b border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-3 py-2 font-semibold text-gray-800 dark:text-gray-100 text-xs">{cfg.workweek_type}</td>
                      <td className="px-3 py-2 text-gray-700 dark:text-gray-300 text-xs">{String(cfg.effective_from).slice(0, 10)}</td>
                      <td className="px-3 py-2 text-gray-700 dark:text-gray-300 text-xs">{cfg.effective_to ? String(cfg.effective_to).slice(0, 10) : "Open"}</td>
                      <td className="px-3 py-2 text-gray-700 dark:text-gray-300 text-xs">{Number(cfg.hours_per_day).toFixed(2)}</td>
                      <td className="px-3 py-2 text-gray-700 dark:text-gray-300 text-xs">{Number(cfg.absence_unit).toFixed(2)}</td>
                      <td className="px-3 py-2 text-right">
                        <div className="inline-flex gap-1">
                          <button onClick={() => onEdit(cfg)} className="px-2 py-0.5 text-[10px] font-bold rounded border border-indigo-200 dark:border-indigo-900/30 bg-indigo-100 dark:bg-indigo-900/20 text-indigo-800 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900/40 cursor-pointer">Edit</button>
                          <button onClick={() => onDelete(cfg)} className="px-2 py-0.5 text-[10px] font-bold rounded border border-red-200 dark:border-red-900/30 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/40 cursor-pointer">Del</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-3 border-t border-gray-200 dark:border-gray-800 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Close</button>
        </div>
      </div>
    </div>
  );
};
