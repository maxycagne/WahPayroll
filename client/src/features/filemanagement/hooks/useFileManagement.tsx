import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getFileInventory, getFileActivityLog } from "../api";
import { normalizeString } from "../utils";
import { Employee } from "../types";

import { useFileFilters } from "./useFileFilters";
import { useFileTemplates } from "./useFileTemplates";
import { useEmployeeFiles } from "./useEmployeeFiles";
import { useFileOperations } from "./useFileOperations";

export const useFileManagement = () => {
  const [toast, setToast] = useState<{ message: string; type: string; createdAt: number } | null>(null);

  const showToast = (message: string, type = "success") => {
    setToast({ message, type, createdAt: Date.now() });
  };

  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("wah_user") || "{}");
    } catch {
      return {};
    }
  }, []);

  const role = currentUser?.role || "RankAndFile";
  const isCardLayout = ["Admin", "HR", "Supervisor"].includes(role);
  const canManageTemplates = role === "Admin" || role === "HR";
  const canArchive = ["Admin", "HR", "Supervisor"].includes(role);
  const isSupervisorRole = role === "Supervisor";
  const filterAttributeKey = isSupervisorRole ? "position" : ("designation" as keyof Employee);
  const filterAttributeLabel = isSupervisorRole ? "Position" : "Designation";

  const {
    data: inventory = { employees: [], files: [] },
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["file-management", role],
    queryFn: getFileInventory,
  });

  const {
    data: fileActivityLog = [],
    refetch: refetchFileActivityLog,
  } = useQuery({
    queryKey: ["file-activity-log"],
    queryFn: getFileActivityLog,
  });

  const files = useMemo(
    () => (inventory.files || []).filter((file) => normalizeString(file.source) !== "profile"),
    [inventory.files]
  );

  const employees = useMemo(
    () => (inventory.employees || []).filter((employee) => {
      const normalizedRole = normalizeString(employee.role);
      const normalizedDesignation = normalizeString(employee.designation);
      return normalizedRole !== "admin" && normalizedDesignation !== "admin system";
    }),
    [inventory.employees]
  );

  const counts = useMemo(() => {
    const allFiles = inventory.files || [];
    const nonProfile = allFiles.filter((f) => normalizeString(f.source) !== "profile");
    return {
      active: nonProfile.filter((f) => !f.is_archived).length,
      archived: nonProfile.filter((f) => !!f.is_archived).length,
    };
  }, [inventory.files]);

  const queryClient = useQueryClient();
  const fileFilters = useFileFilters(employees, files, filterAttributeKey, filterAttributeLabel);
  const fileTemplates = useFileTemplates(role, showToast, fileFilters.showArchived);
  const employeeFiles = useEmployeeFiles(employees, files, fileFilters.showArchived);
  const fileOperations = useFileOperations(showToast, () => {
    queryClient.invalidateQueries({ queryKey: ["file-management"] });
    refetchFileActivityLog();
  });

  return {
    ...fileFilters,
    ...fileTemplates,
    ...employeeFiles,
    ...fileOperations,
    toast,
    setToast,
    role,
    isCardLayout,
    canManageTemplates,
    canArchive,
    isLoading,
    isError,
    refetch,
    counts,
    fileActivityLog,
    refetchFileActivityLog,
  };
};
