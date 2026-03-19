import { useState } from "react";
import { URL } from "../assets/constant";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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
  const [period, setPeriod] = useState("2026-03");

  // Modal & Form States
  const [adjustmentModal, setAdjustmentModal] = useState(null);
  const [salarySettingsModal, setSalarySettingsModal] = useState(false);

  const [adjustmentType, setAdjustmentType] = useState("Increase");
  const [adjustmentAmount, setAdjustmentAmount] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [selectedEmployees, setSelectedEmployees] = useState(new Set());
  const [bulkAdjustmentMode, setBulkAdjustmentMode] = useState(false);

  // Salary Settings State
  const [salaryForm, setSalaryForm] = useState({ position: "", amount: "" });

  // --- QUERIES ---
  const { data: payrollData = [], isLoading } = useQuery({
    queryKey: ["payroll", period],
    queryFn: async () => {
      const res = await fetch(`${URL}/api/employees/payroll?period=${period}`, {
        headers: {
          "ngrok-skip-browser-warning": "69420",
          "bypass-tunnel-reminder": "true",
        },
      });
      if (!res.ok) throw new Error("Failed to fetch payroll");
      return res.json();
    },
  });

  // Extract unique positions for the salary settings modal
  const positions = [...new Set(payrollData.map((p) => p.position))].filter(
    Boolean,
  );

  // --- MUTATIONS ---
  const adjustmentMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await fetch(`${URL}/api/employees/salary-adjustment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "69420",
          "bypass-tunnel-reminder": "true",
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save adjustments");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["payroll"]);
      alert("Adjustments applied successfully!");
      closeAdjustmentModal();
    },
  });

  const updateBaseSalaryMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await fetch(`${URL}/api/employees/update-base-salary`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "69420",
          "bypass-tunnel-reminder": "true",
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to update base salary");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["payroll"]);
      alert("Base salary updated for all employees in this position!");
      setSalarySettingsModal(false);
      setSalaryForm({ position: "", amount: "" });
    },
  });

  // --- HANDLERS ---
  const handleAdjustment = () => {
    if (!adjustmentAmount || !adjustmentReason)
      return alert("Fill in all fields");

    const empIds = bulkAdjustmentMode
      ? Array.from(selectedEmployees)
      : [adjustmentModal.emp_id];
    if (empIds.length === 0) return alert("No employees selected");

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
      return alert("Fill in all fields");
    updateBaseSalaryMutation.mutate(salaryForm);
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

  if (isLoading)
    return (
      <div className="p-6 text-gray-900 font-bold">Loading Payroll Data...</div>
    );

  return (
    <div className="max-w-full">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <h1 className="m-0 text-[1.4rem] font-bold text-gray-900">
          Salary / Payroll
        </h1>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600">
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
            ⚙ Salary Settings
          </button>

          <button
            onClick={() => {
              setBulkAdjustmentMode(!bulkAdjustmentMode);
              setSelectedEmployees(new Set());
            }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer transition-colors border ${bulkAdjustmentMode ? "bg-purple-600 text-white border-purple-600" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"}`}
          >
            {bulkAdjustmentMode ? "✓ Adjust Multiple" : "Adjust Multiple"}
          </button>

          {bulkAdjustmentMode && selectedEmployees.size > 0 && (
            <button
              onClick={() =>
                setAdjustmentModal({
                  name: `${selectedEmployees.size} Employee(s)`,
                  isBulk: true,
                })
              }
              className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold cursor-pointer hover:bg-green-700 border-0"
            >
              Adjust {selectedEmployees.size}
            </button>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {bulkAdjustmentMode && (
                  <th className="px-6 py-3 text-center">
                    <input
                      type="checkbox"
                      onChange={() =>
                        setSelectedEmployees(
                          selectedEmployees.size === payrollData.length
                            ? new Set()
                            : new Set(payrollData.map((p) => p.emp_id)),
                        )
                      }
                      checked={selectedEmployees.size === payrollData.length}
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
                  <th className="px-6 py-3 font-semibold text-gray-700 uppercase tracking-wider text-xs">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {payrollData.map((p) => (
                <tr
                  key={p.emp_id}
                  className={`hover:bg-gray-50 transition-colors ${selectedEmployees.has(p.emp_id) ? "bg-purple-50" : ""}`}
                >
                  {bulkAdjustmentMode && (
                    <td className="px-6 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedEmployees.has(p.emp_id)}
                        onChange={() => toggleEmployeeSelection(p.emp_id)}
                      />
                    </td>
                  )}
                  <td className="px-6 py-3">{p.emp_id}</td>
                  <td className="px-6 py-3 font-semibold">
                    {p.first_name} {p.last_name}
                  </td>
                  <td className="px-6 py-3 text-right">{fmt(p.basic_pay)}</td>
                  <td className="px-6 py-3 text-center">{p.absences_count}</td>
                  <td className="px-6 py-3 text-right text-red-600">
                    {fmt(p.absence_deductions)}
                  </td>
                  <td className="px-6 py-3 text-right text-green-600">
                    {fmt(p.incentives)}
                  </td>
                  <td className="px-6 py-3 text-right font-bold text-purple-700">
                    {fmt(p.net_pay)}
                  </td>
                  {!bulkAdjustmentMode && (
                    <td className="px-6 py-3">
                      <button
                        onClick={() => setAdjustmentModal(p)}
                        className="px-3 py-1 rounded bg-purple-100 text-purple-700 text-xs font-bold border-0 cursor-pointer"
                      >
                        Adjust
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Salary Settings Modal (Base Salary Update) */}
      {salarySettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden">
            <div className="px-6 py-4 bg-gray-900 flex justify-between items-center text-white">
              <h2 className="text-lg font-bold m-0">Update Position Salary</h2>
              <button
                onClick={() => setSalarySettingsModal(false)}
                className="text-white text-2xl bg-transparent border-0 cursor-pointer"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleBaseSalaryUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Select Position
                </label>
                <select
                  required
                  value={salaryForm.position}
                  onChange={(e) =>
                    setSalaryForm({ ...salaryForm, position: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Choose Position...</option>
                  {positions.map((pos) => (
                    <option key={pos} value={pos}>
                      {pos}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  New Monthly Base Salary
                </label>
                <input
                  required
                  type="number"
                  value={salaryForm.amount}
                  onChange={(e) =>
                    setSalaryForm({ ...salaryForm, amount: e.target.value })
                  }
                  placeholder="e.g. 25000"
                  className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setSalarySettingsModal(false)}
                  className="flex-1 py-2 border border-gray-300 rounded-lg font-semibold text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateBaseSalaryMutation.isPending}
                  className="flex-1 py-2 bg-purple-600 text-white rounded-lg font-semibold"
                >
                  {updateBaseSalaryMutation.isPending
                    ? "Updating..."
                    : "Update All"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjustment Modal (Same UI as provided) */}
      {adjustmentModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
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
                className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-purple-600"
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
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdjustment}
                  disabled={adjustmentMutation.isPending}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium"
                >
                  {adjustmentMutation.isPending ? "Applying..." : "Apply"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
