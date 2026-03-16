const monthlySummary = [
  {
    month: "January 2026",
    employees: 30,
    totalGross: 920000,
    totalDeductions: 45000,
    totalNet: 875000,
  },
  {
    month: "February 2026",
    employees: 31,
    totalGross: 945000,
    totalDeductions: 38000,
    totalNet: 907000,
  },
  {
    month: "March 2026",
    employees: 32,
    totalGross: 968000,
    totalDeductions: 52000,
    totalNet: 916000,
  },
];

const fmt = (n) => "₱" + n.toLocaleString();

export default function Reports() {
  return (
    <div className="max-w-full">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <h1 className="m-0 text-[1.4rem] text-wah-dark">Payroll Reports</h1>
        <button className="px-[22px] py-2.5 rounded-[10px] border-0 text-white text-[0.95rem] font-semibold cursor-pointer bg-gradient-to-r from-wah-primary to-wah-lighter hover:opacity-90">
          ⬇ Export CSV
        </button>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3 mb-5">
        <div className="bg-white rounded-[10px] px-4 py-4 flex flex-col gap-1 border-t-4 border-wah-primary">
          <span className="text-2xl font-bold text-wah-primary">32</span>
          <span className="text-[0.88rem] text-gray-500">Active Employees</span>
        </div>
        <div className="bg-white rounded-[10px] px-4 py-4 flex flex-col gap-1 border-t-4 border-wah-green">
          <span className="text-2xl font-bold text-wah-green">
            {fmt(916000)}
          </span>
          <span className="text-[0.88rem] text-gray-500">
            Net Payroll (Mar)
          </span>
        </div>
        <div className="bg-white rounded-[10px] px-4 py-4 flex flex-col gap-1 border-t-4 border-wah-red">
          <span className="text-2xl font-bold text-wah-red">{fmt(52000)}</span>
          <span className="text-[0.88rem] text-gray-500">
            Total Deductions (Mar)
          </span>
        </div>
      </div>

      <section className="bg-white rounded-[10px] p-[18px] mt-1">
        <h3 className="m-0 mb-4 text-wah-dark">Monthly Payroll Summary</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white rounded-xl overflow-hidden">
            <thead>
              <tr>
                <th className="px-3 py-2.5 text-left text-[0.85rem] border-b border-gray-100 bg-wah-table-head text-wah-dark font-semibold whitespace-nowrap">
                  Month
                </th>
                <th className="px-3 py-2.5 text-left text-[0.85rem] border-b border-gray-100 bg-wah-table-head text-wah-dark font-semibold whitespace-nowrap">
                  Employees
                </th>
                <th className="px-3 py-2.5 text-left text-[0.85rem] border-b border-gray-100 bg-wah-table-head text-wah-dark font-semibold whitespace-nowrap">
                  Total Gross
                </th>
                <th className="px-3 py-2.5 text-left text-[0.85rem] border-b border-gray-100 bg-wah-table-head text-wah-dark font-semibold whitespace-nowrap">
                  Total Deductions
                </th>
                <th className="px-3 py-2.5 text-left text-[0.85rem] border-b border-gray-100 bg-wah-table-head text-wah-dark font-semibold whitespace-nowrap">
                  Total Net
                </th>
              </tr>
            </thead>
            <tbody>
              {monthlySummary.map((m) => (
                <tr key={m.month} className="hover:bg-wah-table-hover">
                  <td className="px-3 py-2.5 text-left text-[0.85rem] border-b border-gray-100">
                    {m.month}
                  </td>
                  <td className="px-3 py-2.5 text-left text-[0.85rem] border-b border-gray-100">
                    {m.employees}
                  </td>
                  <td className="px-3 py-2.5 text-left text-[0.85rem] border-b border-gray-100">
                    {fmt(m.totalGross)}
                  </td>
                  <td className="px-3 py-2.5 text-left text-[0.85rem] border-b border-gray-100 text-wah-red">
                    {fmt(m.totalDeductions)}
                  </td>
                  <td className="px-3 py-2.5 text-left text-[0.85rem] border-b border-gray-100 text-wah-green">
                    {fmt(m.totalNet)}
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
