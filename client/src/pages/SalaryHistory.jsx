import { useState, useEffect } from "react";
import axiosInterceptor from "../hooks/interceptor";
import { mutationHandler } from "@/features/leave/hooks/createMutationHandler";

export default function SalaryHistory() {
  const [selectedEmployee, setSelectedEmployee] = useState("WAH-001");

  const employees = [
    { id: "WAH-001", name: "Jaline Latoga" },
    { id: "WAH-002", name: "Dominic Domantay" },
    { id: "WAH-003", name: "Kevin Greg Alvarado" },
    { id: "WAH-004", name: "Meryll Jen Lee" },
    { id: "WAH-005", name: "Ana Cris Mijares" },
  ];

  const salaryRecords = [
    {
      id: 1,
      date: "2026-03-01",
      type: "Bonus",
      amount: 5000,
      description: "Performance Bonus - Q1",
      newSalary: 25000,
      remarks: "Excellent performance",
    },
    {
      id: 2,
      date: "2026-01-15",
      type: "Increase",
      amount: 1500,
      description: "Annual Salary Review",
      newSalary: 20000,
      remarks: "Promotion to Senior Position",
    },
    {
      id: 3,
      date: "2025-12-01",
      type: "Increase",
      amount: 2000,
      description: "Year-End Bonus",
      newSalary: 18500,
      remarks: "Unused leave payout",
    },
    {
      id: 4,
      date: "2025-10-10",
      type: "Decrease",
      amount: 500,
      description: "Disciplinary Action",
      newSalary: 16500,
      remarks: "Violation of company policy",
    },
    {
      id: 5,
      date: "2025-07-01",
      type: "Increase",
      amount: 1000,
      description: "Mid-Year Adjustment",
      newSalary: 17000,
      remarks: "Cost of living adjustment",
    },
  ];

  const typeColors = {
    Increase: { bg: "bg-green-100", text: "text-green-800", icon: "📈" },
    Decrease: { bg: "bg-red-100", text: "text-red-800", icon: "📉" },
    Bonus: { bg: "bg-blue-100", text: "text-blue-800", icon: "🎁" },
  };

  // 1. Fetch the list of employees on mount for the dropdown
  useEffect(() => {
    (async () => {
      try {
        const { data } = await axiosInterceptor.get("/api/employees");

        if (Array.isArray(data)) {
          setEmployees(data);
          if (data.length > 0) setSelectedEmployee(data[0].emp_id);
        }
      } catch (err) {
        console.error("Error fetching employees:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 2. Fetch salary history whenever the selected employee changes
  useEffect(() => {
    if (!selectedEmployee) return;

    const fetchSalaryHistory = async () => {
      try {
        const res = await axiosInterceptor.get(
          `/api/employees/salary-history/${selectedEmployee}`,
        );

        const data = res.data;

        if (Array.isArray(data)) {
          setSalaryRecords(data);
        } else {
          setSalaryRecords([]);
        }
      } catch (err) {
        console.error("Error fetching salary records:", err);
        setSalaryRecords([]);
      }
    };

    fetchSalaryHistory();
  }, [selectedEmployee]);
  // Calculation helpers (using Number() to handle MySQL DECIMAL strings)
  const getTotalChange = () => {
    return salaryRecords.reduce((sum, record) => {
      return (
        sum + (record.type === "Decrease" ? -record.amount : record.amount)
      );
    }, 0);
  };

  const getTotalIncreases = () => {
    return salaryRecords
      .filter((r) => r.type === "Increase")
      .reduce((sum, r) => sum + r.amount, 0);
  };

  const getIncreaseCount = () => {
    return salaryRecords.filter((r) => r.type === "Increase").length;
  };

  return (
    <div className="max-w-full">
      <h1 className="m-0 text-[1.4rem] font-bold text-white mb-6">
        Salary History
      </h1>

      {/* Employee Selector */}
      <div className="mb-8 rounded-lg border border-gray-200 bg-white shadow-sm p-6">
        <label className="block text-sm font-semibold text-gray-900 mb-3">
          Select Employee
        </label>
        <select
          value={selectedEmployee}
          onChange={(e) => setSelectedEmployee(e.target.value)}
          className="w-full max-w-md border-[1.8px] border-gray-300 rounded-lg px-4 py-2 text-base text-gray-900 outline-none transition-colors focus:border-purple-600"
        >
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.id} - {emp.name}
            </option>
          ))}
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="rounded-lg border-l-4 border-l-blue-500 border border-gray-200 bg-white shadow-sm p-6">
          <p className="m-0 text-sm font-medium text-gray-600 mb-2">
            Current Salary
          </p>
          <p className="m-0 text-3xl font-bold text-blue-600">
            ₱{(25000).toLocaleString()}
          </p>
          <p className="m-0 text-xs text-gray-500 mt-2">As of Latest Record</p>
        </div>

        <div className="rounded-lg border-l-4 border-l-green-500 border border-gray-200 bg-white shadow-sm p-6">
          <p className="m-0 text-sm font-medium text-gray-600 mb-2">
            Total Increases
          </p>
          <p className="m-0 text-3xl font-bold text-green-600">
            +₱{getTotalIncreases().toLocaleString()}
          </p>
          <p className="m-0 text-xs text-gray-500 mt-2">
            {getIncreaseCount()} adjustments
          </p>
        </div>

        <div
          className={`rounded-lg border-l-4 ${getTotalChange() > 0 ? "border-l-green-500" : "border-l-red-500"} border border-gray-200 bg-white shadow-sm p-6`}
        >
          <p className="m-0 text-sm font-medium text-gray-600 mb-2">
            Net Change
          </p>
          <p
            className={`m-0 text-3xl font-bold ${getTotalChange() > 0 ? "text-green-600" : "text-red-600"}`}
          >
            {getTotalChange() > 0 ? "+" : ""}₱
            {getTotalChange().toLocaleString()}
          </p>
          <p className="m-0 text-xs text-gray-500 mt-2">From all adjustments</p>
        </div>
      </div>

      {/* Timeline */}
      <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="m-0 text-lg font-semibold text-gray-900">
            Salary Adjustment History
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  New Salary
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Remarks
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {salaryRecords.map((record) => (
                <tr
                  key={record.id}
                  className="hover:bg-gray-50 transition-colors duration-150"
                >
                  <td className="px-6 py-3 text-sm text-gray-900">
                    {record.date}
                  </td>
                  <td className="px-6 py-3 text-sm">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${typeColors[record.type].bg} ${typeColors[record.type].text}`}
                    >
                      {typeColors[record.type].icon} {record.type}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-700">
                    {record.description}
                  </td>
                  <td className="px-6 py-3 text-sm text-right font-semibold">
                    <span
                      className={
                        record.type === "Decrease"
                          ? "text-red-600"
                          : "text-green-600"
                      }
                    >
                      {record.type === "Decrease" ? "-" : "+"}₱
                      {record.amount.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm text-right font-bold text-gray-900">
                    ₱{record.newSalary.toLocaleString()}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-600">
                    {record.remarks}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
