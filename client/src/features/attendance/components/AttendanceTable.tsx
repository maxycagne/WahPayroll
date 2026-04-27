import React from "react";
import { AttendanceRecord } from "../types";
import { badgeClass } from "../utils";

interface AttendanceTableProps {
  attendance: AttendanceRecord[];
  search: string;
  canEdit: boolean;
  onAdjustBalance: (record: AttendanceRecord) => void;
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
}

export const AttendanceTable: React.FC<AttendanceTableProps> = ({
  attendance,
  search,
  canEdit,
  onAdjustBalance,
  currentPage,
  totalPages,
  totalRecords,
  setCurrentPage,
}) => {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-400 uppercase text-[11px] font-bold">
          <tr>
            <th className="px-6 py-4">Employee</th>
            <th className="px-6 py-4 text-center">Designation</th>
            <th className="px-6 py-4 text-center">Status</th>
            <th className="px-6 py-4 text-center">Status 2</th>
            <th className="px-6 py-4 text-center">Leave Balance</th>
            {canEdit && <th className="px-6 py-4 text-right">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {attendance.length === 0 ? (
            <tr>
              <td colSpan={canEdit ? 6 : 5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400 italic">
                No matching attendance records found.
              </td>
            </tr>
          ) : (
            attendance.map((row) => (
              <tr key={row.emp_id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-bold text-gray-900 dark:text-gray-100 m-0">{row.first_name} {row.last_name}</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 m-0">{row.emp_id}</p>
                </td>
                <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-400 text-xs">{row.designation}</td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${badgeClass[row.status] || badgeClass[""]}`}>
                    {row.status || "Pending"}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  {row.status2 ? (
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${badgeClass[row.status2] || badgeClass[""]}`}>
                      {row.status2}
                    </span>
                  ) : (
                    <span className="text-gray-300 dark:text-gray-600 text-xs italic">N/A</span>
                  )}
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="font-mono font-bold text-gray-700 dark:text-gray-300">{Number(row.leave_balance).toFixed(2)}</span>
                </td>
                {canEdit && (
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => onAdjustBalance(row)}
                      className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 transition-colors cursor-pointer bg-transparent border-0 underline"
                    >
                      Adjust Balance
                    </button>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white dark:bg-gray-900 px-4 py-3 border-t border-gray-200 dark:border-gray-800">
          <div className="text-sm text-gray-700 dark:text-gray-400">
            Showing <span className="font-medium text-gray-900 dark:text-gray-100">{(currentPage - 1) * 6 + 1}</span> to{" "}
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {Math.min(currentPage * 6, totalRecords)}
            </span>{" "}
            of <span className="font-medium text-gray-900 dark:text-gray-100">{totalRecords}</span> results
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-900 cursor-pointer"
            >
              Previous
            </button>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 px-2">
              Page {currentPage} of {totalPages}
            </div>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-900 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
