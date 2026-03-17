import { useState, useEffect } from "react";

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

export default function Payslips() {
  const [payrollData, setPayrollData] = useState([]);
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayroll = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/employees/payroll");
        const data = await res.json();

        if (Array.isArray(data)) {
          setPayrollData(data);
          if (data.length > 0) {
            setSelectedEmpId(data[0].emp_id);
          }
        } else {
          setPayrollData([]);
        }
        setLoading(false);
      } catch (err) {
        console.error("Error fetching payroll for payslips:", err);
        setLoading(false);
      }
    };

    fetchPayroll();
  }, []);

  if (loading)
    return (
      <div className="p-6 font-bold text-gray-900">Loading Payslips...</div>
    );

  if (payrollData.length === 0) {
    return (
      <div className="p-6 text-gray-600">
        No payroll data available. Please generate payroll first.
      </div>
    );
  }

  // Find the selected employee's payroll record
  const currentSlip =
    payrollData.find((p) => p.emp_id === selectedEmpId) || payrollData[0];

  return (
    <div className="max-w-full">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <h1 className="m-0 text-[1.4rem] font-bold text-gray-900">
          Payslip Generation
        </h1>

        <div className="flex items-center gap-4">
          <select
            value={selectedEmpId}
            onChange={(e) => setSelectedEmpId(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-purple-500 bg-white"
          >
            {payrollData.map((p) => (
              <option key={p.emp_id} value={p.emp_id}>
                {p.emp_id} - {p.first_name} {p.last_name}
              </option>
            ))}
          </select>

          <button
            className="px-[22px] py-2.5 rounded-[10px] border-0 text-white text-[0.95rem] font-semibold cursor-pointer bg-gradient-to-r from-purple-600 to-purple-700 hover:opacity-90"
            onClick={() => window.print()}
          >
            ⬇ Download PDF
          </button>
        </div>
      </div>

      {currentSlip && (
        <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm max-w-[800px] print:border-none print:shadow-none">
          <div className="flex items-center gap-4 pb-4 border-b-2 border-purple-600 mb-5">
            <img
              src="/images/wah-logo.png"
              alt="WAH"
              className="w-14 h-14 object-contain"
            />
            <div>
              <h2 className="m-0 text-gray-900 text-[1.3rem]">
                WAH Payroll System
              </h2>
              <p className="mt-0.5 mb-0 text-[0.9rem] text-gray-500">
                Pay Period:{" "}
                {new Date(
                  currentSlip.period_start || Date.now(),
                ).toLocaleString("default", { month: "long", year: "numeric" })}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-6 text-[0.92rem] text-gray-800">
            <div>
              <strong>Employee:</strong> {currentSlip.first_name}{" "}
              {currentSlip.last_name}
            </div>
            <div>
              <strong>ID:</strong> {currentSlip.emp_id}
            </div>
            <div>
              <strong>Designation:</strong> {currentSlip.designation || "N/A"}
            </div>
            <div>
              <strong>Position:</strong> {currentSlip.position || "N/A"}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-7 mb-6">
            <div>
              <h4 className="m-0 mb-3 text-gray-900 border-b border-gray-200 pb-2">
                Earnings
              </h4>
              <div className="flex justify-between py-1.5 text-[0.9rem] text-gray-600">
                <span>Basic Pay</span>
                <span>{fmt(currentSlip.basic_pay)}</span>
              </div>
              <div className="flex justify-between py-1.5 text-[0.9rem] text-gray-600">
                <span>Incentives / Bonuses</span>
                <span>{fmt(currentSlip.incentives)}</span>
              </div>

              <div className="flex justify-between border-t border-gray-300 mt-2 pt-2.5 font-bold text-gray-900">
                <span>Gross Pay</span>
                <span>{fmt(currentSlip.gross_pay)}</span>
              </div>
            </div>
            <div>
              <h4 className="m-0 mb-3 text-gray-900 border-b border-gray-200 pb-2">
                Deductions
              </h4>
              <div className="flex justify-between py-1.5 text-[0.9rem] text-gray-600">
                <span>
                  Absences ({Number(currentSlip.absences_count || 0)} days)
                </span>
                <span className="text-red-600">
                  {fmt(currentSlip.absence_deductions)}
                </span>
              </div>
              <div className="flex justify-between border-t border-gray-300 mt-2 pt-2.5 font-bold text-gray-900">
                <span>Total Deductions</span>
                <span className="text-red-600">
                  {fmt(currentSlip.absence_deductions)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-between px-5 py-4 rounded-[10px] bg-gradient-to-r from-purple-600 to-purple-800 text-white text-[1.3rem] font-bold">
            <span>Net Pay</span>
            <span>{fmt(currentSlip.net_pay)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
