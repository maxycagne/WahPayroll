export default function MyPendingRequestsModalHeader({
  onClose,
}) {
  return (
    <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 px-4 py-3">
      <h3 className="m-0 text-base font-bold text-gray-900 dark:text-gray-100">
        My Pending Requests
      </h3>
      <button
        onClick={onClose}
        className="cursor-pointer rounded-md border-0 bg-transparent px-2 py-1 text-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
      >
        &times;
      </button>
    </div>
  );
}
