import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { mutationHandler } from "@/features/leave/hooks/createMutationHandler";
import axiosInterceptor from "@/hooks/interceptor";

const fmt = (n) => {
  if (n === null || n === undefined || n === "") return "-";
  const num = Number(n);
  return isNaN(num)
    ? "-"
    : "₱" +
        num.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
};

const fmtPeso = (n) => {
  if (n === null || n === undefined || n === "") return "-";
  const num = Number(n);
  return isNaN(num)
    ? "-"
    : `₱${num.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
};

const TOP_PDF_LOGO = "/images/wah-top-logo.png";
const DEFAULT_PDF_LOGO = "/images/wah-logo.png";

function parseReasonAmountPair(rawLine) {
  const line = String(rawLine || "").trim();
  if (!line) return { label: "", amount: null };

  const parts = line.split("=");
  if (parts.length >= 2) {
    const label = parts.shift()?.trim() || "";
    const rawAmount = parts
      .join("=")
      .trim()
      .replace(/^₱/, "")
      .replace(/,/g, "");
    const numericAmount = Number(rawAmount);
    return {
      label,
      amount: Number.isFinite(numericAmount) ? numericAmount : null,
    };
  }

  return { label: line, amount: null };
}

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

  const { data: responseData, isLoading } = useQuery({
    queryKey: ["payroll", period, currentUser?.emp_id],
    queryFn: async () => {
      const params = new URLSearchParams({
        period,
        search: currentUser?.emp_id || ""
      });
      return mutationHandler(
        axiosInterceptor.get(`/api/employees/payroll?${params.toString()}`),
      );
    },
    enabled: !!currentUser?.emp_id,
  });

  const payrollData = responseData?.data || [];

  if (isLoading)
    return (
      <div className="p-6 font-bold text-gray-900 dark:text-gray-100">Loading your payslip...</div>
    );

  if (isAdmin) {
    return (
      <div className="max-w-full">
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
          <h1 className="m-0 text-[1.3rem] font-bold text-gray-900 dark:text-gray-100">
            Personal Payslip
          </h1>
          <p className="m-0 mt-2 text-sm text-gray-600 dark:text-gray-400">
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

  const incentiveDisplayItems = incentiveTypeLines
    .map((line) => parseReasonAmountPair(line))
    .filter((item) => item.label);

  const deductionDisplayItems = deductionTypeLines
    .map((line) => parseReasonAmountPair(line))
    .filter((item) => item.label);

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
            @page { size: auto; margin: 0; }
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
              border: 1.5px solid #334155 !important;
              box-shadow: none !important;
              border-radius: 0 !important;
              padding: 0 !important;
              margin: 0 !important;
            }
            .print-watermark {
              opacity: 0.06 !important;
            }
          }
        `}
      </style>

      <div className="print-hidden flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3 shadow-sm">
        <h1 className="m-0 text-[1.4rem] font-bold text-gray-900 dark:text-gray-100">
          My Payslips
        </h1>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
            Pay Period:
            <input
              type="month"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-normal outline-none focus:ring-2 focus:ring-sky-400 dark:text-gray-100"
            />
          </label>

            <button
              className="cursor-pointer rounded-lg border-0 bg-sky-600 px-5 py-2.5 text-[0.92rem] font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
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
            className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${period === item.value ? "border-sky-600 bg-sky-600 text-white" : "border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {!currentSlip ? (
        <div className="print-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 text-center text-gray-600 dark:text-gray-400 shadow-sm">
          <p className="mb-1 text-lg font-semibold text-gray-800 dark:text-gray-100">
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
            <div className="rounded-lg border border-sky-100 dark:border-sky-900/30 bg-sky-50 dark:bg-sky-900/10 p-3">
              <p className="m-0 text-[11px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400">
                Pay Period
              </p>
              <p className="m-0 mt-1 text-sm font-semibold text-sky-900 dark:text-sky-200">
                {payPeriodLabel}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3">
              <p className="m-0 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">
                Gross Pay
              </p>
              <p className="m-0 mt-1 text-sm font-bold text-slate-900 dark:text-gray-100">
                {fmt(currentSlip.gross_pay)}
              </p>
            </div>
            <div className="rounded-lg border border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 p-3">
              <p className="m-0 text-[11px] font-bold uppercase tracking-wider text-red-700 dark:text-red-400">
                Deductions
              </p>
              <p className="m-0 mt-1 text-sm font-bold text-red-700 dark:text-red-400">
                -{fmt(currentSlip.absence_deductions)}
              </p>
            </div>
            <div className="rounded-lg border border-emerald-100 dark:border-emerald-900/30 bg-emerald-50 dark:bg-emerald-900/10 p-3">
              <p className="m-0 text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                Net Pay
              </p>
              <p className="m-0 mt-1 text-sm font-black text-emerald-700 dark:text-emerald-400">
                {fmt(currentSlip.net_pay)}
              </p>
            </div>
          </div>

          <div
            className="print-container relative mx-auto max-w-[860px] overflow-hidden rounded-none border border-gray-700 bg-white p-0 text-slate-900 shadow-sm"
            style={{ fontFamily: '"Courier New", Courier, monospace' }}
          >
            <img
              src="/images/wah-logo.png"
              alt="WAH watermark"
              className="print-watermark pointer-events-none absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2 object-contain"
              style={{ opacity: 0.06, width: '60%', maxHeight: '60%' }}
            />

            <div className="relative z-10 flex items-center border-b border-gray-700 px-4 py-5">
              <div className="flex items-center justify-start pl-1">
                <img
                  src={TOP_PDF_LOGO}
                  alt="WAH"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = DEFAULT_PDF_LOGO;
                  }}
                  className="h-28 w-auto max-w-[220px] object-contain"
                />
              </div>
              <p className="absolute left-1/2 m-0 -translate-x-1/2 text-center text-[15px] font-semibold text-slate-900">
                Wireless for Health Initiative, Inc.
              </p>
              <p className="absolute left-1/2 top-[68%] m-0 -translate-x-1/2 text-center text-[11px] text-slate-600">
                Romulo Blvd, San Vicente, Tarlac City, Philippines
              </p>
            </div>

            <div className="relative z-10 border-b border-gray-700 px-6 py-5 text-[32px]">
              <p className="m-0 text-[15px]">
                <span className="font-bold">PAYROLL PERIOD:</span>{" "}
                {payPeriodLabel}
              </p>
              <p className="m-0 mt-1 text-[15px]">
                <span className="font-bold">EMPLOYEE NAME:</span>{" "}
                {currentSlip.last_name}, {currentSlip.first_name}
              </p>
            </div>

            <div className="relative z-10 grid grid-cols-2 border-b border-gray-700 text-[14px]">
              <div className="border-r border-gray-700 px-4 py-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="m-0 text-[14px] font-bold">
                    EARNINGS & ALLOWANCES
                  </p>
                  <p className="m-0 text-[14px] font-bold">PHP</p>
                </div>

                <div className="space-y-1 text-[15px]">
                  <div className="flex items-start justify-between gap-3">
                    <span>Basic Pay</span>
                    <span>{fmtPeso(currentSlip.basic_pay || 0)}</span>
                  </div>

                  {incentiveDisplayItems.length > 0
                    ? incentiveDisplayItems.map((item, index) => (
                        <div
                          key={`incentive-line-${index}`}
                          className="flex items-start justify-between gap-3"
                        >
                          <span>{item.label}</span>
                          <span>
                            {item.amount == null ? "-" : fmtPeso(item.amount)}
                          </span>
                        </div>
                      ))
                    : Number(currentSlip.incentives || 0) > 0 && (
                        <div className="flex items-start justify-between gap-3">
                          <span>Incentives</span>
                          <span>{fmtPeso(currentSlip.incentives || 0)}</span>
                        </div>
                      )}
                </div>
              </div>

              <div className="px-4 py-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="m-0 text-[14px] font-bold">DEDUCTIONS (IOU)</p>
                  <p className="m-0 text-[14px]">PHP</p>
                </div>

                <div className="space-y-1 text-[15px]">
                  <div className="space-y-1 pl-1 text-[15px]">
                    {deductionDisplayItems.length === 0 ? (
                      <p className="m-0 text-[14px] text-gray-500">
                        No deduction breakdown available.
                      </p>
                    ) : (
                      deductionDisplayItems.map((item, index) => (
                        <div
                          key={`deduction-line-${index}`}
                          className="flex items-start justify-between gap-3"
                        >
                          <span>{item.label}</span>
                          <span>
                            {item.amount == null ? "-" : fmtPeso(item.amount)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="relative z-10 border-b border-gray-700 px-6 py-4">
              <div className="mx-auto w-fit text-[16px]">
                <div className="mb-1 flex items-center justify-between gap-8">
                  <span className="font-bold">PAY SUMMARY</span>
                  <span className="font-bold">PHP</span>
                </div>
                <div className="flex items-center justify-between gap-8">
                  <span>Total Gross</span>
                  <span>{fmtPeso(currentSlip.gross_pay || 0)}</span>
                </div>
                <div className="flex items-center justify-between gap-8">
                  <span>Total Deductions</span>
                  <span>{fmtPeso(currentSlip.absence_deductions || 0)}</span>
                </div>
                <div className="mt-5 flex items-center justify-between gap-8">
                  <span>NET SALARY & WAGES:</span>
                  <span>{fmtPeso(currentSlip.net_pay || 0)}</span>
                </div>
              </div>
            </div>

            <div className="relative z-10 px-6 py-4 text-center">
              <p className="m-0 text-[13px] font-bold italic text-[#2c3e7a]">
                For Healthier, Happier Communities
              </p>
              <p className="m-0 mt-1.5 text-[10px] text-slate-600">
                <span className="font-semibold text-slate-500">Webpage:</span> http://wah.ph/{" "}
                <span className="font-semibold text-slate-500">Email Address:</span> wah.pilipinas@wah.ph
              </p>
              <p className="m-0 mt-0.5 text-[10px] text-slate-600">
                <span className="font-semibold text-slate-500">Facebook:</span> wah.ph{" "}
                <span className="font-semibold text-slate-500">Twitter:</span> @wah_team{" "}
                <span className="font-semibold text-slate-500">Instagram:</span> @wah_team{" "}
                <span className="font-semibold text-slate-500">LinkedIn:</span> wah.ph
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
