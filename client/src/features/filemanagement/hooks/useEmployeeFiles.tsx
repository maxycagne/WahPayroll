import { useState, useMemo } from "react";
import { Employee, FileDocument } from "../types";

export const useEmployeeFiles = (employees: Employee[], files: FileDocument[]) => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [modalSourceFilter, setModalSourceFilter] = useState("all");

  const selectedEmployee = useMemo(
    () => employees.find((employee) => employee.emp_id === selectedEmployeeId) || null,
    [employees, selectedEmployeeId],
  );

  const selectedEmployeeFiles = useMemo(
    () => files.filter((file) => file.emp_id === selectedEmployeeId),
    [files, selectedEmployeeId],
  );

  const modalSourceCounts = useMemo(() => {
    const generated = selectedEmployeeFiles.filter(
      (file) => file.source === "generated",
    ).length;
    const resignation = selectedEmployeeFiles.filter(
      (file) => file.source === "resignation",
    ).length;
    return {
      all: selectedEmployeeFiles.length,
      generated,
      resignation,
    };
  }, [selectedEmployeeFiles]);

  const modalVisibleFiles = useMemo(() => {
    if (modalSourceFilter === "all") return selectedEmployeeFiles;
    return selectedEmployeeFiles.filter(
      (file) => file.source === modalSourceFilter,
    );
  }, [modalSourceFilter, selectedEmployeeFiles]);

  const modalFileGroups = useMemo(() => {
    const groups = new Map();

    modalVisibleFiles.forEach((file) => {
      const groupId = file.application_id || file.record_id || file.id;
      if (!groups.has(groupId)) {
        groups.set(groupId, {
          id: groupId,
          requestType: file.request_type || "Resignation",
          requestStatus: file.request_status || "Pending Approval",
          files: [] as FileDocument[],
        });
      }
      groups.get(groupId).files.push(file);
    });

    return Array.from(groups.values()).sort((a, b) => {
      const aNewest = a.files.reduce(
        (latest, file) =>
          Math.max(latest, new Date(file.uploaded_at || 0).getTime()),
        0,
      );
      const bNewest = b.files.reduce(
        (latest, file) =>
          Math.max(latest, new Date(file.uploaded_at || 0).getTime()),
        0,
      );
      return bNewest - aNewest;
    });
  }, [modalVisibleFiles]);

  const openEmployeeModal = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
    setModalSourceFilter("all");
  };

  const closeEmployeeModal = () => {
    setSelectedEmployeeId(null);
    setModalSourceFilter("all");
  };

  return {
    selectedEmployee,
    selectedEmployeeId,
    modalSourceFilter,
    setModalSourceFilter,
    modalSourceCounts,
    modalFileGroups,
    openEmployeeModal,
    closeEmployeeModal,
  };
};
