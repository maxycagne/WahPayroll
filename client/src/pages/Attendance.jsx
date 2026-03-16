import { useState } from 'react'

const sampleAttendance = [
  { id: 'WAH-002', name: 'Rose Ann Biag', totalAbsences: 0, totalLeave: 3, totalAllocation: 20, leaveType: 'full', status: 'Present' },
  { id: 'WAH-003', name: 'Jhuvy Bondoc', totalAbsences: 2, totalLeave: 17, totalAllocation: 20, leaveType: 'full', status: 'Absent' },
  { id: 'WAH-004', name: 'Anna Katrina Yturralde', totalAbsences: 0, totalLeave: 20, totalAllocation: 20, leaveType: 'full', status: 'Present' },
  { id: 'WAH-005', name: 'Meryll Jen Lee', totalAbsences: 3, totalLeave: 4, totalAllocation: 20, leaveType: 'full', status: 'On Leave' },
  { id: 'WAH-006', name: 'Jaline Latoga', totalAbsences: 1, totalLeave: 2, totalAllocation: 20, leaveType: 'half', status: 'Present' },
  { id: 'WAH-007', name: 'Dominic Domantay', totalAbsences: 0, totalLeave: 1, totalAllocation: 20, leaveType: 'full', status: 'On Leave' },
  { id: 'WAH-008', name: 'Carla Shey Aguinaldo', totalAbsences: 1, totalLeave: 0, totalAllocation: 20, leaveType: 'full', status: 'Present' },
  { id: 'WAH-009', name: 'Robert Michael Martinez', totalAbsences: 0, totalLeave: 2, totalAllocation: 20, leaveType: 'full', status: 'Present' },
  { id: 'WAH-010', name: 'John Vincent Antonio', totalAbsences: 2, totalLeave: 1, totalAllocation: 20, leaveType: 'full', status: 'Present' },
]

const badgeClass = {
  Present: 'bg-green-100 text-green-800',
  Absent: 'bg-red-100 text-red-800',
  'On Leave': 'bg-yellow-100 text-yellow-800',
}

export default function Attendance() {
  const [search, setSearch] = useState('')

  const getLeaveHighlightColor = (employee) => {
    const remaining = employee.totalAllocation - employee.totalLeave
    
    // If no remaining days (full allocation used), highlight red (20/20)
    if (remaining <= 0) {
      return 'bg-red-100 text-red-800'
    }
    // If 3 or fewer days remaining, highlight orange
    if (remaining <= 3) {
      return 'bg-orange-100 text-orange-800'
    }
    // If half leave type, highlight yellow
    if (employee.leaveType === 'half') {
      return 'bg-yellow-100 text-yellow-800'
    }
    // Default
    return 'bg-blue-100 text-blue-800'
  }

  const filtered = sampleAttendance.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.id.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-full">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <h1 className="m-0 text-[1.4rem] font-bold text-gray-900">Attendance Management</h1>
      </div>

      <div className="mb-4">
        <input
          type="text"
          className="w-full max-w-[300px] px-4 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          placeholder="Search by name or ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Employee ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Total Absences</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Total Leave</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Today's Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-6 py-3 text-sm text-gray-900">{a.id}</td>
                  <td className="px-6 py-3 text-sm text-gray-700">{a.name}</td>
                  <td className="px-6 py-3 text-sm text-gray-700">{a.totalAbsences}</td>
                  <td className="px-6 py-3 text-sm">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${getLeaveHighlightColor(a)}`}>
                      {a.totalLeave}/{a.totalAllocation}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${badgeClass[a.status] || ''}`}>
                      {a.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}