import { useRef } from "react";

export default function LeaveUploadField({
  label,
  file,
  onChange,
  onRemove,
  accept = ".pdf,.doc,.docx,.jpg,.jpeg,.png",
  required = false,
  helperText = "",
}) {
  const inputRef = useRef(null);

  const openFile = () => {
    if (!file) return;

    const objectUrl = window.URL.createObjectURL(file);
    window.open(objectUrl, "_blank", "noopener,noreferrer");
    window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 1000);
  };

  return (
    <div className="flex flex-col gap-2 md:col-span-3">
      <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
        {label} {required && <span className="text-red-600">*</span>}
      </label>
      <input
        ref={inputRef}
        type="file"
        required={required && !file}
        accept={accept}
        onChange={(e) => {
          const selectedFile = e.target.files?.[0];
          if (!selectedFile) return;
          onChange(selectedFile);
        }}
        className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500"
      />

      {file && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="m-0 text-xs font-semibold text-slate-700">
            Uploaded: {file.name}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={openFile}
              className="rounded-md border border-indigo-200 bg-indigo-100 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-indigo-700 hover:bg-indigo-200"
            >
              View File
            </button>
            <button
              type="button"
              onClick={() => {
                if (inputRef.current) {
                  inputRef.current.value = "";
                }
                onRemove?.();
              }}
              className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-red-700 hover:bg-red-100"
            >
              Remove File
            </button>
          </div>
        </div>
      )}

      {helperText && (
        <p className="m-0 text-xs text-gray-600">{helperText}</p>
      )}
    </div>
  );
}