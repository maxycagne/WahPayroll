import React from "react";
import { AlertTriangle } from "lucide-react";

type EmployeeMissingDocsAlertProps = {
  missingDocs?: string;
};

export default function EmployeeMissingDocsAlert({
  missingDocs,
}: EmployeeMissingDocsAlertProps) {
  if (!missingDocs) return null;

  return (
    <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm">
      <span className="mt-0.5 rounded-md bg-white p-1 text-red-600">
        <AlertTriangle className="h-4 w-4" />
      </span>
      <div>
        <h3 className="m-0 mb-1 text-sm font-bold text-red-800">
          Action Required: Missing Documents
        </h3>
        <p className="m-0 text-xs leading-5 text-red-700">
          HR has flagged your profile for missing requirements:{" "}
          <span className="font-bold">{missingDocs}</span>. Please submit these as
          soon as possible.
        </p>
      </div>
    </div>
  );
}
