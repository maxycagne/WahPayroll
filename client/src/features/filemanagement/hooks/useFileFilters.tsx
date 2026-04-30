import { useState, useMemo } from "react";
import { Employee, FileDocument } from "../types";
import { normalizeString, getDisplayName } from "../utils";

export const useFileFilters = (employees: Employee[], files: FileDocument[], filterAttributeKey: keyof Employee, filterAttributeLabel: string) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [designationFilter, setDesignationFilter] = useState("all");

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

      return matchesSearch && matchesDesignation;
    });
  }, [designationFilter, employees, filterAttributeKey, searchTerm]);

  const filteredFiles = useMemo(() => {
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

      return matchesSearch && matchesDesignation;
    });
  }, [designationFilter, files, filterAttributeKey, searchTerm]);

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
  };
};
