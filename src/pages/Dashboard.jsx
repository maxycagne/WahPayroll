export default function Dashboard() {
  const cards = [
    { label: 'Total Employees', value: 32, color: '#5a1ea2' },
    { label: 'Present Today', value: 28, color: '#1a8f3c' },
    { label: 'On Leave', value: 3, color: '#d4a017' },
    { label: 'Absent', value: 1, color: '#c0392b' },
  ]

  return (
    <div className="max-w-full">
      <h1 className="m-0 text-[1.4rem] text-wah-dark">Dashboard</h1>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3 my-5">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-[10px] px-4 py-4 flex flex-col gap-1 border-t-4" style={{ borderTopColor: c.color }}>
            <span className="text-2xl font-bold" style={{ color: c.color }}>{c.value}</span>
            <span className="text-[0.88rem] text-gray-500">{c.label}</span>
          </div>
        ))}
      </div>

      <section className="bg-white rounded-[10px] p-[18px] mt-1">
        <h3 className="m-0 mb-4 text-wah-dark">Recent Activity</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white rounded-xl overflow-hidden">
            <thead>
              <tr>
                <th className="px-3 py-2.5 text-left text-[0.85rem] border-b border-gray-100 bg-wah-table-head text-wah-dark font-semibold whitespace-nowrap">Date</th>
                <th className="px-3 py-2.5 text-left text-[0.85rem] border-b border-gray-100 bg-wah-table-head text-wah-dark font-semibold whitespace-nowrap">Employee</th>
                <th className="px-3 py-2.5 text-left text-[0.85rem] border-b border-gray-100 bg-wah-table-head text-wah-dark font-semibold whitespace-nowrap">Action</th>
                <th className="px-3 py-2.5 text-left text-[0.85rem] border-b border-gray-100 bg-wah-table-head text-wah-dark font-semibold whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-wah-table-hover">
                <td className="px-3 py-2.5 text-left text-[0.85rem] border-b border-gray-100">2026-03-11</td>
                <td className="px-3 py-2.5 text-left text-[0.85rem] border-b border-gray-100">Jaline Latoga</td>
                <td className="px-3 py-2.5 text-left text-[0.85rem] border-b border-gray-100">Filed Vacation Leave</td>
                <td className="px-3 py-2.5 text-left text-[0.85rem] border-b border-gray-100"><span className="px-3 py-0.5 rounded-full text-[0.78rem] font-semibold bg-yellow-100 text-yellow-800">Pending</span></td>
              </tr>
              <tr className="hover:bg-wah-table-hover">
                <td className="px-3 py-2.5 text-left text-[0.85rem] border-b border-gray-100">2026-03-10</td>
                <td className="px-3 py-2.5 text-left text-[0.85rem] border-b border-gray-100">Dominic Domantay</td>
                <td className="px-3 py-2.5 text-left text-[0.85rem] border-b border-gray-100">Filed Sick Leave</td>
                <td className="px-3 py-2.5 text-left text-[0.85rem] border-b border-gray-100"><span className="px-3 py-0.5 rounded-full text-[0.78rem] font-semibold bg-green-100 text-green-800">Approved</span></td>
              </tr>
              <tr className="hover:bg-wah-table-hover">
                <td className="px-3 py-2.5 text-left text-[0.85rem] border-b border-gray-100">2026-03-10</td>
                <td className="px-3 py-2.5 text-left text-[0.85rem] border-b border-gray-100">Meryll Jen Lee</td>
                <td className="px-3 py-2.5 text-left text-[0.85rem] border-b border-gray-100">Payslip Generated</td>
                <td className="px-3 py-2.5 text-left text-[0.85rem] border-b border-gray-100"><span className="px-3 py-0.5 rounded-full text-[0.78rem] font-semibold bg-green-100 text-green-800">Complete</span></td>
              </tr>
              <tr className="hover:bg-wah-table-hover">
                <td className="px-3 py-2.5 text-left text-[0.85rem] border-b border-gray-100">2026-03-09</td>
                <td className="px-3 py-2.5 text-left text-[0.85rem] border-b border-gray-100">Kevin Greg Alvarado</td>
                <td className="px-3 py-2.5 text-left text-[0.85rem] border-b border-gray-100">Filed Birthday Leave</td>
                <td className="px-3 py-2.5 text-left text-[0.85rem] border-b border-gray-100"><span className="px-3 py-0.5 rounded-full text-[0.78rem] font-semibold bg-red-100 text-red-800">Denied</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
