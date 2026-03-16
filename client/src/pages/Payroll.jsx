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
  const [adjustmentModal, setAdjustmentModal] = useState(null)
  const [adjustmentType, setAdjustmentType] = useState('increase')
  const [adjustmentAmount, setAdjustmentAmount] = useState('')
  const [adjustmentReason, setAdjustmentReason] = useState('')
  const [selectedEmployees, setSelectedEmployees] = useState(new Set())
  const [bulkAdjustmentMode, setBulkAdjustmentMode] = useState(false)

  const handleAdjustment = () => {
    if (!adjustmentAmount || !adjustmentReason) {
      alert('Please fill in all fields')
      return
    }
    
    if (bulkAdjustmentMode) {
      if (selectedEmployees.size === 0) {
        alert('Please select at least one employee')
        return
      }
      const selectedNames = Array.from(selectedEmployees).map(id => samplePayroll.find(p => p.id === id)?.name).join(', ')
      alert(`${adjustmentType.charAt(0).toUpperCase() + adjustmentType.slice(1)} adjustment of ₱${adjustmentAmount} applied to ${selectedEmployees.size} employee(s): ${selectedNames}`)
      setSelectedEmployees(new Set())
    } else {
      alert(`${adjustmentType.charAt(0).toUpperCase() + adjustmentType.slice(1)} adjustment of ₱${adjustmentAmount} applied to ${adjustmentModal.name}`)
    }
    
    setAdjustmentModal(null)
    setAdjustmentAmount('')
    setAdjustmentReason('')
  }

  const toggleEmployeeSelection = (id) => {
    const newSelected = new Set(selectedEmployees)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedEmployees(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedEmployees.size === samplePayroll.length) {
      setSelectedEmployees(new Set())
    } else {
      setSelectedEmployees(new Set(samplePayroll.map(p => p.id)))
    }
  }

  return (
    <div className="max-w-full">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <h1 className="m-0 text-[1.4rem] font-bold text-gray-900">Salary / Payroll</h1>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            Period:
            <input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
          </label>
          <button className="px-5 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 border-0 text-white text-sm font-semibold cursor-pointer hover:opacity-90 transition-opacity">Calculate All</button>
          <button 
            onClick={() => {
              setBulkAdjustmentMode(!bulkAdjustmentMode)
              setSelectedEmployees(new Set())
            }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer transition-colors border ${bulkAdjustmentMode ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
          >
            {bulkAdjustmentMode ? '✓ Adjust Multiple' : 'Adjust Multiple'}
          </button>
          {bulkAdjustmentMode && selectedEmployees.size > 0 && (
            <button 
              onClick={() => setAdjustmentModal({ name: `${selectedEmployees.size} Employee(s)`, isBulk: true })}
              className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold cursor-pointer hover:bg-green-700 transition-colors border-0"
            >
              Adjust {selectedEmployees.size}
            </button>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {bulkAdjustmentMode && (
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700">
                    <input 
                      type="checkbox" 
                      checked={selectedEmployees.size === samplePayroll.length}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 cursor-pointer"
                    />
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Basic Pay</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Absences</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Deductions</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Incentives</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Gross Pay</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Net Pay</th>
                {!bulkAdjustmentMode && <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {samplePayroll.map((p) => (
                <tr key={p.id} className={`hover:bg-gray-50 transition-colors duration-150 ${bulkAdjustmentMode && selectedEmployees.has(p.id) ? 'bg-purple-50' : ''}`}>
                  {bulkAdjustmentMode && (
                    <td className="px-6 py-3 text-center">
                      <input 
                        type="checkbox" 
                        checked={selectedEmployees.has(p.id)}
                        onChange={() => toggleEmployeeSelection(p.id)}
                        className="w-4 h-4 cursor-pointer"
                      />
                    </td>
                  )}
                  <td className="px-6 py-3 text-sm text-gray-900">{p.id}</td>
                  <td className="px-6 py-3 text-sm text-gray-700">{p.name}</td>
                  <td className="px-6 py-3 text-sm text-gray-700">{fmt(p.basicPay)}</td>
                  <td className="px-6 py-3 text-sm text-gray-700">{p.absences}</td>
                  <td className="px-6 py-3 text-sm text-red-600">{fmt(p.deductions)}</td>
                  <td className="px-6 py-3 text-sm text-green-600">{fmt(p.incentives)}</td>
                  <td className="px-6 py-3 text-sm text-gray-700">{fmt(p.gross)}</td>
                  <td className="px-6 py-3 text-sm font-semibold text-gray-900">{fmt(p.net)}</td>
                  {!bulkAdjustmentMode && (
                    <td className="px-6 py-3 text-sm">
                      <button
                        onClick={() => setAdjustmentModal(p)}
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
              <tr className="bg-gray-50 border-t border-gray-200">
                {bulkAdjustmentMode && <td className="px-6 py-3"></td>}
                <td colSpan={bulkAdjustmentMode ? 6 : 7} className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Total Net Payroll</td>
                <td className="px-6 py-3 text-sm font-bold text-gray-900">
                  {fmt(samplePayroll.reduce((s, p) => s + p.net, 0))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Salary Adjustment Modal */}
      {adjustmentModal && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setAdjustmentModal(null)}>
          <div
            className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 border border-gray-200 bg-white p-0 shadow-lg rounded-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-purple-200 px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-700">
              <h2 className="m-0 text-lg font-semibold text-white">{bulkAdjustmentMode ? 'Adjust Multiple Employees' : 'Adjust Salary'}</h2>
              <button
                type="button"
                onClick={() => setAdjustmentModal(null)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-sm opacity-70 text-white/80 hover:text-white transition-opacity"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-4">
              <p className="m-0 text-sm font-semibold text-gray-900 mb-4">
                {bulkAdjustmentMode ? `Applying to ${selectedEmployees.size} employee(s)` : adjustmentModal.name}
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Adjustment Type</label>
                  <select
                    value={adjustmentType}
                    onChange={(e) => setAdjustmentType(e.target.value)}
                    className="w-full border-[1.8px] border-gray-300 rounded-lg px-4 py-2 text-base text-gray-900 outline-none focus:border-purple-600"
                  >
                    <option value="increase">Increase (Salary Raise)</option>
                    <option value="bonus">Bonus</option>
                    <option value="decrease">Decrease</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Amount (₱)</label>
                  <input
                    type="number"
                    value={adjustmentAmount}
                    onChange={(e) => setAdjustmentAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full border-[1.8px] border-gray-300 rounded-lg px-4 py-2 text-base text-gray-900 outline-none focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Reason / Notes</label>
                  <textarea
                    value={adjustmentReason}
                    onChange={(e) => setAdjustmentReason(e.target.value)}
                    placeholder="Enter reason for adjustment"
                    rows={3}
                    className="w-full border-[1.8px] border-gray-300 rounded-lg px-4 py-2 text-base text-gray-900 outline-none focus:border-purple-600"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4 bg-gray-50">
              <button
                type="button"
                onClick={() => setAdjustmentModal(null)}
                className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAdjustment}
                className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-purple-700 shadow-sm hover:opacity-90 transition-opacity"
              >
                Apply Adjustment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}