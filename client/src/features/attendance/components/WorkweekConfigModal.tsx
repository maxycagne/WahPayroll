import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { WorkweekConfig, WorkweekForm } from "../types/Attendance";
import { attendanceWorkweekConfigQueryOptions } from "../utils/queryOptions";
import {
  saveWorkweekMutationOptions,
  updateWorkweekMutationOptions,
  deleteWorkweekMutationOptions,
} from "../utils/mutationOptions";
import { useToast } from "@/hooks/useToast";

interface WorkweekConfigModalProps {
  onClose: () => void;
}

export const WorkweekConfigModal: React.FC<WorkweekConfigModalProps> = ({
  onClose,
}) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [workweekForm, setWorkweekForm] = useState<WorkweekForm>({
    workweek_type: "5-day",
    effective_from: "",
    effective_to: "",
  });
  const [editingWorkweekId, setEditingWorkweekId] = useState<number | null>(null);

  const { data: workweekConfigs = [] } = useQuery(
    attendanceWorkweekConfigQueryOptions,
  );

  const saveMutation = useMutation({
    ...saveWorkweekMutationOptions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workweek-config"] });
      queryClient.invalidateQueries({ queryKey: ["attendance-calendar"] });
      queryClient.invalidateQueries({ queryKey: ["leaves"] });
      showToast("Workweek configuration saved.");
      setWorkweekForm({ workweek_type: "5-day", effective_from: "", effective_to: "" });
    },
    onError: (err: any) => showToast(err.message || "Failed to save config.", "error"),
  });

  const updateMutation = useMutation({
    ...updateWorkweekMutationOptions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workweek-config"] });
      queryClient.invalidateQueries({ queryKey: ["attendance-calendar"] });
      queryClient.invalidateQueries({ queryKey: ["leaves"] });
      showToast("Workweek configuration updated.");
      setEditingWorkweekId(null);
      setWorkweekForm({ workweek_type: "5-day", effective_from: "", effective_to: "" });
    },
    onError: (err: any) => showToast(err.message || "Failed to update config.", "error"),
  });

  const deleteMutation = useMutation({
    ...deleteWorkweekMutationOptions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workweek-config"] });
      queryClient.invalidateQueries({ queryKey: ["attendance-calendar"] });
      queryClient.invalidateQueries({ queryKey: ["leaves"] });
      showToast("Workweek configuration deleted.");
    },
    onError: (err: any) => showToast(err.message || "Failed to delete config.", "error"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workweekForm.effective_from) {
      showToast("Effective from date is required.", "error");
      return;
    }

    const payload = {
      ...workweekForm,
      effective_to: workweekForm.effective_to || null,
    };

    if (editingWorkweekId) {
      updateMutation.mutate({ id: editingWorkweekId, data: payload });
    } else {
      saveMutation.mutate(payload);
    }
  };

  const handleEdit = (cfg: WorkweekConfig) => {
    setEditingWorkweekId(cfg.id);
    setWorkweekForm({
      workweek_type: cfg.workweek_type,
      effective_from: String(cfg.effective_from).slice(0, 10),
      effective_to: cfg.effective_to ? String(cfg.effective_to).slice(0, 10) : "",
    });
  };

  const handleCancelEdit = () => {
    setEditingWorkweekId(null);
    setWorkweekForm({ workweek_type: "5-day", effective_from: "", effective_to: "" });
  };

  const handleDelete = (cfg: WorkweekConfig) => {
    if (window.confirm(`Delete ${cfg.workweek_type} rule effective ${String(cfg.effective_from).slice(0, 10)}?`)) {
      deleteMutation.mutate(cfg.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden">
        <div className="bg-indigo-600 px-4 py-3 flex justify-between items-center text-white">
          <h2 className="text-base font-bold m-0">Workweek Configuration</h2>
          <button
            onClick={onClose}
            className="text-white text-xl bg-transparent border-0 cursor-pointer hover:text-gray-200"
          >
            &times;
          </button>
        </div>

        <div className="p-4 max-h-[75vh] overflow-y-auto space-y-4">
          <div>
            <form className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end mb-4" onSubmit={handleSubmit}>
              <label className="flex flex-col gap-1 text-xs font-semibold text-gray-700 uppercase">
                Workweek Type
                <select
                  value={workweekForm.workweek_type}
                  onChange={(e) =>
                    setWorkweekForm(prev => ({ ...prev, workweek_type: e.target.value }))
                  }
                  className="px-2 py-1.5 rounded-lg border border-gray-300 text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="5-day">5-day (8h, 1.00)</option>
                  <option value="4-day">4-day (10h, 1.25)</option>
                </select>
              </label>

              <label className="flex flex-col gap-1 text-xs font-semibold text-gray-700 uppercase">
                From
                <input
                  required
                  type="date"
                  value={workweekForm.effective_from}
                  onChange={(e) =>
                    setWorkweekForm(prev => ({ ...prev, effective_from: e.target.value }))
                  }
                  className="px-2 py-1.5 rounded-lg border border-gray-300 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </label>

              <label className="flex flex-col gap-1 text-xs font-semibold text-gray-700 uppercase">
                To (Opt.)
                <input
                  type="date"
                  value={workweekForm.effective_to}
                  onChange={(e) =>
                    setWorkweekForm(prev => ({ ...prev, effective_to: e.target.value }))
                  }
                  className="px-2 py-1.5 rounded-lg border border-gray-300 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </label>

              <button
                type="submit"
                disabled={saveMutation.isPending || updateMutation.isPending}
                className="h-9 px-3 rounded-lg border-0 bg-indigo-600 text-white text-xs font-bold cursor-pointer hover:bg-indigo-700 disabled:opacity-60"
              >
                {saveMutation.isPending || updateMutation.isPending ? "Saving..." : editingWorkweekId ? "Update" : "Save"}
              </button>
            </form>

            {editingWorkweekId && (
              <div className="mb-3">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-3 py-1 text-xs font-semibold rounded-md border border-indigo-300 text-indigo-800 bg-white hover:bg-indigo-50"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-gray-50">
            <table className="w-full text-xs">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2 text-left font-bold text-gray-700 uppercase text-[10px]">
                    Type
                  </th>
                  <th className="px-3 py-2 text-left font-bold text-gray-700 uppercase text-[10px]">
                    From
                  </th>
                  <th className="px-3 py-2 text-left font-bold text-gray-700 uppercase text-[10px]">
                    To
                  </th>
                  <th className="px-3 py-2 text-left font-bold text-gray-700 uppercase text-[10px]">
                    Hrs/Day
                  </th>
                  <th className="px-3 py-2 text-left font-bold text-gray-700 uppercase text-[10px]">
                    Unit
                  </th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {workweekConfigs.length === 0 ? (
                  <tr>
                    <td className="px-3 py-2 text-gray-500 text-xs" colSpan={6}>
                      No rules configured.
                    </td>
                  </tr>
                ) : (
                  workweekConfigs.map((cfg) => (
                    <tr key={cfg.id} className="border-b border-gray-200 hover:bg-gray-100">
                      <td className="px-3 py-2 font-semibold text-gray-800 text-xs">
                        {cfg.workweek_type}
                      </td>
                      <td className="px-3 py-2 text-gray-700 text-xs">
                        {String(cfg.effective_from).slice(0, 10)}
                      </td>
                      <td className="px-3 py-2 text-gray-700 text-xs">
                        {cfg.effective_to ? String(cfg.effective_to).slice(0, 10) : "Open"}
                      </td>
                      <td className="px-3 py-2 text-gray-700 text-xs">
                        {Number(cfg.hours_per_day).toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-gray-700 text-xs">
                        {Number(cfg.absence_unit).toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="inline-flex gap-1">
                          <button
                            type="button"
                            onClick={() => handleEdit(cfg)}
                            className="px-2 py-0.5 text-[10px] font-bold rounded border border-indigo-200 bg-indigo-100 text-indigo-800 hover:bg-indigo-200 cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(cfg)}
                            disabled={deleteMutation.isPending}
                            className="px-2 py-0.5 text-[10px] font-bold rounded border border-red-200 bg-red-100 text-red-800 hover:bg-red-200 disabled:opacity-60 cursor-pointer"
                          >
                            Del
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 font-semibold text-sm cursor-pointer hover:bg-gray-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
