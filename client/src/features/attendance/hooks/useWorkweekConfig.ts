import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getWorkweekConfigs, saveWorkweekConfig, updateWorkweekConfig, deleteWorkweekConfig } from "../api";
import { WorkweekConfig } from "../types";

export const useWorkweekConfig = (showToast: any) => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    workweek_type: "5-day",
    effective_from: "",
    effective_to: "",
  });
  const [editingId, setEditingId] = useState<number | null>(null);

  const query = useQuery({
    queryKey: ["workweek-config"],
    queryFn: getWorkweekConfigs,
  });

  const saveMutation = useMutation({
    mutationFn: (payload: any) => saveWorkweekConfig(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workweek-config"] });
      queryClient.invalidateQueries({ queryKey: ["attendance-calendar"] });
      queryClient.invalidateQueries({ queryKey: ["leaves"] });
      showToast("Workweek configuration saved.");
      setForm((prev) => ({ ...prev, effective_from: "", effective_to: "" }));
    },
    onError: (err: any) => showToast(err.message || "Failed to save config.", "error"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: any }) => updateWorkweekConfig(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workweek-config"] });
      queryClient.invalidateQueries({ queryKey: ["attendance-calendar"] });
      queryClient.invalidateQueries({ queryKey: ["leaves"] });
      showToast("Workweek configuration updated.");
      setEditingId(null);
      setForm({ workweek_type: "5-day", effective_from: "", effective_to: "" });
    },
    onError: (err: any) => showToast(err.message || "Failed to update config.", "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteWorkweekConfig(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workweek-config"] });
      queryClient.invalidateQueries({ queryKey: ["attendance-calendar"] });
      queryClient.invalidateQueries({ queryKey: ["leaves"] });
      showToast("Workweek configuration deleted.");
    },
    onError: (err: any) => showToast(err.message || "Failed to delete config.", "error"),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.effective_from) {
      showToast("Effective from date is required.", "error");
      return;
    }
    const payload = { ...form, effective_to: form.effective_to || null };
    if (editingId) updateMutation.mutate({ id: editingId, payload });
    else saveMutation.mutate(payload);
  };

  const onEdit = (cfg: WorkweekConfig) => {
    setEditingId(cfg.id);
    setForm({
      workweek_type: cfg.workweek_type,
      effective_from: String(cfg.effective_from).slice(0, 10),
      effective_to: cfg.effective_to ? String(cfg.effective_to).slice(0, 10) : "",
    });
  };

  const onCancelEdit = () => {
    setEditingId(null);
    setForm({ workweek_type: "5-day", effective_from: "", effective_to: "" });
  };

  const onDelete = (cfg: WorkweekConfig) => {
    if (!window.confirm(`Delete ${cfg.workweek_type} rule effective ${String(cfg.effective_from).slice(0, 10)}?`)) return;
    deleteMutation.mutate(cfg.id);
  };

  return {
    isOpen, setIsOpen,
    form, setForm,
    editingId,
    configs: query.data || [],
    isLoading: query.isLoading || saveMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
    onSubmit,
    onEdit,
    onCancelEdit,
    onDelete
  };
};
