export default function ReviewConfirmationModalNotes({ reviewConfirm }) {
  const getReasonText = () =>
    reviewConfirm?.item?.reason ||
    reviewConfirm?.item?.remarks ||
    reviewConfirm?.item?.leave_reason ||
    reviewConfirm?.item?.offset_reason ||
    "";

  const getUploadedFiles = () => {
    const docsRaw = reviewConfirm?.item?.documents;
    let docs = {};

    if (docsRaw && typeof docsRaw === "string") {
      try {
        docs = JSON.parse(docsRaw);
      } catch {
        docs = {};
      }
    } else if (docsRaw && typeof docsRaw === "object") {
      docs = docsRaw;
    }

    const entries = Object.entries(docs)
      .map(([key, value]) => {
        if (typeof value === "string" && value.trim().length > 0) {
          return { key, url: value, label: key };
        }

        if (value && typeof value === "object") {
          const directUrl = value.url || value.download_url || value.fileUrl;
          if (typeof directUrl === "string" && directUrl.trim().length > 0) {
            return {
              key,
              url: directUrl,
              label: value.originalName || value.file_name || key,
            };
          }

          const keyValue = value.key || value.file_key || value.filename;
          if (typeof keyValue === "string" && keyValue.trim().length > 0) {
            return {
              key,
              url: `/api/file/get?filename=${encodeURIComponent(keyValue)}`,
              label: value.originalName || value.file_name || key,
            };
          }
        }

        return null;
      })
      .filter(Boolean);

    if (reviewConfirm?.item?.ocp) {
      entries.push({ key: "ocp", url: reviewConfirm.item.ocp, label: "ocp" });
    }

    const knownFileFields = [
      "doctor_cert",
      "death_cert",
      "birth_cert",
      "marriage_cert",
    ];

    knownFileFields.forEach((field) => {
      const value = reviewConfirm?.item?.[field];
      if (typeof value === "string" && value.trim().length > 0) {
        entries.push({ key: field, url: value, label: field });
      }
    });

    const uniqueMap = new Map();
    entries.forEach((entry) => {
      const uniqueKey = `${entry.key}-${entry.url}`;
      if (!uniqueMap.has(uniqueKey)) uniqueMap.set(uniqueKey, entry);
    });

    return Array.from(uniqueMap.values());
  };

  const reasonText = getReasonText();
  const uploadedFiles = getUploadedFiles();

  return (
    <>
      {reasonText && (
        <div className="mb-4 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="m-0 text-[10px] font-bold uppercase tracking-wider text-slate-700">
            Stated Reason
          </p>
          <p className="m-0 mt-1 text-sm text-slate-900">{reasonText}</p>
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="mb-4 rounded-md border border-sky-200 bg-sky-50 px-3 py-2">
          <p className="m-0 text-[10px] font-bold uppercase tracking-wider text-sky-800">
            Uploaded Files
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {uploadedFiles.map((file) => (
              <a
                key={`${file.key}-${file.url}`}
                href={file.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-md border border-sky-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-sky-700 hover:bg-sky-100"
              >
                {String(file.label || file.key).replace(/_/g, " ")}
              </a>
            ))}
          </div>
        </div>
      )}

      {reviewConfirm.decisionMode === "cancellation" && (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
          <p className="m-0 text-[10px] font-bold uppercase tracking-wider text-amber-800">
            Submitted Cancellation Reason
          </p>
          <p className="m-0 mt-1 text-sm text-amber-900">
            {reviewConfirm.item.cancellation_reason || "No reason provided."}
          </p>
        </div>
      )}

      {reviewConfirm.item.hr_note && (
        <div className="mb-4 rounded-md border border-indigo-200 bg-indigo-50 px-3 py-2">
          <p className="m-0 text-[10px] font-bold uppercase tracking-wider text-indigo-800">
            HR Note
          </p>
          <p className="m-0 mt-1 text-sm text-indigo-900">
            {reviewConfirm.item.hr_note}
          </p>
        </div>
      )}
    </>
  );
}
