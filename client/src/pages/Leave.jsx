import { useState } from 'react'

const leaveTypes = ['Birthday Leave', 'Vacation Leave', 'Sick Leave', 'PGT Leave']

const sampleLeaves = [
  { id: 1, empId: 'WAH-006', name: 'Jaline Latoga', type: 'Vacation Leave', from: '2026-03-15', to: '2026-03-17', status: 'Pending', priority: 'high' },
  { id: 2, empId: 'WAH-007', name: 'Dominic Domantay', type: 'Sick Leave', from: '2026-03-10', to: '2026-03-11', status: 'Approved', priority: 'medium' },
  { id: 3, empId: 'WAH-010', name: 'John Vincent Antonio', type: 'Birthday Leave', from: '2026-01-10', to: '2026-01-10', status: 'Approved', priority: 'low' },
  { id: 4, empId: 'WAH-008', name: 'Carla Shey Aguinaldo', type: 'PGT Leave', from: '2026-03-20', to: '2026-03-21', status: 'Approved', priority: 'low' },
  { id: 5, empId: 'WAH-005', name: 'Meryll Jen Lee', type: 'Vacation Leave', from: '2026-03-12', to: '2026-03-14', status: 'Denied', priority: 'high' },
]

function isInRange(date, from, to) {
  return date >= from && date <= to
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function calculateBusinessDays(startDate, endDate) {
  let count = 0
  const current = new Date(startDate)
  const end = new Date(endDate)
  
  while (current <= end) {
    const dayOfWeek = current.getDay()
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++
    }
    current.setDate(current.getDate() + 1)
  }
  return count
}

const leavePolicy = {
  'Birthday Leave': { maxDays: 1, excludeWeekends: true },
  'Vacation Leave': { maxDays: 20, excludeWeekends: true },
  'Sick Leave': { maxDays: 10, excludeWeekends: true },
  'PGT Leave': { maxDays: 20, excludeWeekends: true },
  'Job Order MAC Leave': { maxDays: 12, excludeWeekends: true },
}

const badgeClass = {
  Approved: 'bg-green-100 text-green-800',
  Denied: 'bg-red-100 text-red-800',
  Pending: 'bg-yellow-100 text-yellow-800',
}

const priorityClass = {
  high: 'bg-red-100 text-red-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-blue-100 text-blue-800',
}

function LeaveCalendar({ leaves }) {
  const [viewDate, setViewDate] = useState(new Date(2026, 2, 1))
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = new Date(year, month, 1).getDay()
  const monthName = viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })

  const [selectedDate, setSelectedDate] = useState(null)

  // Color mapping for leave types
  const leaveTypeColors = {
    'PGT Leave': { bg: 'bg-blue-50', border: 'border-l-4 border-l-blue-500', text: 'text-blue-700' },
    'Vacation Leave': { bg: 'bg-green-50', border: 'border-l-4 border-l-green-500', text: 'text-green-700' },
    'Sick Leave': { bg: 'bg-purple-50', border: 'border-l-4 border-l-purple-500', text: 'text-purple-700' },
    'Birthday Leave': { bg: 'bg-pink-50', border: 'border-l-4 border-l-pink-500', text: 'text-pink-700' },
    'Emergency Leave': { bg: 'bg-orange-50', border: 'border-l-4 border-l-orange-500', text: 'text-orange-700' },
  }

  const activeLeaves = leaves.filter((l) => l.status !== 'Denied')

  function getLeavesForDate(dateStr) {
    return activeLeaves.filter((l) => isInRange(dateStr, l.from, l.to))
  }

  function pad(n) {
    return n < 10 ? '0' + n : '' + n
  }

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1))
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1))

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const selectedDateStr = selectedDate ? `${year}-${pad(month + 1)}-${pad(selectedDate)}` : null
  const selectedLeaves = selectedDateStr ? getLeavesForDate(selectedDateStr) : []

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-6 mb-6">
      {/* Legend */}
      <div className="mb-6 pb-6 border-b border-gray-200">
        <h4 className="m-0 text-sm font-semibold text-gray-900 mb-3">Leave Type Legend</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Object.entries(leaveTypeColors).map(([type, colors]) => (
            <div key={type} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${colors.border.split('border-l-')[1]}`}></div>
              <span className="text-xs text-gray-700 whitespace-nowrap">{type}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-5">
        <button className="px-4 py-2 bg-transparent border border-gray-300 rounded-lg text-sm cursor-pointer text-gray-700 hover:bg-gray-50 transition-colors" onClick={prevMonth}>◀ Previous</button>
        <h3 className="m-0 text-lg font-semibold text-gray-900">{monthName}</h3>
        <button className="px-4 py-2 bg-transparent border border-gray-300 rounded-lg text-sm cursor-pointer text-gray-700 hover:bg-gray-50 transition-colors" onClick={nextMonth}>Next ▶</button>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="text-center text-xs font-semibold text-gray-500 py-2">{d}</div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={'e' + i} className="aspect-square" />
          const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`
          const dayLeaves = getLeavesForDate(dateStr)
          const isSelected = day === selectedDate
          const firstLeaveType = dayLeaves.length > 0 ? dayLeaves[0].type : null
          const colorConfig = firstLeaveType ? leaveTypeColors[firstLeaveType] : null
          
          return (
            <button
              key={i}
              type="button"
              className={`min-h-24 flex flex-col items-start justify-start rounded-lg cursor-pointer relative p-1.5 transition-all duration-150 text-[0.65rem] ${
                dayLeaves.length > 0 && !isSelected ? colorConfig?.border + ' ' + colorConfig?.bg : 'border border-gray-200'
              } ${isSelected ? 'bg-purple-600 text-white border-purple-600' : 'hover:border-gray-300'}`}
              onClick={() => setSelectedDate(day === selectedDate ? null : day)}
            >
              <span className={`font-bold text-xs ${isSelected ? 'text-white' : 'text-black'}`}>{day}</span>
              <div className="flex flex-col gap-1 mt-1 w-full">
                {dayLeaves.slice(0, 2).map((leave) => (
                  <div key={leave.id} className="flex flex-col gap-0.5">
                    <span className={`truncate font-semibold text-[0.6rem] ${isSelected ? 'text-white' : 'text-black'}`}>
                      {leave.name}
                    </span>
                    <span className={`truncate text-[0.55rem] ${isSelected ? 'text-gray-200' : 'text-gray-700'}`}>
                      {leave.type} - <span className={`${leave.status === 'Approved' ? 'font-semibold' : ''}`}>{leave.status}</span>
                    </span>
                  </div>
                ))}
                {dayLeaves.length > 2 && (
                  <span className={`text-[0.55rem] font-semibold ${isSelected ? 'text-purple-200' : 'text-purple-700'}`}>
                    +{dayLeaves.length - 2} more
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>
      {selectedDate && (
        <div className="mt-5 pt-4 border-t border-gray-200">
          <h4 className="m-0 mb-3 font-semibold text-gray-900">
            Leaves on {monthName.split(' ')[0]} {selectedDate}, {year}
          </h4>
          {selectedLeaves.length === 0 ? (
            <p className="text-sm text-gray-500">No leaves on this date.</p>
          ) : (
            <ul className="list-none m-0 p-0 flex flex-col gap-2">
              {selectedLeaves.map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="m-0 font-semibold text-gray-900 text-sm">{l.name}</p>
                    <p className="m-0 text-xs text-gray-600 mt-0.5">{l.type}</p>
                    <p className="m-0 text-xs text-gray-500 mt-1">{l.from} to {l.to}</p>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap ${
                    l.status === 'Approved' ? 'bg-green-100 text-green-800' :
                    l.status === 'Denied' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {l.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export default function Leave() {
  const [showForm, setShowForm] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)
  const [formData, setFormData] = useState({
    leaveType: 'Birthday Leave',
    fromDate: '',
    toDate: '',
    reason: '',
    priority: 'low'
  })
  const [formError, setFormError] = useState('')

  const handleLeaveTypeChange = (e) => {
    setFormData({ ...formData, leaveType: e.target.value, fromDate: '', toDate: '' })
    setFormError('')
  }

  const handlePriorityChange = (e) => {
    setFormData({ ...formData, priority: e.target.value })
  }

  const handleFromDateChange = (e) => {
    const newFromDate = e.target.value
    setFormData({ ...formData, fromDate: newFromDate, toDate: '' })
    setFormError('')
  }

  const handleToDateChange = (e) => {
    const toDate = e.target.value
    const policy = leavePolicy[formData.leaveType]
    
    if (formData.fromDate && toDate) {
      const businessDays = calculateBusinessDays(new Date(formData.fromDate), new Date(toDate))
      if (businessDays > policy.maxDays) {
        setFormError(`Maximum ${policy.maxDays} business day(s) allowed for ${formData.leaveType}`)
        return
      }
    }
    
    setFormData({ ...formData, toDate })
    setFormError('')
  }

  const getMaxToDate = () => {
    if (!formData.fromDate) return ''
    const policy = leavePolicy[formData.leaveType]
    const startDate = new Date(formData.fromDate)
    let daysAdded = 0
    const maxDays = policy.maxDays
    
    while (daysAdded < maxDays) {
      startDate.setDate(startDate.getDate() + 1)
      if (startDate.getDay() !== 0 && startDate.getDay() !== 6) {
        daysAdded++
      }
    }
    
    return startDate.toISOString().split('T')[0]
  }

  const isToDateDisabled = formData.leaveType === 'Birthday Leave'

  return (
    <div className="max-w-full">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <h1 className="m-0 text-[1.4rem] font-bold text-gray-900">Leave Applications</h1>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-semibold cursor-pointer text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => { setShowCalendar(!showCalendar); if (showForm) setShowForm(false) }}>
            {showCalendar ? '✕ Close Calendar' : '📅 View Calendar'}
          </button>
          <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 border-0 text-white text-sm font-semibold cursor-pointer hover:opacity-90 transition-opacity" onClick={() => { setShowForm(!showForm); if (showCalendar) setShowCalendar(false) }}>
            {showForm ? '✕ Close' : '+ File Leave'}
          </button>
        </div>
      </div>

      {showCalendar && <LeaveCalendar leaves={sampleLeaves} />}

      {showForm && (
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-6 mb-6">
          <h3 className="m-0 mb-4 text-lg font-semibold text-gray-900">File a Leave Application</h3>
          {formError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {formError}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700">Leave Type</label>
              <select 
                value={formData.leaveType}
                onChange={handleLeaveTypeChange}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {leaveTypes.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Max: {leavePolicy[formData.leaveType]?.maxDays} business day(s)
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700">From</label>
              <input 
                type="date" 
                value={formData.fromDate}
                onChange={handleFromDateChange}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" 
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700">To</label>
              <input 
                type="date" 
                value={formData.toDate}
                onChange={handleToDateChange}
                disabled={isToDateDisabled}
                max={getMaxToDate()}
                min={formData.fromDate}
                className={`px-4 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  isToDateDisabled ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
              />
              {isToDateDisabled && (
                <p className="text-xs text-gray-500">Auto-set to same day as start date</p>
              )}
            </div>
            <div className="flex flex-col gap-2 md:col-span-3">
              <label className="text-sm font-semibold text-gray-700">Priority</label>
              <select 
                value={formData.priority}
                onChange={handlePriorityChange}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="flex flex-col gap-2 md:col-span-3">
              <label className="text-sm font-semibold text-gray-700">Reason</label>
              <textarea 
                rows={3} 
                placeholder="Reason for leave…"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" 
              />
            </div>
          </div>
          <div className="mt-4 flex gap-3 justify-end">
            <button 
              className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-semibold cursor-pointer text-gray-700 hover:bg-gray-50 transition-colors" 
              onClick={() => {
                setShowForm(false)
                setFormData({ leaveType: 'Birthday Leave', fromDate: '', toDate: '', reason: '', priority: 'low' })
                setFormError('')
              }}
            >
              Cancel
            </button>
            <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 border-0 text-white text-sm font-semibold cursor-pointer hover:opacity-90 transition-opacity">Submit</button>
          </div>
        </div>
      )}

      {/* Leave Balances & Workweek Setup */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-6" style={{ borderTopColor: '#5a1ea2', borderTopWidth: '4px' }}>
          <h4 className="m-0 mb-4 font-semibold text-gray-900">Leave Balances</h4>
          <ul className="list-none m-0 p-0 flex flex-col gap-2.5">
            <li className="flex justify-between text-sm text-gray-700"><span>Vacation Leave</span><strong className="text-gray-900">12 days</strong></li>
            <li className="flex justify-between text-sm text-gray-700"><span>Sick Leave</span><strong className="text-gray-900">8 days</strong></li>
            <li className="flex justify-between text-sm text-gray-700"><span>PGT Leave</span><strong className="text-gray-900">5 days</strong></li>
            <li className="flex justify-between text-sm text-gray-700"><span>Birthday Leave</span><strong className="text-gray-900">1 day</strong></li>
            <li className="flex justify-between text-sm text-gray-700"><span>Offset Credits</span><strong className="text-gray-900">2 days</strong></li>
          </ul>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-6" style={{ borderTopColor: '#1a8f3c', borderTopWidth: '4px' }}>
          <h4 className="m-0 mb-4 font-semibold text-gray-900">Workweek Setup</h4>
          <ul className="list-none m-0 p-0 flex flex-col gap-2.5">
            <li className="flex justify-between text-sm text-gray-700"><span>Current</span><strong className="text-gray-900">5 days (8 hrs/day)</strong></li>
            <li className="flex justify-between text-sm text-gray-700"><span>Effective</span><strong className="text-gray-900">Jan 5 – Mar 6</strong></li>
            <li className="flex justify-between text-sm text-gray-700"><span>Next</span><strong className="text-gray-900">4 days (10 hrs/day)</strong></li>
            <li className="flex justify-between text-sm text-gray-700"><span>Starts</span><strong className="text-gray-900">Mar 9 onwards</strong></li>
          </ul>
        </div>
      </div>

      {/* Requests Table */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
          <h3 className="m-0 text-lg font-semibold text-gray-900">All Leave Requests</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">From</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">To</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sampleLeaves.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-6 py-3 text-sm text-gray-900">{l.name}</td>
                  <td className="px-6 py-3 text-sm text-gray-700">{l.type}</td>
                  <td className="px-6 py-3 text-sm text-gray-700">{l.from}</td>
                  <td className="px-6 py-3 text-sm text-gray-700">{l.to}</td>
                  <td className="px-6 py-3 text-sm">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${badgeClass[l.status] || ''}`}>
                      {l.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm">
                    {l.status === 'Pending' && (
                      <div className="flex gap-2">
                        <button className="px-3 py-1 rounded-lg bg-green-100 text-green-700 text-xs font-semibold cursor-pointer hover:bg-green-200 transition-colors border-0">Approve</button>
                        <button className="px-3 py-1 rounded-lg bg-red-100 text-red-700 text-xs font-semibold cursor-pointer hover:bg-red-200 transition-colors border-0">Deny</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Leave Rules Section */}
      <div className="mt-8 rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
          <h3 className="m-0 text-lg font-semibold text-gray-900">Leave Policy & Rules</h3>
        </div>
        <div className="p-6 space-y-6">
          <div className="border-l-4 border-blue-500 pl-4">
            <h4 className="m-0 text-sm font-semibold text-gray-900 mb-2">PGT Leave (Permanent, Casual)</h4>
            <ul className="m-0 p-0 list-none text-sm text-gray-700 space-y-1">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span><strong>Maximum:</strong> 20 days per year</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>Available for employees with Permanent or Casual designation</span>
              </li>
            </ul>
          </div>

          <div className="border-l-4 border-green-500 pl-4">
            <h4 className="m-0 text-sm font-semibold text-gray-900 mb-2">PGT Permanent/Casual Additional Leave</h4>
            <ul className="m-0 p-0 list-none text-sm text-gray-700 space-y-1">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">•</span>
                <span><strong>Additional:</strong> 7 days per year</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">•</span>
                <span><strong>Total for PGT Permanent/Casual:</strong> 27 days (20 + 7)</span>
              </li>
            </ul>
          </div>

          <div className="border-l-4 border-purple-500 pl-4">
            <h4 className="m-0 text-sm font-semibold text-gray-900 mb-2">Job Order MAC Leave</h4>
            <ul className="m-0 p-0 list-none text-sm text-gray-700 space-y-1">
              <li className="flex items-start gap-2">
                <span className="text-purple-500 mt-1">•</span>
                <span><strong>Maximum:</strong> 12 days per year</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-500 mt-1">•</span>
                <span>Available for employees with Job Order or MAC designation</span>
              </li>
            </ul>
          </div>

          <div className="border-l-4 border-pink-500 pl-4">
            <h4 className="m-0 text-sm font-semibold text-gray-900 mb-2">Birthday Leave</h4>
            <ul className="m-0 p-0 list-none text-sm text-gray-700 space-y-1">
              <li className="flex items-start gap-2">
                <span className="text-pink-500 mt-1">•</span>
                <span><strong>Maximum:</strong> 1 day per year</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-pink-500 mt-1">•</span>
                <span>Can be taken on employee's birthday or with supervisor approval on adjacent date</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}