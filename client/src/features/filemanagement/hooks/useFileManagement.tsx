import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getFileInventory } from "../api";
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

  const fileFilters = useFileFilters(employees, files, filterAttributeKey, filterAttributeLabel);
  const fileTemplates = useFileTemplates(role, showToast);
  const employeeFiles = useEmployeeFiles(employees, files);
  const fileOperations = useFileOperations(showToast, refetch);

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
    isLoading,
    isError,
    refetch,
  };
};
