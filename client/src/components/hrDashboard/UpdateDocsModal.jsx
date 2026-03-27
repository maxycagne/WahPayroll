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
      <DialogContent className="max-w-[600px] p-0 overflow-hidden">
        <DialogHeader className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
          <DialogTitle className="text-white text-lg font-semibold">
            Update Employee Documents
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmitDocs} className="p-6 space-y-4">
          <div className="flex flex-col">
            <label className="text-sm font-semibold text-gray-700 mb-1 flex justify-between">
              <span>Select Employee *</span>
              {selectedEmployee && (
                <span className="text-purple-600 font-bold text-xs">
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
              className="w-full px-4 py-2 border border-gray-300 rounded-t-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white border-b-0 text-sm"
            />
            <div className="max-h-36 overflow-y-auto border border-gray-300 rounded-b-lg bg-gray-50">
              {filteredEmployees.length === 0 ? (
                <div className="p-3 text-sm text-gray-500 text-center">
                  No employees found.
                </div>
              ) : (
                filteredEmployees.map((emp) => (
                  <div
                    key={emp.emp_id}
                    onClick={() =>
                      setDocForm({ ...docForm, emp_id: emp.emp_id })
                    }
                    className={`px-4 py-2.5 text-sm cursor-pointer border-b border-gray-100 transition-colors last:border-b-0 ${
                      docForm.emp_id === emp.emp_id
                        ? "bg-purple-100 text-purple-800 font-bold border-l-4 border-l-purple-600"
                        : "hover:bg-gray-100 text-gray-700 border-l-4 border-l-transparent"
                    }`}
                  >
                    <span className="text-gray-500 font-mono text-xs mr-2">
                      {emp.emp_id}
                    </span>
                    {emp.first_name} {emp.last_name}
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-end mb-2 mt-2">
              <label className="text-sm font-semibold text-gray-700">
                Missing Documents
              </label>
              <span className="text-xs text-gray-500">
                Select all that apply
              </span>
            </div>
            <div
              className={`grid grid-cols-2 gap-3 p-4 border rounded-lg ${!docForm.emp_id ? "bg-gray-100 border-gray-200 opacity-60" : "border-gray-300 bg-white"}`}
            >
              {STANDARD_DOCUMENTS.map((docName) => {
                const isChecked = docForm.missing_docs.includes(docName);
                return (
                  <label
                    key={docName}
                    className={`flex items-center gap-2 text-sm cursor-pointer select-none p-1 rounded transition-colors ${isChecked ? "text-purple-700 font-semibold" : "text-gray-700 hover:bg-gray-50"}`}
                  >
                    <input
                      type="checkbox"
                      disabled={!docForm.emp_id}
                      checked={isChecked}
                      onChange={() => handleCheckboxChange(docName)}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 cursor-pointer disabled:cursor-not-allowed"
                    />
                    {docName}
                  </label>
                );
              })}
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Uncheck all boxes to clear the employee from the missing documents
              tracker.
            </p>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-colors border-0"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending || !docForm.emp_id}
              className="flex-1 px-4 py-2 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-colors border-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {mutation.isPending ? "Saving..." : "Save Updates"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
