import { Button } from "@/components/ui/button";
import { badgeClass } from "@/features/leave/leaveConstants";
import { formatLongDate } from "@/features/leave/utils/date.utils";

export default function MyPendingRequestsTableRow({
  item,

  cancelMyPendingRequestMutation,
  setCancelPendingConfirm,
  requestCancellationApprovalMutation,
  setCancelApprovalConfirm,
  setUploadClearanceItem,
}) {
  console.log(item);
  return (
    <tr className="transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
      <td className="px-4 py-2.5 text-sm font-semibold text-gray-800 dark:text-gray-200">
        {item.request_group === "resignation"
          ? `Resignation - ${item.unified_type}`
          : item.request_group === "offset"
            ? Number(item.days_applied || 0) > 0
              ? `Offset (${Number(item.days_applied || 0).toFixed(2)} days)`
              : "Offset"
            : item.unified_type}
      </td>
      <td className="px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300">
        {item.request_group === "resignation"
          ? item.effective_date
            ? formatLongDate(item.effective_date)
            : "N/A"
          : `${formatLongDate(item.date_from)} - ${formatLongDate(item.date_to)}`}
      </td>
      <td className="px-4 py-2.5">
        <span
          className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider ${badgeClass[item.row_status] || "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400"}`}
        >
          {item.row_status}
        </span>
      </td>
      <td className="px-4 py-2.5 text-xs font-medium text-gray-600 dark:text-gray-400">
        {item.cancellation_requested_at
          ? new Date(item.cancellation_requested_at).toLocaleString()
          : "-"}
      </td>
      <td className="px-4 py-2.5 text-xs font-medium text-gray-600 dark:text-gray-400">
        {item.ocp ? (
          <a
            download
            href={`${item.ocp}`}
            className="inline-flex items-center gap-1 rounded-md border border-sky-200 dark:border-sky-900/30 bg-sky-100 dark:bg-sky-900/40 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-sky-700 dark:text-sky-400 hover:bg-sky-200 dark:hover:bg-sky-900/60 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Download
          </a>
        ) : (
          "N/A"
        )}
      </td>
      <td className="px-4 py-2.5 text-right">
        {item.request_group === "resignation" &&
          item.row_status === "Awaiting Clearance" && (
            <button
              type="button"
              onClick={() => setUploadClearanceItem(item)}
              className="mr-2 rounded-md border border-purple-200 dark:border-purple-900/30 bg-purple-100 dark:bg-purple-900/40 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-purple-700 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/60"
            >
              Upload Clearance
            </button>
          )}
        {item.row_action === "cancel_pending" && (
          <button
            type="button"
            disabled={cancelMyPendingRequestMutation.isPending}
            onClick={() => setCancelPendingConfirm(item)}
            className="rounded-md border border-red-200 dark:border-red-900/30 bg-red-100 dark:bg-red-900/40 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/60 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel Request
          </button>
        )}
        {item.row_action === "request_cancel_approval" && (
          <button
            type="button"
            disabled={requestCancellationApprovalMutation.isPending}
            onClick={() => {
              setCancelApprovalConfirm({
                item,
                reason: "",
              });
            }}
            className="rounded-md border border-amber-200 dark:border-amber-900/30 bg-amber-100 dark:bg-amber-900/40 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-800 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/60 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Request Cancellation Approval
          </button>
        )}
        {item.row_action === "cancel_waiting_approval" && (
          <span className="inline-flex items-center rounded-md border border-slate-200 dark:border-gray-800 bg-slate-100 dark:bg-gray-800 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-700 dark:text-gray-300">
            Awaiting Approval
          </span>
        )}
      </td>
    </tr>
  );
}
