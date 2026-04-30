import { useQuery } from "@tanstack/react-query";
import axiosInterceptor from "../hooks/interceptor";
import { mutationHandler } from "@/features/leave/hooks/createMutationHandler";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

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

const FinancialTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-900 p-3 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg">
        <p className="font-bold text-gray-800 dark:text-gray-100 mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p
            key={index}
            style={{ color: entry.color }}
            className="text-sm font-semibold m-0"
          >
            {entry.name}: {fmt(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Reports() {
  const currentYearMonth = new Date().toISOString().slice(0, 7);

  const {
    data: reportData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["payroll-reports"],
    queryFn: async () => {
      return mutationHandler(
        axiosInterceptor.get("/api/employees/payroll-reports"),
        "Failed to fetch reports",
      );
    },
    staleTime: 5 * 60 * 1000,
  });

  const exportCSV = () => {
    if (!reportData || !monthlySummaryUpToCurrentMonth.length) return;

    let csvContent =
      "Month,Present,Absent,Late,Leaves,Incentives      ,Gross Pay      ,Deductions      ,Net Pay      \n";

    monthlySummaryUpToCurrentMonth.forEach((row) => {
      csvContent += `"${row.month}","${row.present}","${row.absent}","${row.late}","${row.onLeave}","${row.totalIncentives}","${row.totalGross}","${row.totalDeductions}","${row.totalNet}"\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Combined_Report_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading)
    return (
      <div className="p-6 font-bold text-gray-700 dark:text-gray-300">Loading Reports...</div>
    );
  if (isError)
    return (
      <div className="p-6 font-bold text-red-600">
        Failed to load reports data.
      </div>
    );

  const { activeEmployees = 0, monthlySummary = [] } = reportData || {};

  const monthlySummaryUpToCurrentMonth = monthlySummary.filter((row) => {
    const sortMonth = String(row.sortMonth || "").slice(0, 7);
    if (!sortMonth) return true;
    return sortMonth <= currentYearMonth;
  });

  const chartData = [...monthlySummaryUpToCurrentMonth].reverse();
  const latestVisibleMonth = monthlySummaryUpToCurrentMonth[0] || {
    month: "No Data",
    totalNet: 0,
    totalDeductions: 0,
    absent: 0,
  };
  const latestMonthName = latestVisibleMonth.month;
  const latestNet = latestVisibleMonth.totalNet;
  const latestDeductions = latestVisibleMonth.totalDeductions;
  const latestAbsences = latestVisibleMonth.absent;

  return (
    <div className="max-w-full space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="m-0 text-[1.4rem] font-bold text-gray-900 dark:text-gray-100">
          Combined Reports
        </h1>
        <button
          onClick={exportCSV}
          disabled={monthlySummaryUpToCurrentMonth.length === 0}
          className="w-36 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-0 text-white text-sm font-semibold cursor-pointer bg-linear-to-r from-purple-600 to-purple-700 hover:opacity-90 disabled:opacity-50 shadow-sm whitespace-nowrap"
        >
          ⬇ Export CSV
        </button>
      </div>

      {}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 flex flex-col gap-1 border-t-4 border-purple-600 shadow-sm border border-gray-200 dark:border-gray-800">
          <span className="text-2xl font-bold text-purple-700 dark:text-purple-400">
            {activeEmployees}
          </span>
          <span className="text-[0.80rem] font-medium uppercase text-gray-500 dark:text-gray-400 tracking-wider">
            Active Employees
          </span>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 flex flex-col gap-1 border-t-4 border-green-500 shadow-sm border border-gray-200 dark:border-gray-800">
          <span className="text-2xl font-bold text-green-600 dark:text-green-400">
            {fmt(latestNet)}
          </span>
          <span className="text-[0.80rem] font-medium uppercase text-gray-500 dark:text-gray-400 tracking-wider">
            Net Pay ({latestMonthName})
          </span>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 flex flex-col gap-1 border-t-4 border-red-500 shadow-sm border border-gray-200 dark:border-gray-800">
          <span className="text-2xl font-bold text-red-600 dark:text-red-400">
            {fmt(latestDeductions)}
          </span>
          <span className="text-[0.80rem] font-medium uppercase text-gray-500 dark:text-gray-400 tracking-wider">
            Deductions ({latestMonthName})
          </span>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 flex flex-col gap-1 border-t-4 border-orange-500 shadow-sm border border-gray-200 dark:border-gray-800">
          <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {latestAbsences}
          </span>
          <span className="text-[0.80rem] font-medium uppercase text-gray-500 dark:text-gray-400 tracking-wider">
            Absences ({latestMonthName})
          </span>
        </div>
      </div>

      {}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
          <h3 className="m-0 mb-4 text-base font-bold text-gray-800 dark:text-gray-100">
            Financial Overview (Gross vs Net)
          </h3>
          <div className="h-75 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="currentColor" className="text-gray-200 dark:text-gray-800"
                />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "currentColor" }} className="text-gray-500 dark:text-gray-400"
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "var(--color-gray-500)" }}
                  tickFormatter={(value) => `₱${value / 1000}k`}
                />
                <Tooltip content={<FinancialTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
                />
                <Bar
                  dataKey="totalGross"
                  name="Gross Pay"
                  fill="#8b5cf6"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="totalNet"
                  name="Net Pay"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
          <h3 className="m-0 mb-4 text-base font-bold text-gray-800 dark:text-gray-100">
            Attendance Issues Trend
          </h3>
          <div className="h-75 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="currentColor" className="text-gray-200 dark:text-gray-800"
                />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "currentColor" }} className="text-gray-500 dark:text-gray-400"
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "var(--color-gray-500)" }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    backgroundColor: "var(--color-gray-900)",
                    color: "var(--color-gray-100)",
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
                />
                <Line
                  type="monotone"
                  dataKey="absent"
                  name="Absences"
                  stroke="#ef4444"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="late"
                  name="Lates"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {}
      <section className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
          <h3 className="m-0 text-base font-bold text-gray-900 dark:text-gray-100">
            Detailed Monthly Breakdown
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white dark:bg-gray-900 text-sm text-left">
            <thead>
              <tr>
                <th className="px-5 py-3 font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider text-[10px] border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  Period
                </th>
                {}
                <th className="px-5 py-3 font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider text-[10px] border-b border-gray-200 dark:border-gray-800 bg-blue-50/50 dark:bg-blue-900/20 text-center border-l border-gray-200 dark:border-gray-800">
                  Present
                </th>
                <th className="px-5 py-3 font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider text-[10px] border-b border-gray-200 dark:border-gray-800 bg-blue-50/50 dark:bg-blue-900/20 text-center">
                  Absent
                </th>
                <th className="px-5 py-3 font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider text-[10px] border-b border-gray-200 dark:border-gray-800 bg-blue-50/50 dark:bg-blue-900/20 text-center">
                  Late
                </th>
                <th className="px-5 py-3 font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider text-[10px] border-b border-gray-200 dark:border-gray-800 bg-blue-50/50 dark:bg-blue-900/20 text-center">
                  Leaves
                </th>
                {}
                <th className="px-5 py-3 font-bold text-green-700 dark:text-green-400 uppercase tracking-wider text-[10px] border-b border-gray-200 dark:border-gray-800 bg-green-50/50 dark:bg-green-900/20 text-right border-l border-gray-200 dark:border-gray-800">
                  Incentives
                </th>
                <th className="px-5 py-3 font-bold text-green-700 dark:text-green-400 uppercase tracking-wider text-[10px] border-b border-gray-200 dark:border-gray-800 bg-green-50/50 dark:bg-green-900/20 text-right">
                  Gross Pay
                </th>
                <th className="px-5 py-3 font-bold text-red-600 dark:text-red-400 uppercase tracking-wider text-[10px] border-b border-gray-200 dark:border-gray-800 bg-red-50/50 dark:bg-red-900/20 text-right">
                  Deductions
                </th>
                <th className="px-5 py-3 font-bold text-green-700 dark:text-green-400 uppercase tracking-wider text-[10px] border-b border-gray-200 dark:border-gray-800 bg-green-50/50 dark:bg-green-900/20 text-right">
                  Net Pay
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {monthlySummaryUpToCurrentMonth.length === 0 ? (
                <tr>
                  <td
                    colSpan="9"
                    className="px-6 py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    No combined data available yet.
                  </td>
                </tr>
              ) : (
                monthlySummaryUpToCurrentMonth.map((m) => (
                  <tr
                    key={m.month}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-5 py-3 font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                      {m.month}
                    </td>

                    {}
                    <td className="px-5 py-3 text-center text-gray-700 dark:text-gray-300 font-medium border-l border-gray-100 dark:border-gray-800 bg-blue-50/10 dark:bg-blue-900/5">
                      {m.present}
                    </td>
                    <td className="px-5 py-3 text-center text-red-600 dark:text-red-400 font-bold bg-blue-50/10 dark:bg-blue-900/5">
                      {m.absent}
                    </td>
                    <td className="px-5 py-3 text-center text-orange-500 dark:text-orange-400 font-bold bg-blue-50/10 dark:bg-blue-900/5">
                      {m.late}
                    </td>
                    <td className="px-5 py-3 text-center text-gray-700 dark:text-gray-300 font-medium bg-blue-50/10 dark:bg-blue-900/5">
                      {m.onLeave}
                    </td>

                    {}
                    <td className="px-5 py-3 text-right text-green-600 dark:text-green-400 font-medium border-l border-gray-100 dark:border-gray-800 bg-green-50/10 dark:bg-green-900/5">
                      +{fmt(m.totalIncentives)}
                    </td>
                    <td className="px-5 py-3 text-right text-gray-800 dark:text-gray-200 font-bold bg-green-50/10 dark:bg-green-900/5">
                      {fmt(m.totalGross)}
                    </td>
                    <td className="px-5 py-3 text-right text-red-600 dark:text-red-400 font-bold bg-red-50/10 dark:bg-red-900/5">
                      -{fmt(m.totalDeductions)}
                    </td>
                    <td className="px-5 py-3 text-right text-purple-700 dark:text-purple-400 font-black bg-green-50/10 dark:bg-green-900/5">
                      {fmt(m.totalNet)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
