import { useState, useMemo } from "react";
import { Employee, FileDocument } from "../types";
import { normalizeString, getDisplayName } from "../utils";

export const useFileFilters = (employees: Employee[], files: FileDocument[], filterAttributeKey: keyof Employee, filterAttributeLabel: string) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [designationFilter, setDesignationFilter] = useState("all");
  const [showArchived, setShowArchived] = useState(false);

  const designationOptions = useMemo(() => {
    const optionsMap = new Map();

    employees.forEach((employee) => {
      const rawValue = String(employee[filterAttributeKey] || "").trim();
      if (!rawValue) return;
      const normalizedValue = normalizeString(rawValue);
      if (!optionsMap.has(normalizedValue)) {
        optionsMap.set(normalizedValue, rawValue);
      }
    });

    return [
      { value: "all", label: `All ${filterAttributeLabel}s` },
      ...Array.from(optionsMap.entries()).map(([value, label]) => ({
        value,
        label,
      })),
    ];
  }, [employees, filterAttributeKey, filterAttributeLabel]);

  const filteredEmployees = useMemo(() => {
    const search = normalizeString(searchTerm);

    return employees.filter((employee) => {
      const employeeName =
        String(employee.employee_name || "").trim() ||
        employee.display_name ||
        getDisplayName(employee);
      const employeePosition = String(employee.position || "").trim();
      const employeeDesignation = String(employee.designation || "").trim();
      const employeeFilterValue = normalizeString(employee[filterAttributeKey] as string);

      const matchesSearch =
        !search ||
        [employeeName, employeePosition, employeeDesignation, employee.emp_id]
          .join(" ")
          .toLowerCase()
          .includes(search);

      const matchesDesignation =
        designationFilter === "all" ||
        employeeFilterValue === designationFilter;

      // In Card Layout, we want to show the employee if they have files that match the current view
      // OR if we are in Active view and they have no files yet (newly added)
      const hasMatchingFiles = files.some(f => f.emp_id === employee.emp_id && !!f.is_archived === showArchived);
      const isNewEmployee = !showArchived && !files.some(f => f.emp_id === employee.emp_id);
      
      const matchesArchived = hasMatchingFiles || isNewEmployee;

      return matchesSearch && matchesDesignation && matchesArchived;
    });
  }, [designationFilter, employees, files, filterAttributeKey, searchTerm, showArchived]);

  const filteredFiles = useMemo(() => {
    const archivedInFiles = files.filter(f => f.is_archived).length;
    console.log(`[FileFilters] Current view: ${showArchived ? 'Archive' : 'Active'}. Total files in memory: ${files.length}, Archived in memory: ${archivedInFiles}`);
    
    const search = normalizeString(searchTerm);
    return files.filter((file) => {
      const fileDesignation = String(file.designation || "").trim();
      const filePosition = String(file.position || "").trim();
      const matchesSearch =
        !search ||
        [
          file.employee_name,
          file.file_type,
          file.file_name,
          file.designation,
          file.position,
          file.request_type,
        ]
          .join(" ")
          .toLowerCase()
          .includes(search);

      const matchesDesignation =
        designationFilter === "all" ||
        normalizeString(
          filterAttributeKey === "position" ? filePosition : fileDesignation,
        ) === designationFilter;

      const matchesArchived = !!file.is_archived === showArchived;

      return matchesSearch && matchesDesignation && matchesArchived;
    });
  }, [designationFilter, files, filterAttributeKey, searchTerm, showArchived]);

  const employeeCards = useMemo(() => {
    return filteredEmployees.map((employee) => ({
      employee,
      files: filteredFiles.filter((file) => file.emp_id === employee.emp_id),
    }));
  }, [filteredEmployees, filteredFiles]);

  return {
    searchTerm,
    setSearchTerm,
    designationFilter,
    setDesignationFilter,
    designationOptions,
    filteredEmployees,
    filteredFiles,
    employeeCards,
    showArchived,
    setShowArchived,
  };
};
