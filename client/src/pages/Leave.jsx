import { useState } from 'react'

const leaveTypes = ['Birthday Leave', 'Vacation Leave', 'Sick Leave', 'PGT Leave']

const sampleLeaves = [
  { id: 1, empId: 'WAH-006', name: 'Jaline Latoga', type: 'Vacation Leave', from: '2026-03-15', to: '2026-03-17', status: 'Pending' },
  { id: 2, empId: 'WAH-007', name: 'Dominic Domantay', type: 'Sick Leave', from: '2026-03-10', to: '2026-03-11', status: 'Approved' },
  { id: 3, empId: 'WAH-010', name: 'John Vincent Antonio', type: 'Birthday Leave', from: '2026-01-10', to: '2026-01-10', status: 'Approved' },
  { id: 4, empId: 'WAH-008', name: 'Carla Shey Aguinaldo', type: 'PGT Leave', from: '2026-03-20', to: '2026-03-21', status: 'Pending' },
  { id: 5, empId: 'WAH-005', name: 'Meryll Jen Lee', type: 'Vacation Leave', from: '2026-03-12', to: '2026-03-14', status: 'Denied' },
]

function isInRange(date, from, to) {
  return date >= from && date <= to
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function LeaveCalendar({ leaves }) {
  const [viewDate, setViewDate] = useState(new Date(2026, 2, 1))
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = new Date(year, month, 1).getDay()
  const monthName = viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })

  const [selectedDate, setSelectedDate] = useState(null)

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

  const selectedDateStr = selectedDate
    ? `${year}-${pad(month + 1)}-${pad(selectedDate)}`
    : null
  const selectedLeaves = selectedDateStr ? getLeavesForDate(selectedDateStr) : []

  return (
    <div className="bg-white rounded-xl p-5 mb-6 border border-wah-border">
      <div className="flex items-center justify-between mb-3">
        <button className="bg-transparent border-none text-base cursor-pointer text-wah-primary px-2.5 py-1 rounded-md hover:bg-purple-50" onClick={prevMonth}>◀</button>
        <h3 className="m-0 text-wah-dark text-[1.1rem]">{monthName}</h3>
        <button className="bg-transparent border-none text-base cursor-pointer text-wah-primary px-2.5 py-1 rounded-md hover:bg-purple-50" onClick={nextMonth}>▶</button>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={'e' + i} className="aspect-square" />
          const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`
          const count = getLeavesForDate(dateStr).length
          const isSelected = day === selectedDate
          return (
            <div
              key={i}
              className={`aspect-square flex flex-col items-center justify-center rounded-lg cursor-pointer relative text-[0.88rem] transition-colors duration-100 hover:bg-purple-50 ${count > 0 && !isSelected ? 'bg-purple-100' : ''} ${isSelected ? 'bg-wah-primary text-white' : ''}`}
              onClick={() => setSelectedDate(day === selectedDate ? null : day)}
            >
              <span className="font-medium">{day}</span>
              {count > 0 && (
                <span className={`w-[18px] h-[18px] rounded-full text-[0.65rem] font-bold grid place-items-center mt-0.5 ${isSelected ? 'bg-white text-wah-primary' : 'bg-wah-primary text-white'}`}>
                  {count}
                </span>
              )}
            </div>
          )
        })}
      </div>
      {selectedDate && (
        <div className="mt-4 pt-3.5 border-t border-wah-border">
          <h4 className="m-0 mb-2.5 text-wah-dark text-[0.95rem]">
            Leaves on {monthName.split(' ')[0]} {selectedDate}, {year}
          </h4>
          {selectedLeaves.length === 0 ? (
            <p className="text-gray-400 text-sm">No leaves on this date.</p>
          ) : (
            <ul className="list-none m-0 p-0 flex flex-col gap-2">
              {selectedLeaves.map((l) => (
                <li key={l.id} className="flex items-center gap-2 text-sm">
                  <strong>{l.name}</strong> — {l.type}
                  <span className={`px-3 py-0.5 rounded-full text-[0.78rem] font-semibold ${l.status === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
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

const badgeClass = {
  Approved: 'bg-green-100 text-green-800',
  Denied: 'bg-red-100 text-red-800',
  Pending: 'bg-yellow-100 text-yellow-800',
}

export default function Leave() {
  const [showForm, setShowForm] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)

  return (
    <div className="max-w-full">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <h1 className="m-0 text-[1.4rem] text-wah-dark">Leave Applications</h1>
        <div className="flex items-center gap-3">
          <button className="px-[22px] py-2.5 rounded-[10px] border-[1.5px] border-wah-light bg-transparent text-wah-primary text-[0.95rem] font-semibold cursor-pointer" onClick={() => { setShowCalendar(!showCalendar); if (showForm) setShowForm(false) }}>
            {showCalendar ? '✕ Close Calendar' : '📅 View Calendar'}
          </button>
          <button className="px-[22px] py-2.5 rounded-[10px] border-0 text-white text-[0.95rem] font-semibold cursor-pointer bg-gradient-to-r from-wah-primary to-wah-lighter hover:opacity-90" onClick={() => { setShowForm(!showForm); if (showCalendar) setShowCalendar(false) }}>
            {showForm ? '✕ Close' : '+ File Leave'}
          </button>
        </div>
      </div>

      {showCalendar && <LeaveCalendar leaves={sampleLeaves} />}

      {showForm && (
        <div className="bg-white rounded-xl p-7 mb-6 border border-wah-border">
          <h3 className="m-0 mb-[18px] text-wah-dark">File a Leave Application</h3>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3.5">
            <div className="flex flex-col gap-1">
              <label className="text-[0.85rem] text-gray-500 font-semibold">Leave Type</label>
              <select className="px-3 py-2.5 rounded-[10px] border-[1.5px] border-gray-300 text-[0.92rem] outline-none font-[inherit] focus:border-wah-light">
                {leaveTypes.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[0.85rem] text-gray-500 font-semibold">From</label>
              <input type="date" className="px-3 py-2.5 rounded-[10px] border-[1.5px] border-gray-300 text-[0.92rem] outline-none font-[inherit] focus:border-wah-light" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[0.85rem] text-gray-500 font-semibold">To</label>
              <input type="date" className="px-3 py-2.5 rounded-[10px] border-[1.5px] border-gray-300 text-[0.92rem] outline-none font-[inherit] focus:border-wah-light" />
            </div>
            <div className="flex flex-col gap-1 col-span-full">
              <label className="text-[0.85rem] text-gray-500 font-semibold">Reason</label>
              <textarea rows={3} placeholder="Reason for leave…" className="px-3 py-2.5 rounded-[10px] border-[1.5px] border-gray-300 text-[0.92rem] outline-none font-[inherit] focus:border-wah-light" />
            </div>
          </div>
          <div className="mt-[18px] flex gap-2.5">
            <button className="px-[22px] py-2.5 rounded-[10px] border-0 text-white text-[0.95rem] font-semibold cursor-pointer bg-gradient-to-r from-wah-primary to-wah-lighter hover:opacity-90">Submit</button>
            <button className="px-[22px] py-2.5 rounded-[10px] border-[1.5px] border-wah-light bg-transparent text-wah-primary text-[0.95rem] font-semibold cursor-pointer" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl px-6 py-[22px] border border-wah-border">
          <h4 className="m-0 mb-3 text-wah-dark">Leave Balances</h4>
          <ul className="list-none m-0 p-0 flex flex-col gap-2">
            <li className="flex justify-between text-[0.9rem] text-gray-600"><span>Vacation Leave</span><strong>12 days</strong></li>
            <li className="flex justify-between text-[0.9rem] text-gray-600"><span>Sick Leave</span><strong>8 days</strong></li>
            <li className="flex justify-between text-[0.9rem] text-gray-600"><span>PGT Leave</span><strong>5 days</strong></li>
            <li className="flex justify-between text-[0.9rem] text-gray-600"><span>Birthday Leave</span><strong>1 day</strong></li>
            <li className="flex justify-between text-[0.9rem] text-gray-600"><span>Offset Credits</span><strong>2 days</strong></li>
          </ul>
        </div>
        <div className="bg-white rounded-xl px-6 py-[22px] border border-wah-border">
          <h4 className="m-0 mb-3 text-wah-dark">Workweek Setup</h4>
          <ul className="list-none m-0 p-0 flex flex-col gap-2">
            <li className="flex justify-between text-[0.9rem] text-gray-600"><span>Current</span><strong>5 days (8 hrs/day)</strong></li>
            <li className="flex justify-between text-[0.9rem] text-gray-600"><span>Effective</span><strong>Jan 5 – Mar 6</strong></li>
            <li className="flex justify-between text-[0.9rem] text-gray-600"><span>Next</span><strong>4 days (10 hrs/day)</strong></li>
            <li className="flex justify-between text-[0.9rem] text-gray-600"><span>Starts</span><strong>Mar 9 onwards</strong></li>
          </ul>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-white rounded-xl overflow-hidden">
          <thead>
            <tr>
              <th className="px-3 py-2.5 text-left text-[0.85rem] border-b border-gray-100 bg-wah-table-head text-wah-dark font-semibold whitespace-nowrap">Employee</th>
              <th className="px-3 py-2.5 text-left text-[0.85rem] border-b border-gray-100 bg-wah-table-head text-wah-dark font-semibold whitespace-nowrap">Type</th>
              <th className="px-3 py-2.5 text-left text-[0.85rem] border-b border-gray-100 bg-wah-table-head text-wah-dark font-semibold whitespace-nowrap">From</th>
              <th className="px-3 py-2.5 text-left text-[0.85rem] border-b border-gray-100 bg-wah-table-head text-wah-dark font-semibold whitespace-nowrap">To</th>
              <th className="px-3 py-2.5 text-left text-[0.85rem] border-b border-gray-100 bg-wah-table-head text-wah-dark font-semibold whitespace-nowrap">Status</th>
              <th className="px-3 py-2.5 text-left text-[0.85rem] border-b border-gray-100 bg-wah-table-head text-wah-dark font-semibold whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sampleLeaves.map((l) => (
              <tr key={l.id} className="hover:bg-wah-table-hover">
                <td className="px-3 py-2.5 text-left text-[0.85rem] border-b border-gray-100">{l.name}</td>
                <td className="px-3 py-2.5 text-left text-[0.85rem] border-b border-gray-100">{l.type}</td>
                <td className="px-3 py-2.5 text-left text-[0.85rem] border-b border-gray-100">{l.from}</td>
                <td className="px-3 py-2.5 text-left text-[0.85rem] border-b border-gray-100">{l.to}</td>
                <td className="px-3 py-2.5 text-left text-[0.85rem] border-b border-gray-100">
                  <span className={`px-3 py-0.5 rounded-full text-[0.78rem] font-semibold ${badgeClass[l.status] || ''}`}>
                    {l.status}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-left text-[0.85rem] border-b border-gray-100">
                  {l.status === 'Pending' && (
                    <div className="flex gap-1.5">
                      <button className="px-3 py-[5px] rounded-md border-0 text-white text-[0.8rem] font-semibold cursor-pointer bg-wah-green">Approve</button>
                      <button className="px-3 py-[5px] rounded-md border-0 text-white text-[0.8rem] font-semibold cursor-pointer bg-wah-red">Deny</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
