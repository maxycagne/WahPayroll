import { useState } from 'react'

export default function Dashboard() {
  const currentMonth = 'March 2026'
  
  const priorityClass = {
    high: 'bg-red-100 text-red-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-blue-100 text-blue-800',
  }
  
  const priorityOrder = { high: 0, medium: 1, low: 2 }
  const pendingLeaveApprovals = [
    { id: 1, name: 'Jaline Latoga', leaveType: 'Vacation Leave', filedOn: 'Mar 11', priority: 'high' },
    { id: 2, name: 'Ana Cris Mijares', leaveType: 'Emergency Leave', filedOn: 'Mar 10', priority: 'low' },
    { id: 3, name: 'Kevin Greg Alvarado', leaveType: 'Birthday Leave', filedOn: 'Mar 09', priority: 'low' },
    { id: 4, name: 'Meryll Jen Lee', leaveType: 'Sick Leave', filedOn: 'Mar 08', priority: 'high' },
  ]
  const leaveEmployees = [
    { name: 'Jaline Latoga', leaveType: 'Vacation Leave', days: 'Mar 12 - Mar 14' },
    { name: 'Dominic Domantay', leaveType: 'Sick Leave', days: 'Mar 10 - Mar 12' },
    { name: 'Kevin Greg Alvarado', leaveType: 'Birthday Leave', days: 'Mar 09' },
  ]
  const absentEmployees = [
    { name: 'Meryll Jen Lee', date: 'Mar 12', note: 'No time-in recorded' },
  ]
  const recentActivities = [
    { date: '2026-03-11', employee: 'Jaline Latoga', activity: 'Filed Vacation Leave', type: 'Leave Request', status: 'Pending' },
    { date: '2026-03-10', employee: 'Dominic Domantay', activity: 'Filed Sick Leave', type: 'Leave Request', status: 'Approved' },
    { date: '2026-03-09', employee: 'Kevin Greg Alvarado', activity: 'Filed Birthday Leave', type: 'Leave Request', status: 'Denied' },
    { date: '2026-03-08', employee: 'Meryll Jen Lee', activity: 'Attended HR Training', type: 'Seminar', status: 'Completed' },
  ]
  const seminarActivities = [
    { name: 'Jaline Latoga', event: 'HR Training Workshop', dateDeployed: 'Mar 10, 2026', expectedReturn: 'Mar 12, 2026', location: 'Conference Room A' },
    { name: 'Ana Cris Mijares', event: 'Leadership Development Program', dateDeployed: 'Mar 08, 2026', expectedReturn: 'Mar 15, 2026', location: 'Training Center' },
    { name: 'Kevin Greg Alvarado', event: 'Safety Compliance Seminar', dateDeployed: 'Mar 05, 2026', expectedReturn: 'Mar 06, 2026', location: 'Auditorium' },
  ]
  const employeeLeaveBalances = [
    { name: 'Jaline Latoga', leaveType: 'Vacation Leave (PGT)', used: '5 days', balance: '15 days' },
    { name: 'Ana Cris Mijares', leaveType: 'Vacation Leave (PGT)', used: '3 days', balance: '17 days' },
    { name: 'Kevin Greg Alvarado', leaveType: 'PGT Permanent/Casual Additional', used: '2 days', balance: '5 days' },
    { name: 'Meryll Jen Lee', leaveType: 'Sick Leave', used: '2 days', balance: '8 days' },
    { name: 'Dominic Domantay', leaveType: 'Birthday Leave', used: '0 days', balance: '1 day' },
    { name: 'Maria Santos', leaveType: 'JOB Order Mac Leave', used: '3 days', balance: '9 days' },
    { name: 'Juan Dela Cruz', leaveType: 'Vacation Leave (PGT)', used: '4 days', balance: '16 days' },
    { name: 'Rosa Garcia', leaveType: 'PGT Permanent/Casual Additional', used: '1 day', balance: '6 days' },
  ]

  const [activeModal, setActiveModal] = useState(null)
  const [approvedLeaves, setApprovedLeaves] = useState(new Set())
  const [showSeminarHistory, setShowSeminarHistory] = useState(false)
  const [showAddSeminar, setShowAddSeminar] = useState(false)

  const cards = [
    { label: 'Pending Leave Approval', value: pendingLeaveApprovals.length, borderColor: '#5a1ea2', clickable: true, modalKey: 'pending' },
    { label: 'On Leave', value: leaveEmployees.length, borderColor: '#d4a017', clickable: true, modalKey: 'leave' },
    { label: 'Absent', value: absentEmployees.length, borderColor: '#c0392b', clickable: true, modalKey: 'absent' },
    { label: 'Recent Activity', value: recentActivities.length, borderColor: '#0066cc', clickable: true, modalKey: 'recent-activity' },
  ]

  const handleApproveLease = (id) => {
    setApprovedLeaves(new Set([...approvedLeaves, id]))
  }

  const handleDeny = (id) => {
    setApprovedLeaves(new Set([...approvedLeaves].filter(item => item !== id)))
  }

  const closeModal = () => setActiveModal(null)

  return (
    <div className="max-w-full">
      <h1 className="m-0 text-[1.4rem] font-bold text-gray-900">Dashboard</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
        {cards.map((c) => (
          <button
            key={c.label}
            type="button"
            onClick={() => c.clickable && setActiveModal(c.modalKey)}
            disabled={!c.clickable}
            className={`group relative rounded-lg border border-gray-200 bg-white shadow-sm transition-all duration-200 ${
              c.clickable
                ? 'hover:shadow-md hover:-translate-y-1 cursor-pointer hover:border-gray-300'
                : 'cursor-default'
            }`}
            style={{ borderTop: `4px solid ${c.borderColor}` }}
          >
            <div className="p-5 text-left">
              <p className="m-0 text-sm font-medium text-gray-600 mb-2">{c.label}</p>
              <p className="m-0 text-3xl font-bold" style={{ color: c.borderColor }}>
                {c.value}
              </p>
              {c.clickable && <p className="m-0 text-xs text-gray-400 mt-2 group-hover:text-gray-500">Click to view</p>}
            </div>
          </button>
        ))}
      </div>

      {/* Modal Dialog */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" onClick={closeModal}>
          <div
            className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-gray-200 bg-white p-0 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:-translate-y-1/2 data-[state=open]:translate-y-[-50%] rounded-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-purple-200 px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-700">
              <h2 className="m-0 text-lg font-semibold text-white">
                {activeModal === 'pending'
                  ? `Pending Leave Approvals`
                  : activeModal === 'leave'
                    ? `Employees On Leave`
                    : activeModal === 'absent'
                      ? `Absent Employees`
                      : `Recent Activity`}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="inline-flex h-8 w-8 items-center justify-center rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 disabled:pointer-events-none text-white/80 hover:text-white"
                aria-label="Close"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto px-6 py-4 max-h-[60vh]">
              {activeModal === 'pending' && (
                <div className="space-y-3">
                  {[...pendingLeaveApprovals].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]).map((employee) => (
                    <div
                      key={employee.id}
                      className="flex items-start gap-4 rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors duration-150"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-600 font-semibold text-sm">
                        {employee.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="m-0 text-sm font-semibold text-gray-900">{employee.name}</p>
                        <p className="m-0 text-xs text-gray-600 mt-1">{employee.leaveType}</p>
                        <p className="m-0 text-xs text-gray-500 mt-0.5">Filed on {employee.filedOn}</p>
                        <p className={`m-0 text-xs font-medium mt-1 inline-flex items-center rounded-full px-2 py-0.5 ${priorityClass[employee.priority] || 'bg-gray-100 text-gray-800'}`}>
                          Priority: {employee.priority.charAt(0).toUpperCase() + employee.priority.slice(1)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {!approvedLeaves.has(employee.id) ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleApproveLease(employee.id)}
                              className="inline-flex items-center rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-150"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeny(employee.id)}
                              className="inline-flex items-center rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-150"
                            >
                              Deny
                            </button>
                          </>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 whitespace-nowrap">Approved</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeModal === 'leave' && (
                <div className="space-y-3">
                  {leaveEmployees.map((employee) => (
                    <div
                      key={employee.name}
                      className="flex items-start gap-4 rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors duration-150"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600 font-semibold text-sm">
                        {employee.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="m-0 text-sm font-semibold text-gray-900">{employee.name}</p>
                        <p className="m-0 text-xs text-gray-600 mt-1">{employee.leaveType}</p>
                        <p className="m-0 text-xs text-gray-700 font-semibold mt-0.5">{employee.days}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeModal === 'absent' && (
                <div className="space-y-3">
                  {absentEmployees.map((employee) => (
                    <div
                      key={employee.name}
                      className="flex items-start gap-4 rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors duration-150"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600 font-semibold text-sm">
                        {employee.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="m-0 text-sm font-semibold text-gray-900">{employee.name}</p>
                        <p className="m-0 text-xs text-gray-600 mt-1">{employee.note}</p>
                        <p className="m-0 text-xs text-gray-500 mt-0.5">{employee.date}</p>
                      </div>
                      <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 whitespace-nowrap">Absent</span>
                    </div>
                  ))}
                </div>
              )}

              {activeModal === 'recent-activity' && (
                <div className="space-y-3">
                  {recentActivities.map((activity, idx) => (
                    <div key={idx} className="rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors duration-150">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="m-0 text-sm text-gray-500">{activity.date}</p>
                          <p className="m-0 text-sm font-semibold text-gray-900 mt-1">{activity.employee}</p>
                        </div>
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                          activity.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                          activity.status === 'Approved' ? 'bg-green-100 text-green-800' :
                          activity.status === 'Denied' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {activity.status}
                        </span>
                      </div>
                      <div className="mt-2">
                        <p className="m-0 text-xs font-medium text-gray-600">Activity Type: <span className="text-gray-900">{activity.type}</span></p>
                        <p className="m-0 text-xs text-gray-700 mt-1">{activity.activity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeModal === 'activity-history' && (
                <div className="space-y-3">
                  {recentActivities.map((activity, idx) => (
                    <div key={idx} className="rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors duration-150">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="m-0 text-sm text-gray-500">{activity.date}</p>
                          <p className="m-0 text-sm font-semibold text-gray-900 mt-1">{activity.employee}</p>
                        </div>
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                          activity.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                          activity.status === 'Approved' ? 'bg-green-100 text-green-800' :
                          activity.status === 'Denied' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {activity.status}
                        </span>
                      </div>
                      <div className="mt-2">
                        <p className="m-0 text-xs font-medium text-gray-600">Activity Type: <span className="text-gray-900">{activity.type}</span></p>
                        <p className="m-0 text-xs text-gray-700 mt-1">{activity.activity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4 bg-gray-50">
              <button
                type="button"
                onClick={closeModal}
                className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 transition-colors duration-150"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Seminar/Training Activities */}
      <section className="mt-8 rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="m-0 text-lg font-semibold text-gray-900">Seminar & Training Activities</h3>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowSeminarHistory(!showSeminarHistory)}
              className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-semibold cursor-pointer text-gray-700 hover:bg-gray-50 transition-colors"
            >
              📋 History
            </button>
            <button 
              onClick={() => setShowAddSeminar(!showAddSeminar)}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 border-0 text-white text-sm font-semibold cursor-pointer hover:opacity-90 transition-opacity"
            >
              + Add
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Employee Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Event</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date Deployed</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Expected Return</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {seminarActivities.map((activity, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-6 py-3 text-sm font-medium text-gray-900">{activity.name}</td>
                  <td className="px-6 py-3 text-sm text-gray-700">{activity.event}</td>
                  <td className="px-6 py-3 text-sm text-gray-700">{activity.dateDeployed}</td>
                  <td className="px-6 py-3 text-sm text-gray-700">{activity.expectedReturn}</td>
                  <td className="px-6 py-3 text-sm text-gray-700">{activity.location}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Seminar History Modal */}
        {showSeminarHistory && (
          <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setShowSeminarHistory(false)}>
            <div className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-gray-200 bg-white p-0 shadow-lg rounded-lg" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-purple-200 px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-700">
                <h2 className="m-0 text-lg font-semibold text-white">Seminar History</h2>
                <button type="button" onClick={() => setShowSeminarHistory(false)} className="inline-flex h-8 w-8 items-center justify-center rounded-sm opacity-70 text-white/80 hover:text-white">
                  <span className="text-2xl">×</span>
                </button>
              </div>
              <div className="overflow-y-auto px-6 py-4 max-h-[60vh]">
                <div className="space-y-3">
                  {seminarActivities.map((activity, idx) => (
                    <div key={idx} className="rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors">
                      <p className="m-0 text-sm font-semibold text-gray-900">{activity.name}</p>
                      <p className="m-0 text-xs text-gray-600 mt-1">{activity.event}</p>
                      <p className="m-0 text-xs text-gray-500 mt-0.5">Deployed: {activity.dateDeployed}</p>
                      <p className="m-0 text-xs text-gray-500">Expected Return: {activity.expectedReturn}</p>
                      <p className="m-0 text-xs text-gray-500">Location: {activity.location}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4 bg-gray-50">
                <button type="button" onClick={() => setShowSeminarHistory(false)} className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Seminar Modal */}
        {showAddSeminar && (
          <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setShowAddSeminar(false)}>
            <div className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-gray-200 bg-white p-0 shadow-lg rounded-lg" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-purple-200 px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-700">
                <h2 className="m-0 text-lg font-semibold text-white">Add Seminar Activity</h2>
                <button type="button" onClick={() => setShowAddSeminar(false)} className="inline-flex h-8 w-8 items-center justify-center rounded-sm opacity-70 text-white/80 hover:text-white">
                  <span className="text-2xl">×</span>
                </button>
              </div>
              <div className="overflow-y-auto px-6 py-4 max-h-[60vh]">
                <div className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-gray-700">Employee Name</label>
                    <input type="text" placeholder="Enter employee name" className="px-4 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-purple-500" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-gray-700">Event</label>
                    <input type="text" placeholder="Enter event name" className="px-4 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-purple-500" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-gray-700">Date Deployed</label>
                    <input type="date" className="px-4 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-purple-500" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-gray-700">Expected Return</label>
                    <input type="date" className="px-4 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-purple-500" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-gray-700">Location</label>
                    <input type="text" placeholder="Enter location" className="px-4 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-purple-500" />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4 bg-gray-50">
                <button type="button" onClick={() => setShowAddSeminar(false)} className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
                  Cancel
                </button>
                <button type="button" className="inline-flex items-center justify-center rounded-md bg-gradient-to-r from-purple-600 to-purple-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90">
                  Add Seminar
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Leave Balance Summary */}
      <section className="mt-8 rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="m-0 text-lg font-semibold text-gray-900">Leave Balance Summary</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Employee Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Leave Type</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Used</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {employeeLeaveBalances.map((employee, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-6 py-3 text-sm font-medium text-gray-900">{employee.name}</td>
                  <td className="px-6 py-3 text-sm text-gray-700">{employee.leaveType}</td>
                  <td className="px-6 py-3 text-sm text-gray-700">{employee.used}</td>
                  <td className="px-6 py-3 text-sm">
                    <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                      {employee.balance}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}