import { useState, Fragment, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import Toast from "../components/Toast";
import { useToast } from "../hooks/useToast";

// --- OFFICIAL DESIGNATIONS & POSITIONS ---
const DESIGNATIONS = {
  Operations: [
    "Supervisor(Finance & Operations)",
    "Assistant Finance & Operations Partner",
    "Admin & Human Resources Partner",
  ],
  "Health Program Partners": [
    "Supervisor(Health Program Partner)",
    "Health Program Partner",
    "Profiler",
  ],
  "Platform Innovation": [
    "Supervisor(Platform Innovation)",
    "Senior Platform Innovation Partner",
    "Platform Innovation Partner",
    "Data Analyst",
    "Business Analyst/Quality Assurance",
  ],
  "Network & System": [
    "Supervisor(Network & Systems)",
    "Network & Systems Partner",
  ],
};

const fmt = (n) => {
  const num = Number(n);
  return isNaN(num)
    ? "₱0.00"
    : "₱" +
        num.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
};

export default function Payroll() {
  const queryClient = useQueryClient();
  const { toast, showToast, clearToast } = useToast();
  const [period, setPeriod] = useState("2026-03");

  // Modal & Form States
  const [adjustmentModal, setAdjustmentModal] = useState(null);
  const [salarySettingsModal, setSalarySettingsModal] = useState(false);

  const [adjustmentType, setAdjustmentType] = useState("Increase");
  const [adjustmentAmount, setAdjustmentAmount] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [selectedEmployees, setSelectedEmployees] = useState(new Set());
  const [bulkAdjustmentMode, setBulkAdjustmentMode] = useState(false);
  const [search, setSearch] = useState("");

  // Salary Settings State (Added designation for cascading dropdowns)
  const [salaryForm, setSalaryForm] = useState({
    designation: "",
    position: "",
    amount: "",
  });

  // Local Cache for Position Salaries so the table updates even if no employees hold the role yet
  const [positionSalaries, setPositionSalaries] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("wah_position_salaries") || "{}");
    } catch {
      return {};
    }
  });

  // --- QUERIES ---
  // 1. Fetch Payroll (Monthly Snapshot)
  const { data: payrollData = [], isLoading: isLoadingPayroll } = useQuery({
    queryKey: ["payroll", period],
    queryFn: async () => {
      const res = await apiFetch(`/api/employees/payroll?period=${period}`);
      if (!res.ok) throw new Error("Failed to fetch payroll");
      return res.json();
    },
  });

  // 2. Fetch Employees (Master Data - Needed for the Live Preview Table)
  const { data: employeesData = [], isLoading: isLoadingEmployees } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const res = await apiFetch("/api/employees");
      if (!res.ok) throw new Error("Failed to fetch employees");
      return res.json();
    },
  });

  // --- MUTATIONS ---
  const adjustmentMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await apiFetch("/api/employees/salary-adjustment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save adjustments");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll"] });
      showToast("Adjustments applied successfully.");
      closeAdjustmentModal();
    },
    onError: () => showToast("Failed to apply adjustments.", "error"),
  });

  const updateBaseSalaryMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await apiFetch("/api/employees/update-base-salary", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to update base salary");
      return res.json();
    },
    onSuccess: (_, variables) => {
      // 1. Refresh server data
      queryClient.invalidateQueries({ queryKey: ["payroll"] });
      queryClient.invalidateQueries({ queryKey: ["employees"] });

      // 2. Save to our local UI Cache so the table updates INSTANTLY
      const updatedSalaries = {
        ...positionSalaries,
        [variables.position]: Number(variables.amount),
      };
      setPositionSalaries(updatedSalaries);
      localStorage.setItem(
        "wah_position_salaries",
        JSON.stringify(updatedSalaries),
      );

      showToast("Base salary updated for selected position.");
      setSalaryForm({ designation: "", position: "", amount: "" });
    },
    onError: () => showToast("Failed to update base salary.", "error"),
  });

  const generatePayrollMutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch("/api/employees/generate-payroll", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ period }),
      });
      if (!res.ok) throw new Error("Failed to generate payroll");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll"] });
      showToast("Payroll calculation generated successfully!");
    },
    onError: (err) =>
      showToast(err.message || "Failed to generate payroll.", "error"),
  });

  // --- HANDLERS ---
  const handleAdjustment = () => {
    if (!adjustmentAmount || !adjustmentReason)
      return showToast("Fill in all fields.", "error");

    const empIds = bulkAdjustmentMode
      ? Array.from(selectedEmployees)
      : [adjustmentModal.emp_id];
    if (empIds.length === 0)
      return showToast("No employees selected.", "error");

    adjustmentMutation.mutate({
      emp_ids: empIds,
      type: adjustmentType,
      amount: adjustmentAmount,
      description: adjustmentReason,
      date: `${period}-01`,
    });
  };

  const handleBaseSalaryUpdate = (e) => {
    e.preventDefault();
    if (!salaryForm.position || !salaryForm.amount)
      return showToast("Fill in all fields.", "error");
    updateBaseSalaryMutation.mutate({
      position: salaryForm.position,
      amount: salaryForm.amount,
    });
  };

  const closeAdjustmentModal = () => {
    setAdjustmentModal(null);
    setAdjustmentAmount("");
    setAdjustmentReason("");
    setSelectedEmployees(new Set());
  };

  const toggleEmployeeSelection = (id) => {
    const newSelected = new Set(selectedEmployees);
    newSelected.has(id) ? newSelected.delete(id) : newSelected.add(id);
    setSelectedEmployees(newSelected);
  };

  const filteredPayroll = payrollData.filter((p) =>
    `${p.first_name} ${p.last_name} ${p.emp_id}`
      .toLowerCase()
      .includes(search?.toLowerCase() || ""),
  );

  if (isLoadingPayroll || isLoadingEmployees)
    return (
      <div className="p-6 text-gray-900 font-bold">Loading Payroll Data...</div>
    );

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6 flex-nowrap">
        <h1 className="m-0 text-[1.4rem] font-bold text-gray-900 whitespace-nowrap flex-shrink-0">
          Salary / Payroll
        </h1>
        <div className="flex items-center gap-3 flex-shrink-0 flex-wrap justify-end">
          <label className="flex items-center gap-2 text-sm text-gray-600 mr-2">
            Period:
            <input
              type="month"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500"
            />
          </label>

          <button
            onClick={() => setSalarySettingsModal(true)}
            className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 text-sm font-semibold cursor-pointer hover:bg-gray-50 transition-colors"
          >
            ⚙️ Salary Settings
          </button>

          <button
            onClick={() => generatePayrollMutation.mutate()}
            disabled={generatePayrollMutation.isPending}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 border-0 text-white text-sm font-semibold cursor-pointer hover:opacity-90 disabled:opacity-50"
          >
            {generatePayrollMutation.isPending
              ? "Calculating..."
              : "🔄 Generate Payroll"}
          </button>

          <button
            onClick={() => {
              setBulkAdjustmentMode(!bulkAdjustmentMode);
              setSelectedEmployees(new Set());
            }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer transition-colors border ${bulkAdjustmentMode ? "bg-purple-600 text-white border-purple-600" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"}`}
          >
            {bulkAdjustmentMode ? "✓ Cancel Bulk" : "Adjust Multiple"}
          </button>
        </div>
      </div>

      <div className="mb-4">
        <input
          type="text"
          className="w-full max-w-[300px] px-4 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="Search employee..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {bulkAdjustmentMode && (
                  <th className="px-6 py-3 text-center w-12">
                    <input
                      type="checkbox"
                      onChange={() =>
                        setSelectedEmployees(
                          selectedEmployees.size === payrollData.length
                            ? new Set()
                            : new Set(payrollData.map((p) => p.emp_id)),
                        )
                      }
                      checked={
                        selectedEmployees.size > 0 &&
                        selectedEmployees.size === payrollData.length
                      }
                      className="w-4 h-4 cursor-pointer"
                    />
                  </th>
                )}
                <th className="px-6 py-3 font-semibold text-gray-700 uppercase tracking-wider text-xs">
                  ID
                </th>
                <th className="px-6 py-3 font-semibold text-gray-700 uppercase tracking-wider text-xs">
                  Name
                </th>
                <th className="px-6 py-3 font-semibold text-gray-700 uppercase tracking-wider text-xs text-right">
                  Basic Pay
                </th>
                <th className="px-6 py-3 font-semibold text-gray-700 uppercase tracking-wider text-xs text-center">
                  Absences
                </th>
                <th className="px-6 py-3 font-semibold text-gray-700 uppercase tracking-wider text-xs text-right">
                  Deductions
                </th>
                <th className="px-6 py-3 font-semibold text-gray-700 uppercase tracking-wider text-xs text-right">
                  Incentives
                </th>
                <th className="px-6 py-3 font-semibold text-gray-700 uppercase tracking-wider text-xs text-right">
                  Net Pay
                </th>
                {!bulkAdjustmentMode && (
                  <th className="px-6 py-3 font-semibold text-gray-700 uppercase tracking-wider text-xs text-right">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPayroll.length === 0 ? (
                <tr>
                  <td
                    colSpan={bulkAdjustmentMode ? 9 : 8}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No payroll records found for {period}. Click "Generate
                    Payroll" to calculate.
                  </td>
                </tr>
              ) : (
                filteredPayroll.map((p) => (
                  <tr
                    key={p.id}
                    className={`hover:bg-gray-50 transition-colors ${selectedEmployees.has(p.emp_id) ? "bg-purple-50" : ""}`}
                  >
                    {bulkAdjustmentMode && (
                      <td className="px-6 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedEmployees.has(p.emp_id)}
                          onChange={() => toggleEmployeeSelection(p.emp_id)}
                          className="w-4 h-4 cursor-pointer"
                        />
                      </td>
                    )}
                    <td className="px-6 py-4">{p.emp_id}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">
                        {p.first_name} {p.last_name}
                      </div>
                      <div className="text-xs text-gray-500 font-normal mt-0.5">
                        {p.position}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">{fmt(p.basic_pay)}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="font-semibold text-gray-800">
                        {p.absences_count}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        Converted:{" "}
                        {Number(p.converted_absences || 0).toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-red-600">
                      {fmt(p.absence_deductions)}
                    </td>
                    <td className="px-6 py-4 text-right text-green-600">
                      +{fmt(p.incentives)}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-purple-700">
                      {fmt(p.net_pay)}
                    </td>
                    {!bulkAdjustmentMode && (
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setAdjustmentModal(p)}
                          className="px-3 py-1.5 rounded-md bg-purple-100 text-purple-700 text-xs font-bold border-0 cursor-pointer hover:bg-purple-200"
                        >
                          Adjust
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {bulkAdjustmentMode && selectedEmployees.size > 0 && (
          <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
            <button
              onClick={() =>
                setAdjustmentModal({
                  name: `${selectedEmployees.size} Employee(s)`,
                  isBulk: true,
                })
              }
              className="px-6 py-2 rounded-lg bg-green-600 text-white text-sm font-bold cursor-pointer hover:bg-green-700 border-0"
            >
              Apply Adjustment to {selectedEmployees.size} Employees
            </button>
          </div>
        )}
      </div>

      {/* Salary Settings Modal (With Grouped Preview Table & Dropdown) */}
      {salarySettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-gray-900 flex justify-between items-center text-white shrink-0">
              <h2 className="text-lg font-bold m-0">
                Position Salary Settings
              </h2>
              <button
                onClick={() => setSalarySettingsModal(false)}
                className="text-white text-2xl bg-transparent border-0 cursor-pointer hover:text-gray-300"
              >
                &times;
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* LEFT: UPDATE FORM */}
                <div className="sticky top-0">
                  <h3 className="text-sm font-bold text-gray-800 uppercase mb-3 border-b border-gray-200 pb-2">
                    Update Base Salary
                  </h3>
                  <p className="text-xs text-gray-600 mb-5">
                    Select a designation and position to enter the new monthly
                    base salary. This will immediately apply to all employees
                    currently holding this position.
                  </p>
                  <form onSubmit={handleBaseSalaryUpdate} className="space-y-5">
                    {/* DESIGNATION DROPDOWN */}
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                        Select Designation (Optional Filter)
                      </label>
                      <select
                        value={salaryForm.designation}
                        onChange={(e) =>
                          setSalaryForm({
                            ...salaryForm,
                            designation: e.target.value,
                            position: "", // Reset position when designation changes
                          })
                        }
                        className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                      >
                        <option value="">All Designations</option>
                        {Object.keys(DESIGNATIONS).map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* POSITION DROPDOWN */}
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                        Select Position
                      </label>
                      <select
                        required
                        value={salaryForm.position}
                        onChange={(e) =>
                          setSalaryForm({
                            ...salaryForm,
                            position: e.target.value,
                          })
                        }
                        className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                      >
                        <option value="" disabled>
                          Choose Position...
                        </option>
                        {salaryForm.designation
                          ? // Show only positions for the selected designation
                            DESIGNATIONS[salaryForm.designation].map((pos) => (
                              <option key={pos} value={pos}>
                                {pos}
                              </option>
                            ))
                          : // Show all positions grouped if no designation is selected
                            Object.entries(DESIGNATIONS).map(
                              ([dept, positions]) => (
                                <optgroup key={dept} label={dept}>
                                  {positions.map((pos) => (
                                    <option key={pos} value={pos}>
                                      {pos}
                                    </option>
                                  ))}
                                </optgroup>
                              ),
                            )}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                        New Monthly Base Salary
                      </label>
                      <input
                        required
                        type="number"
                        min="0"
                        step="0.01"
                        value={salaryForm.amount}
                        onChange={(e) =>
                          setSalaryForm({
                            ...salaryForm,
                            amount: e.target.value,
                          })
                        }
                        placeholder="e.g. 25000"
                        className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div className="pt-4 flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setSalarySettingsModal(false);
                          setSalaryForm({
                            designation: "",
                            position: "",
                            amount: "",
                          });
                        }}
                        className="flex-1 py-2 border border-gray-300 rounded-lg font-semibold text-gray-600 bg-white cursor-pointer hover:bg-gray-50"
                      >
                        Close
                      </button>
                      <button
                        type="submit"
                        disabled={updateBaseSalaryMutation.isPending}
                        className="flex-1 py-2 bg-purple-600 text-white rounded-lg font-semibold cursor-pointer border-0 hover:bg-purple-700 disabled:opacity-50"
                      >
                        {updateBaseSalaryMutation.isPending
                          ? "Updating..."
                          : "Update All"}
                      </button>
                    </div>
                  </form>
                </div>

                {/* RIGHT: CURRENT SALARY PREVIEW TABLE (GROUPED) */}
                <div>
                  <h3 className="text-sm font-bold text-gray-800 uppercase mb-3 border-b border-gray-200 pb-2">
                    Current Base Salaries Preview
                  </h3>
                  <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 font-semibold text-gray-600">
                            Position
                          </th>
                          <th className="px-4 py-2 font-semibold text-gray-600 text-right w-32">
                            Base Salary
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {Object.entries(DESIGNATIONS).map(
                          ([dept, positions]) => (
                            <Fragment key={dept}>
                              {/* Group Header */}
                              <tr className="bg-purple-50/50">
                                <td
                                  colSpan="2"
                                  className="px-4 py-1.5 font-bold text-purple-800 text-[10px] uppercase tracking-wider"
                                >
                                  {dept}
                                </td>
                              </tr>
                              {/* Position Rows */}
                              {positions.map((pos) => {
                                // Look at the DB Employee Data
                                const emp = employeesData.find(
                                  (e) =>
                                    e.position?.trim().toLowerCase() ===
                                    pos.trim().toLowerCase(),
                                );

                                // Check if it's cached locally OR in the DB
                                const actualSalary =
                                  emp?.basic_pay > 0 ? emp.basic_pay : null;
                                const salary =
                                  positionSalaries[pos] || actualSalary;

                                return (
                                  <tr key={pos} className="hover:bg-gray-50">
                                    <td className="px-4 py-2 text-gray-800 text-xs font-medium pl-6">
                                      {pos}
                                    </td>
                                    <td className="px-4 py-2 text-right font-bold text-purple-700 text-xs">
                                      {salary !== null &&
                                      salary !== undefined &&
                                      salary > 0 ? (
                                        fmt(salary)
                                      ) : (
                                        <span className="text-gray-400 italic font-normal">
                                          Not Set
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </Fragment>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-[0.65rem] text-gray-500 mt-2 italic text-right leading-tight">
                    * Displays the active base salary. "Not Set" indicates this
                    position has not been configured yet.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Adjustment Modal */}
      {adjustmentModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-700 flex justify-between items-center text-white">
              <h2 className="text-lg font-semibold m-0">
                {bulkAdjustmentMode ? "Bulk Adjustment" : "Adjust Salary"}
              </h2>
              <button
                onClick={closeAdjustmentModal}
                className="text-white text-2xl bg-transparent border-0 cursor-pointer"
              >
                &times;
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm font-bold text-gray-700">
                {bulkAdjustmentMode
                  ? `${selectedEmployees.size} selected`
                  : `${adjustmentModal.first_name} ${adjustmentModal.last_name}`}
              </p>
              <select
                value={adjustmentType}
                onChange={(e) => setAdjustmentType(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-purple-600 bg-white"
              >
                <option value="Increase">Increase (Raise)</option>
                <option value="Bonus">Bonus</option>
                <option value="Decrease">Decrease</option>
              </select>
              <input
                type="number"
                value={adjustmentAmount}
                onChange={(e) => setAdjustmentAmount(e.target.value)}
                placeholder="Amount (₱)"
                className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-purple-600"
              />
              <textarea
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                placeholder="Reason..."
                rows={3}
                className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-purple-600"
              />
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={closeAdjustmentModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 font-medium cursor-pointer hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdjustment}
                  disabled={adjustmentMutation.isPending}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium cursor-pointer border-0 hover:bg-purple-700"
                >
                  {adjustmentMutation.isPending ? "Applying..." : "Apply"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Toast toast={toast} onClose={clearToast} />
    </div>
  );
}
