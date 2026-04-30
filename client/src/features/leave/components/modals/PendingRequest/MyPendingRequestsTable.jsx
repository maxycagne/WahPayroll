import MyPendingRequestsTableRow from "./MyPendingRequestsTableRow";

export default function MyPendingRequestsTable({
  myRequestRows,

  cancelMyPendingRequestMutation,
  setCancelPendingConfirm,
  requestCancellationApprovalMutation,
  setCancelApprovalConfirm,
  setUploadClearanceItem,
}) {
  return (
    <table className="w-full text-sm text-left">
      <thead className="sticky top-0 z-10 bg-white dark:bg-gray-900">
        <tr className="border-b border-gray-200 dark:border-gray-800">
          <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Request Type
          </th>
          <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Schedule
          </th>
          <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Status
          </th>
          <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Cancel Requested At
          </th>
          <th className="px-4 py-2.5 text-center text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            OCP
          </th>
          <th className="px-4 py-2.5 text-right text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Action
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
        {myRequestRows.length === 0 ? (
          <tr>
            <td
              colSpan="6"
              className="px-4 py-8 text-center text-sm font-medium text-gray-500 dark:text-gray-400"
            >
              You have no active request actions.
            </td>
          </tr>
        ) : (
          myRequestRows.map((item) => (
            <MyPendingRequestsTableRow
              key={`${item.request_group}-${item.id}`}
              item={item}
              cancelMyPendingRequestMutation={cancelMyPendingRequestMutation}
              setCancelPendingConfirm={setCancelPendingConfirm}
              requestCancellationApprovalMutation={
                requestCancellationApprovalMutation
              }
              setCancelApprovalConfirm={setCancelApprovalConfirm}
              setUploadClearanceItem={setUploadClearanceItem}
            />
          ))
        )}
      </tbody>
    </table>
  );
}
