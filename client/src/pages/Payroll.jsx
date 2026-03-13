import { useState } from 'react'

const samplePayroll = [
  { id: 'WAH-002', name: 'Rose Ann Biag', basicPay: 38000, absences: 0, deductions: 0, incentives: 2000, gross: 40000, net: 40000 },
  { id: 'WAH-003', name: 'Jhuvy Bondoc', basicPay: 35000, absences: 2, deductions: 3000, incentives: 1000, gross: 33000, net: 33000 },
  { id: 'WAH-004', name: 'Anna Katrina Yturralde', basicPay: 35000, absences: 0, deductions: 0, incentives: 1500, gross: 36500, net: 36500 },
  { id: 'WAH-005', name: 'Meryll Jen Lee', basicPay: 25000, absences: 3, deductions: 4500, incentives: 0, gross: 20500, net: 20500 },
  { id: 'WAH-006', name: 'Jaline Latoga', basicPay: 28000, absences: 1, deductions: 1500, incentives: 500, gross: 27000, net: 27000 },
  { id: 'WAH-007', name: 'Dominic Domantay', basicPay: 22000, absences: 0, deductions: 0, incentives: 1000, gross: 23000, net: 23000 },
  { id: 'WAH-008', name: 'Carla Shey Aguinaldo', basicPay: 22000, absences: 1, deductions: 1500, incentives: 0, gross: 20500, net: 20500 },
]

const fmt = (n) => '₱' + n.toLocaleString()

export default function Payroll() {
  const [period, setPeriod] = useState('2026-03')

  return (
    <div className="max-w-full">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <h1 className="m-0 text-[1.4rem] text-wah-dark">Salary / Payroll</h1>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-[0.9rem] text-gray-500">
            Period:
            <input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-[0.9rem]" />
          </label>
          <button className="px-[22px] py-2.5 rounded-[10px] border-0 text-white text-[0.95rem] font-semibold cursor-pointer bg-gradient-to-r from-wah-primary to-wah-lighter hover:opacity-90">Calculate All</button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-white rounded-xl overflow-hidden">
          <thead>
            <tr>
              <th className="px-3 py-2.5 text-left text-[0.85rem] border-b border-gray-100 bg-wah-table-head text-wah-dark font-semibold whitespace-nowrap">ID</th>
              <th className="px-3 py-2.5 text-left text-[0.85rem] border-b border-gray-100 bg-wah-table-head text-wah-dark font-semibold whitespace-nowrap">Name</th>
              <th className="px-3 py-2.5 text-left text-[0.85rem] border-b border-gray-100 bg-wah-table-head text-wah-dark font-semibold whitespace-nowrap">Basic Pay</th>
              <th className="px-3 py-2.5 text-left text-[0.85rem] border-b border-gray-100 bg-wah-table-head text-wah-dark font-semibold whitespace-nowrap">Absences</th>
              <th className="px-3 py-2.5 text-left text-[0.85rem] border-b border-gray-100 bg-wah-table-head text-wah-dark font-semibold whitespace-nowrap">Deductions</th>
              <th className="px-3 py-2.5 text-left text-[0.85rem] border-b border-gray-100 bg-wah-table-head text-wah-dark font-semibold whitespace-nowrap">Incentives</th>
              <th className="px-3 py-2.5 text-left text-[0.85rem] border-b border-gray-100 bg-wah-table-head text-wah-dark font-semibold whitespace-nowrap">Gross Pay</th>
              <th className="px-3 py-2.5 text-left text-[0.85rem] border-b border-gray-100 bg-wah-table-head text-wah-dark font-semibold whitespace-nowrap font-semibold">Net Pay</th>
            </tr>
          </thead>
          <tbody>
            {samplePayroll.map((p) => (
              <tr key={p.id} className="hover:bg-wah-table-hover">
                <td className="px-3 py-2.5 text-left text-[0.85rem] border-b border-gray-100">{p.id}</td>
                <td className="px-3 py-2.5 text-left text-[0.85rem] border-b border-gray-100">{p.name}</td>
                <td className="px-3 py-2.5 text-left text-[0.85rem] border-b border-gray-100">{fmt(p.basicPay)}</td>
                <td className="px-3 py-2.5 text-left text-[0.85rem] border-b border-gray-100">{p.absences}</td>
                <td className="px-3 py-2.5 text-left text-[0.85rem] border-b border-gray-100 text-wah-red">{fmt(p.deductions)}</td>
                <td className="px-3 py-2.5 text-left text-[0.85rem] border-b border-gray-100 text-wah-green">{fmt(p.incentives)}</td>
                <td className="px-3 py-2.5 text-left text-[0.85rem] border-b border-gray-100">{fmt(p.gross)}</td>
                <td className="px-3 py-2.5 text-left text-[0.85rem] border-b border-gray-100 bg-wah-table-head font-semibold">{fmt(p.net)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={7} className="px-3 py-2.5 text-right text-[0.85rem] border-b border-gray-100 font-bold">Total Net Payroll</td>
              <td className="px-3 py-2.5 text-left text-[0.85rem] border-b border-gray-100 bg-wah-table-head font-bold">
                {fmt(samplePayroll.reduce((s, p) => s + p.net, 0))}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
