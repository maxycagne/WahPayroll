import { useState, useEffect } from "react";
import { URL } from "../assets/constant";

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
  const [period, setPeriod] = useState("2026-03");
  const [payrollData, setPayrollData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal & Form States
  const [adjustmentModal, setAdjustmentModal] = useState(null);
  const [adjustmentType, setAdjustmentType] = useState("Increase"); // matches DB ENUM/Values
  const [adjustmentAmount, setAdjustmentAmount] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [selectedEmployees, setSelectedEmployees] = useState(new Set());
  const [bulkAdjustmentMode, setBulkAdjustmentMode] = useState(false);

  // Fetch Payroll Data
  const fetchPayroll = async () => {
    try {
      const res = await fetch(`${URL}/api/employees/payroll`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "69420",
        },
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setPayrollData(data);
      } else {
        setPayrollData([]);
      }
      setLoading(false);
    } catch (err) {
      console.error("Error fetching payroll:", err);
      setPayrollData([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayroll();
  }, []);

  // Handle saving the adjustment to the database
  const handleAdjustment = async () => {
    if (!adjustmentAmount || !adjustmentReason) {
      alert("Please fill in all fields");
      return;
    }

    let empIdsToAdjust = [];

    if (bulkAdjustmentMode) {
      if (selectedEmployees.size === 0) {
        alert("Please select at least one employee");
        return;
      }
      empIdsToAdjust = Array.from(selectedEmployees);
    } else {
      empIdsToAdjust = [adjustmentModal.emp_id];
    }

    try {
      const res = await fetch(`${URL}/api/employees/salary-adjustment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "69420",
        },
        body: JSON.stringify({
          emp_ids: empIdsToAdjust,
          type:
            adjustmentType.charAt(0).toUpperCase() + adjustmentType.slice(1),
          amount: adjustmentAmount,
          description: adjustmentReason,
          date: `${period}-01`, // Use selected period as effective date
        }),
      });

      if (res.ok) {
        alert(
          `Successfully applied ${adjustmentType} to ${empIdsToAdjust.length} employee(s)!`,
        );
        setAdjustmentModal(null);
        setAdjustmentAmount("");
        setAdjustmentReason("");
        setSelectedEmployees(new Set());
        fetchPayroll(); // Refresh table if needed
      } else {
        alert("Failed to save adjustments.");
      }
    } catch (error) {
      console.error("Error saving adjustment:", error);
    }
  };

  const toggleEmployeeSelection = (id) => {
    const newSelected = new Set(selectedEmployees);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedEmployees(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedEmployees.size === payrollData.length) {
      setSelectedEmployees(new Set());
    } else {
      setSelectedEmployees(new Set(payrollData.map((p) => p.emp_id)));
    }
  };

  if (loading)
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
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </label>
          <button className="px-5 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 border-0 text-white text-sm font-semibold cursor-pointer hover:opacity-90 transition-opacity">
            Calculate All
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
              className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold cursor-pointer hover:bg-green-700 transition-colors border-0"
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
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700">
                    <input
                      type="checkbox"
                      checked={
                        selectedEmployees.size === payrollData.length &&
                        payrollData.length > 0
                      }
                      onChange={toggleSelectAll}
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
                  Gross Pay
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
                  className={`hover:bg-gray-50 transition-colors duration-150 ${bulkAdjustmentMode && selectedEmployees.has(p.emp_id) ? "bg-purple-50" : ""}`}
                >
                  {bulkAdjustmentMode && (
                    <td className="px-6 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedEmployees.has(p.emp_id)}
                        onChange={() => toggleEmployeeSelection(p.emp_id)}
                        className="w-4 h-4 cursor-pointer"
                      />
                    </td>
                  )}
                  <td className="px-6 py-3 text-sm text-gray-900">
                    {p.emp_id}
                  </td>
                  <td className="px-6 py-3 text-sm font-semibold text-gray-700">
                    {p.first_name} {p.last_name}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-700 text-right">
                    {fmt(p.basic_pay)}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-700 text-center">
                    {Number(p.absences_count)}
                  </td>
                  <td className="px-6 py-3 text-sm text-red-600 text-right">
                    {fmt(p.absence_deductions)}
                  </td>
                  <td className="px-6 py-3 text-sm text-green-600 text-right">
                    {fmt(p.incentives)}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-700 text-right">
                    {fmt(p.gross_pay)}
                  </td>
                  <td className="px-6 py-3 text-sm font-bold text-purple-700 text-right bg-purple-50/30">
                    {fmt(p.net_pay)}
                  </td>
                  {!bulkAdjustmentMode && (
                    <td className="px-6 py-3 text-sm">
                      <button
                        onClick={() =>
                          setAdjustmentModal({
                            ...p,
                            name: `${p.first_name} ${p.last_name}`,
                          })
                        }
                        className="px-3 py-1 rounded-lg bg-purple-100 text-purple-700 text-xs font-semibold cursor-pointer hover:bg-purple-200 transition-colors border-0"
                      >
                        Adjust
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100 border-t-2 border-gray-300">
                {bulkAdjustmentMode && <td className="px-6 py-3"></td>}
                <td
                  colSpan={bulkAdjustmentMode ? 6 : 7}
                  className="px-6 py-4 text-right text-sm font-bold text-gray-900"
                >
                  Total Net Payroll
                </td>
                <td className="px-6 py-4 text-sm font-black text-purple-800 text-right">
                  {fmt(
                    payrollData.reduce((s, p) => s + Number(p.net_pay || 0), 0),
                  )}
                </td>
                {!bulkAdjustmentMode && <td className="px-6 py-4"></td>}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Salary Adjustment Modal */}
      {adjustmentModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50"
          onClick={() => setAdjustmentModal(null)}
        >
          <div
            className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 border border-gray-200 bg-white p-0 shadow-lg rounded-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-purple-200 px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-700">
              <h2 className="m-0 text-lg font-semibold text-white">
                {bulkAdjustmentMode
                  ? "Adjust Multiple Employees"
                  : "Adjust Salary"}
              </h2>
              <button
                type="button"
                onClick={() => setAdjustmentModal(null)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-sm opacity-70 text-white/80 hover:text-white transition-opacity cursor-pointer border-0 bg-transparent"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-4">
              <p className="m-0 text-sm font-semibold text-gray-900 mb-4">
                {bulkAdjustmentMode
                  ? `Applying to ${selectedEmployees.size} employee(s)`
                  : adjustmentModal.name}
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Adjustment Type
                  </label>
                  <select
                    value={adjustmentType}
                    onChange={(e) => setAdjustmentType(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-base text-gray-900 outline-none focus:ring-2 focus:ring-purple-600"
                  >
                    <option value="Increase">Increase (Salary Raise)</option>
                    <option value="Bonus">Bonus</option>
                    <option value="Decrease">Decrease</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Amount (₱)
                  </label>
                  <input
                    type="number"
                    value={adjustmentAmount}
                    onChange={(e) => setAdjustmentAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-base text-gray-900 outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Reason / Notes
                  </label>
                  <textarea
                    value={adjustmentReason}
                    onChange={(e) => setAdjustmentReason(e.target.value)}
                    placeholder="Enter reason for adjustment"
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-base text-gray-900 outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4 bg-gray-50">
              <button
                type="button"
                onClick={() => setAdjustmentModal(null)}
                className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAdjustment}
                className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-purple-700 shadow-sm hover:opacity-90 transition-opacity cursor-pointer border-0"
              >
                Apply Adjustment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
