export default function ResignationForm({
  resignationForm,
  setResignationForm,
  resignationTypes,
  setApplicationModalOpen,
  fileResignationMutation,
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        fileResignationMutation.mutate(resignationForm);
      }}
      className="grid grid-cols-1 gap-3 md:grid-cols-2"
    >
      <div className="flex flex-col gap-2">
        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
          Resignation Type
        </label>
        <select
          value={resignationForm.resignation_type}
          onChange={(e) =>
            setResignationForm({
              ...resignationForm,
              resignation_type: e.target.value,
            })
          }
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500"
        >
          {resignationTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
          Effective Date
        </label>
        <input
          type="date"
          required
          value={resignationForm.effective_date}
          onChange={(e) =>
            setResignationForm({
              ...resignationForm,
              effective_date: e.target.value,
            })
          }
          className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>
      <div className="flex flex-col gap-2 md:col-span-2">
        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
          Reason / Comments
        </label>
        <textarea
          rows="4"
          required
          value={resignationForm.reason}
          onChange={(e) =>
            setResignationForm({
              ...resignationForm,
              reason: e.target.value,
            })
          }
          className="w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>
      <div className="mt-1 flex justify-end gap-2 md:col-span-2">
        <button
          type="button"
          onClick={() => setApplicationModalOpen(false)}
          className="cursor-pointer rounded-lg bg-gray-200 px-5 py-2 text-sm font-bold text-gray-700 hover:bg-gray-300"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={fileResignationMutation.isPending}
          className="cursor-pointer rounded-lg bg-red-600 px-5 py-2 text-sm font-bold text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
        >
          Submit Resignation
        </button>
      </div>
    </form>
  );
}
