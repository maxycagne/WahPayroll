import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { STANDARD_DOCUMENTS } from "@/assets/constantData";

export default function UpdateDocsModal({
  open,
  onClose,
  docForm,
  setDocForm,
  searchQuery,
  setSearchQuery,
  filteredEmployees,
  selectedEmployee,
  handleCheckboxChange,
  handleSubmitDocs,
  mutation,
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[560px] overflow-hidden p-0">
        <DialogHeader className="bg-gradient-to-r from-purple-600 to-purple-700 px-4 py-3 md:py-2.5">
          <DialogTitle className="text-base font-semibold text-white">
            Update Employee Documents
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmitDocs}
          className="space-y-3.5 p-4 md:space-y-3 md:p-3.5 dark:bg-gray-900"
        >
          <div className="flex flex-col">
            <label className="mb-1 flex justify-between text-sm font-semibold text-slate-700 dark:text-gray-300">
              <span>Select Employee *</span>
              {selectedEmployee && (
                <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400">
                  Selected: {selectedEmployee.first_name}{" "}
                  {selectedEmployee.last_name}
                </span>
              )}
            </label>
            <input
              type="text"
              placeholder="🔍 Search by name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-t-lg border border-slate-300 dark:border-gray-700 border-b-0 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <div className="max-h-32 overflow-y-auto rounded-b-lg border border-slate-300 dark:border-gray-700 bg-slate-50 dark:bg-gray-800/50 md:max-h-28">
              {filteredEmployees.length === 0 ? (
                <div className="p-2.5 text-center text-sm text-slate-500 dark:text-gray-500">
                  No employees found.
                </div>
              ) : (
                filteredEmployees.map((emp) => (
                  <div
                    key={emp.emp_id}
                    onClick={() =>
                      setDocForm({ ...docForm, emp_id: emp.emp_id })
                    }
                    className={`cursor-pointer border-b border-slate-100 dark:border-gray-800 px-3 py-2 text-sm transition-colors last:border-b-0 ${
                      docForm.emp_id === emp.emp_id
                        ? "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 font-bold border-l-4 border-l-purple-600"
                        : "border-l-4 border-l-transparent text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-800/50"
                    }`}
                  >
                    <span className="mr-2 font-mono text-[11px] text-slate-500 dark:text-gray-500">
                      {emp.emp_id}
                    </span>
                    {emp.first_name} {emp.last_name}
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <div className="mb-1.5 mt-1.5 flex items-end justify-between">
              <label className="text-sm font-semibold text-slate-700 dark:text-gray-300">
                Missing Documents
              </label>
              <span className="text-[11px] text-slate-500 dark:text-gray-500">
                Select all that apply
              </span>
            </div>
            <div
              className={`grid grid-cols-1 gap-2 rounded-lg border p-3 sm:grid-cols-2 md:gap-1.5 md:p-2.5 ${!docForm.emp_id ? "border-slate-200 dark:border-gray-800 bg-slate-100 dark:bg-gray-800/30 opacity-60" : "border-slate-300 dark:border-gray-700 bg-white dark:bg-gray-800"}`}
            >
              {STANDARD_DOCUMENTS.map((docName) => {
                const isChecked = docForm.missing_docs.includes(docName);
                return (
                  <label
                    key={docName}
                    className={`flex cursor-pointer select-none items-center gap-2 rounded p-0.5 text-xs transition-colors md:text-[11px] ${isChecked ? "font-semibold text-purple-700 dark:text-purple-400" : "text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700"}`}
                  >
                    <input
                      type="checkbox"
                      disabled={!docForm.emp_id}
                      checked={isChecked}
                      onChange={() => handleCheckboxChange(docName)}
                      className="h-3.5 w-3.5 cursor-pointer rounded border-slate-300 dark:border-gray-700 text-purple-600 focus:ring-purple-500 disabled:cursor-not-allowed"
                    />
                    {docName}
                  </label>
                );
              })}
            </div>
            <p className="mt-1.5 text-center text-[11px] text-slate-500 dark:text-gray-500">
              Uncheck all boxes to clear the employee from the missing documents
              tracker.
            </p>
          </div>

          <div className="flex gap-2.5 border-t border-slate-200 dark:border-gray-800 pt-3 md:gap-2 md:pt-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-md border-0 bg-slate-100 dark:bg-gray-800 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:text-gray-300 transition-colors hover:bg-slate-200 dark:hover:bg-gray-700 md:px-2.5 md:py-1 md:text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending || !docForm.emp_id}
              className="flex-1 rounded-md border-0 bg-purple-600 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50 md:px-2.5 md:py-1 md:text-xs"
            >
              {mutation.isPending ? "Saving..." : "Save Updates"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
