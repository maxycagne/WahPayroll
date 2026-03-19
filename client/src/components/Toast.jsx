export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  const isError = toast.type === "error";

  return (
    <div className="fixed top-4 right-4 z-[60] max-w-sm w-[92vw] sm:w-auto">
      <div
        className={`px-4 py-3 rounded-lg shadow-lg border text-sm font-semibold flex items-start gap-3 ${
          isError
            ? "bg-red-50 text-red-700 border-red-200"
            : "bg-green-50 text-green-700 border-green-200"
        }`}
      >
        <span className="leading-5">{toast.message}</span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-inherit border-0 bg-transparent cursor-pointer font-bold leading-5"
            aria-label="Close notification"
          >
            x
          </button>
        )}
      </div>
    </div>
  );
}
