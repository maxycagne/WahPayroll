import { useState } from 'react'

const sampleEmployees = [
  { id: 'WAH-002', name: 'Rose Ann Biag', designation: 'Manager', position: 'Manager', status: 'Permanent', email: 'roseann@wah.org', dob: '1990-07-22', hired: '2019-03-01' },
  { id: 'WAH-003', name: 'Jhuvy Bondoc', designation: 'Supervising Partner', position: 'Finance and Operations', status: 'Permanent', email: 'jhuvy@wah.org', dob: '1992-11-05', hired: '2020-06-10' },
  { id: 'WAH-004', name: 'Anna Katrina Yturralde', designation: 'Supervising Partner', position: 'Health Program', status: 'Permanent', email: 'anna@wah.org', dob: '1991-02-18', hired: '2020-06-10' },
  { id: 'WAH-005', name: 'Meryll Jen Lee', designation: 'Assistant Partner', position: 'Finance & Operations', status: 'Casual', email: 'meryll@wah.org', dob: '1996-09-30', hired: '2021-01-12' },
  { id: 'WAH-006', name: 'Jaline Latoga', designation: 'Admin & HR Partner', position: 'Operations', status: 'Permanent', email: 'jaline@wah.org', dob: '1994-03-14', hired: '2021-01-12' },
  { id: 'WAH-007', name: 'Dominic Domantay', designation: 'Health Program Partner', position: 'Health Program', status: 'PGT Employee', email: 'dominic@wah.org', dob: '1997-08-25', hired: '2022-02-01' },
  { id: 'WAH-008', name: 'Carla Shey Aguinaldo', designation: 'Health Program Partner', position: 'Health Program', status: 'PGT Employee', email: 'carla@wah.org', dob: '1998-12-01', hired: '2022-02-01' },
  { id: 'WAH-009', name: 'Robert Michael Martinez', designation: 'Supervising Partner', position: 'Network & Systems', status: 'Permanent', email: 'robert@wah.org', dob: '1993-06-20', hired: '2020-08-15' },
  { id: 'WAH-010', name: 'John Vincent Antonio', designation: 'Senior Partner', position: 'Platform Innovation', status: 'Permanent', email: 'john@wah.org', dob: '1995-01-10', hired: '2021-05-20' },
]

const positions = [
  'Operations',
  'Finance and Operations',
  'Health Program',
  'Platform Innovation',
  'Network & Systems',
]

function getNextId(employees) {
  const maxNum = employees.reduce((max, e) => {
    const n = parseInt(e.id.replace('WAH-', ''), 10)
    return n > max ? n : max
  }, 0)
  return 'WAH-' + String(maxNum + 1).padStart(3, '0')
}

const statusClasses = {
  Permanent: 'bg-green-100 text-green-800',
  Casual: 'bg-blue-100 text-blue-900',
  'PGT Employee': 'bg-yellow-100 text-yellow-800',
  'Job Order': 'bg-gray-200 text-gray-700',
}

export default function Employees() {
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [firstName, setFirstName] = useState('')

  const nextId = getNextId(sampleEmployees)
  const autoPassword = nextId + firstName

  const filtered = sampleEmployees.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.id.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-full">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <h1 className="m-0 text-[1.4rem] font-bold text-gray-900">Employee Management</h1>
        <button className="px-5 py-2 rounded-lg border-0 text-white text-sm font-semibold cursor-pointer bg-gradient-to-r from-purple-600 to-purple-700 hover:opacity-90 transition-opacity" onClick={() => setShowModal(true)}>
          + Add Employee
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-lg border border-gray-200" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-purple-200 px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-700">
              <h3 className="m-0 text-xl font-semibold text-white">Add New Employee</h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">Employee ID</label>
                <input type="text" value={nextId} disabled className="px-4 py-2 rounded-lg border border-gray-300 text-sm outline-none bg-gray-50 text-gray-500" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">First Name</label>
                <input
                  type="text"
                  placeholder="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">Last Name</label>
                <input type="text" placeholder="Last Name" className="px-4 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">M.I.</label>
                <input type="text" placeholder="M.I." className="px-4 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">Designation</label>
                <input type="text" placeholder="Designation" className="px-4 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">Position</label>
                <select defaultValue="" className="px-4 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                  <option value="" disabled>Select Position</option>
                  {positions.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">Status</label>
                <select className="px-4 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                  <option>Permanent</option>
                  <option>Casual</option>
                  <option>PGT Employee</option>
                  <option>Job Order</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">Email</label>
                <input type="email" placeholder="Email" className="px-4 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">Date of Birth</label>
                <input type="date" className="px-4 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">Hired Date</label>
                <input type="date" className="px-4 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
              </div>
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-sm font-semibold text-gray-700">Password</label>
                <input type="text" value={autoPassword} disabled className="px-4 py-2 rounded-lg border border-gray-300 text-sm outline-none bg-gray-50 text-gray-500" />
              </div>
            </div>
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-end gap-3">
              <button className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-semibold cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => { setShowModal(false); setFirstName('') }}>Cancel</button>
              <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 border-0 text-white text-sm font-semibold cursor-pointer hover:opacity-90 transition-opacity">Save Employee</button>
            </div>
          </div>
        </div>
      )}

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
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Designation</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Position</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Hired Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map((emp) => (
                <tr key={emp.id} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-6 py-3 text-sm text-gray-900">{emp.id}</td>
                  <td className="px-6 py-3 text-sm text-gray-700">{emp.name}</td>
                  <td className="px-6 py-3 text-sm text-gray-700">{emp.designation}</td>
                  <td className="px-6 py-3 text-sm text-gray-700">{emp.position}</td>
                  <td className="px-6 py-3 text-sm">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${statusClasses[emp.status] || ''}`}>{emp.status}</span>
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-700">{emp.email}</td>
                  <td className="px-6 py-3 text-sm text-gray-700">{emp.hired}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}