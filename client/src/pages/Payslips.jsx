import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";

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
  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("wah_user") || "{}");
    } catch {
      return {};
    }
  }, []);

  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const isAdmin = currentUser?.role === "Admin";

  const quickPeriods = useMemo(() => {
    const months = [];
    const now = new Date();

    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleString("default", {
        month: "short",
        year: "2-digit",
      });
      months.push({ value, label });
    }

    return months;
  }, []);

  const { data: payrollData = [], isLoading } = useQuery({
    queryKey: ["payroll", period],
    queryFn: async () => {
      const res = await apiFetch(`/api/employees/payroll?period=${period}`);
      if (!res.ok) throw new Error("Failed to fetch payroll");
      return res.json();
    },
  });

  if (isLoading)
    return (
      <div className="p-6 font-bold text-gray-900">Loading your payslip...</div>
    );

  if (isAdmin) {
    return (
      <div className="max-w-full">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="m-0 text-[1.3rem] font-bold text-gray-900">
            Personal Payslip
          </h1>
          <p className="m-0 mt-2 text-sm text-gray-600">
            Personal payslip view is not available for Admin accounts.
          </p>
        </div>
      </div>
    );
  }

  const currentSlip = payrollData.find((p) => p.emp_id === currentUser.emp_id);
  const payPeriodLabel = new Date(
    currentSlip?.period_start || `${period}-01`,
  ).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const incentiveTypeLines = currentSlip?.incentive_reasons
    ? String(currentSlip.incentive_reasons)
        .split(" | ")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

  const deductionTypeLines = currentSlip?.deduction_reasons
    ? String(currentSlip.deduction_reasons)
        .split(" | ")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

  const payItems = currentSlip
    ? [
        {
          key: "basic-pay",
          label: "Basic Pay",
          amount: Number(currentSlip.basic_pay || 0),
          tone: "text-slate-800",
        },
        {
          key: "incentives",
          label: "Incentives / Bonuses",
          amount: Number(currentSlip.incentives || 0),
          tone: "text-green-700",
          prefix: "+",
        },
        {
          key: "deductions",
          label: "Deductions",
          amount: Number(currentSlip.absence_deductions || 0),
          tone: "text-red-700",
          prefix: "-",
        },
      ]
    : [];

  const handleDownload = () => window.print();

  return (
    <div className="relative max-w-full space-y-5">
      <style>
        {`
          @media print {
            @page { size: auto; margin: 14mm; }
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              background-color: white !important;
            }
            aside, nav, header { display: none !important; }
            .print-hidden { display: none !important; }
            .print-container {
              position: fixed;
              inset: 0;
              z-index: 9999;
              width: 100%;
              max-width: 100%;
              border: none !important;
              box-shadow: none !important;
              border-radius: 0 !important;
              padding: 0 !important;
              margin: 0 !important;
            }
          }
        `}
      </style>

      <div className="print-hidden flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
        <h1 className="m-0 text-[1.4rem] font-bold text-gray-900">
          My Payslips
        </h1>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            Pay Period:
            <input
              type="month"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-normal outline-none focus:ring-2 focus:ring-sky-400"
            />
          </label>

          <button
            className="cursor-pointer rounded-lg border-0 bg-[#0099ff] px-5 py-2.5 text-[0.92rem] font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
            onClick={handleDownload}
            disabled={!currentSlip}
          >
            Download Payslip PDF
          </button>
        </div>
      </div>

      <div className="print-hidden flex flex-wrap gap-2">
        {quickPeriods.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setPeriod(item.value)}
            className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${period === item.value ? "border-sky-600 bg-sky-600 text-white" : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {!currentSlip ? (
        <div className="print-hidden rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-600 shadow-sm">
          <p className="mb-1 text-lg font-semibold text-gray-800">
            No Payslip Found
          </p>
          <p className="text-sm">
            Your payslip for{" "}
            {new Date(`${period}-01`).toLocaleString("default", {
              month: "long",
              year: "numeric",
            })}{" "}
            has not been generated by HR yet.
          </p>
        </div>
      ) : (
        <>
          <div className="print-hidden grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-lg border border-sky-100 bg-sky-50 p-3">
              <p className="m-0 text-[11px] font-bold uppercase tracking-wider text-sky-700">
                Pay Period
              </p>
              <p className="m-0 mt-1 text-sm font-semibold text-sky-900">
                {payPeriodLabel}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <p className="m-0 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Gross Pay
              </p>
              <p className="m-0 mt-1 text-sm font-bold text-slate-900">
                {fmt(currentSlip.gross_pay)}
              </p>
            </div>
            <div className="rounded-lg border border-red-100 bg-red-50 p-3">
              <p className="m-0 text-[11px] font-bold uppercase tracking-wider text-red-700">
                Deductions
              </p>
              <p className="m-0 mt-1 text-sm font-bold text-red-700">
                -{fmt(currentSlip.absence_deductions)}
              </p>
            </div>
            <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3">
              <p className="m-0 text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                Net Pay
              </p>
              <p className="m-0 mt-1 text-sm font-black text-emerald-700">
                {fmt(currentSlip.net_pay)}
              </p>
            </div>
          </div>

          <div className="print-container max-w-[860px] rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <img
                  src="/images/wah-logo.png"
                  alt="WAH"
                  className="h-11 w-11 object-contain"
                />
                <div>
                  <h2 className="m-0 text-lg font-bold text-slate-900">
                    WAH Payroll System
                  </h2>
                  <p className="m-0 mt-0.5 text-xs font-medium uppercase tracking-wider text-slate-500">
                    Employee Payslip
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="m-0 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Pay Period
                </p>
                <p className="m-0 mt-1 text-sm font-semibold text-slate-900">
                  {payPeriodLabel}
                </p>
              </div>
            </div>

            <div className="mb-5 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="m-0 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Employee Name
                </p>
                <p className="m-0 mt-1 font-semibold text-slate-900">
                  {currentSlip.first_name} {currentSlip.last_name}
                </p>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="m-0 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Employee ID
                </p>
                <p className="m-0 mt-1 font-semibold text-slate-900">
                  {currentSlip.emp_id}
                </p>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="m-0 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Designation
                </p>
                <p className="m-0 mt-1 font-semibold text-slate-900">
                  {currentSlip.designation || "N/A"}
                </p>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="m-0 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Position
                </p>
                <p className="m-0 mt-1 font-semibold text-slate-900">
                  {currentSlip.position || "N/A"}
                </p>
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Description
                    </th>
                    <th className="px-4 py-2 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {payItems.map((item) => (
                    <tr key={item.key}>
                      <td className="px-4 py-2.5 text-slate-700">
                        <p className="m-0">{item.label}</p>
                        {item.key === "deductions" && (
                          <div className="mt-1 space-y-0.5">
                            {deductionTypeLines.length === 0 ? (
                              <p className="m-0 text-[11px] text-red-700/80">
                                Deduction types: None
                              </p>
                            ) : (
                              deductionTypeLines.map((line, index) => (
                                <p
                                  key={`deduction-type-inline-${index}`}
                                  className="m-0 text-[11px] text-red-700/80"
                                >
                                  - {line}
                                </p>
                              ))
                            )}
                          </div>
                        )}
                        {item.key === "incentives" && (
                          <div className="mt-1 space-y-0.5">
                            {incentiveTypeLines.length === 0 ? (
                              <p className="m-0 text-[11px] text-emerald-700/80">
                                Incentive types: None
                              </p>
                            ) : (
                              incentiveTypeLines.map((line, index) => (
                                <p
                                  key={`incentive-type-inline-${index}`}
                                  className="m-0 text-[11px] text-emerald-700/80"
                                >
                                  + {line}
                                </p>
                              ))
                            )}
                          </div>
                        )}
                      </td>
                      <td
                        className={`px-4 py-2.5 text-right font-semibold ${item.tone}`}
                      >
                        {item.prefix || ""}
                        {fmt(item.amount)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50">
                    <td className="px-4 py-3 text-sm font-bold uppercase tracking-wide text-slate-700">
                      Net Pay
                    </td>
                    <td className="px-4 py-3 text-right text-base font-black text-emerald-700">
                      {fmt(currentSlip.net_pay)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-8 hidden print:block">
              <div className="flex items-center justify-between">
                <div className="w-60 text-center">
                  <div className="mb-2 border-b border-gray-400" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                    Employer Signature
                  </span>
                </div>
                <div className="w-60 text-center">
                  <div className="mb-2 border-b border-gray-400" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                    Employee Signature
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
