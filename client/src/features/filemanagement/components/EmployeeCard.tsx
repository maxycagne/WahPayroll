import React from "react";
import { Eye } from "lucide-react";
import { Employee, FileDocument } from "../types";
import { getDisplayName } from "../utils";

interface EmployeeCardProps {
  employee: Employee;
  employeeFiles: FileDocument[];
  onClick: (employeeId: string) => void;
}

export const EmployeeCard: React.FC<EmployeeCardProps> = ({
  employee,
  employeeFiles,
  onClick,
}) => {
  const employeeName =
    String(employee.employee_name || "").trim() ||
    employee.display_name ||
    getDisplayName(employee);
  const employeePosition =
    String(employee.position || "").trim() || "Unassigned position";
  const employeeDesignation =
    String(employee.designation || "").trim() || "No designation";

  return (
    <button
      type="button"
      onClick={() => onClick(employee.emp_id)}
      aria-label={`Open files for ${employeeName}, ${employeePosition}`}
      className="w-full rounded-2xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3 text-left shadow-sm transition hover:border-slate-300 dark:hover:border-gray-700 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 cursor-pointer"
    >
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="m-0 truncate text-sm font-bold text-slate-900 dark:text-gray-100">
            {employeeName}
          </h2>
          <p className="m-0 mt-0.5 truncate text-xs text-slate-600 dark:text-gray-400">
            {employeePosition}
          </p>
          <p className="m-0 mt-1 truncate text-[11px] text-slate-500 dark:text-gray-500">
            {employeeDesignation} • {employee.emp_id}
          </p>
        </div>
        <div className="text-right">
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-gray-800 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-700 dark:text-gray-300">
            <Eye className="h-3 w-3" />
            {employeeFiles.length} file
            {employeeFiles.length === 1 ? "" : "s"}
          </span>
          <p className="m-0 mt-1 text-[11px] text-slate-500 dark:text-gray-500">
            View Files
          </p>
        </div>
      </div>
    </button>
  );
};
