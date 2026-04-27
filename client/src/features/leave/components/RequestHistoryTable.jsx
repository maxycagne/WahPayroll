import { badgeClass } from "../leaveConstants";
import { formatLongDate } from "../utils/date.utils";

export default function RequestHistoryTable({ myRequestHistory, activeMonth }) {
  const monthName = activeMonth
    ? new Date(activeMonth.year, activeMonth.month).toLocaleString("default", {
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
      <div className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 px-4 py-3">
        <h3 className="m-0 text-sm font-bold text-gray-900 dark:text-gray-100">
          History of Leave / Resignation {monthName ? `for ${monthName}` : ""}
        </h3>
      </div>
      <div className="max-h-72 overflow-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Employee
              </th>
              <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Request Type
              </th>
              <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Dates
              </th>
              <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Date Filed
              </th>
              <th className="px-4 py-2.5 text-right text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {myRequestHistory.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  className="px-4 py-6 text-center text-sm font-medium text-gray-500 dark:text-gray-400"
                >
                  No request history records.
                </td>
              </tr>
            ) : (
              myRequestHistory.map((entry) => (
                <tr
                  key={entry.id}
                  className="transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/50"
                >
                  <td className="px-4 py-2.5 text-sm font-semibold text-gray-800 dark:text-gray-200">
                    {entry.employee_name || "-"}
                  </td>
                  <td className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                    {entry.request_type}
                  </td>
                  <td className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                    {entry.schedule}
                  </td>
                  <td className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                    {entry.filed_at ? formatLongDate(entry.filed_at) : "-"}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <span
                      className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider ${badgeClass[entry.final_status] || "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"}`}
                    >
                      {entry.final_status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
