import { useState } from 'react'

export default function HRReports() {
  const [reportType, setReportType] = useState('leave')
  const [dateRange, setDateRange] = useState('month')

  const leaveReports = [
    {
      id: 1,
      employee: 'Jaline Latoga',
      empId: 'WAH-001',
      leaveType: 'Vacation Leave',
      days: 3,
      status: 'Approved',
      dateFrom: '2026-03-15',
      dateTo: '2026-03-17',
    },
    {
      id: 2,
      employee: 'Dominic Domantay',
      empId: 'WAH-002',
      leaveType: 'Sick Leave',
      days: 2,
      status: 'Approved',
      dateFrom: '2026-03-10',
      dateTo: '2026-03-11',
    },
    {
      id: 3,
      employee: 'Kevin Greg Alvarado',
      empId: 'WAH-003',
      leaveType: 'Birthday Leave',
      days: 1,
      status: 'Denied',
      dateFrom: '2026-03-09',
      dateTo: '2026-03-09',
    },
    {
      id: 4,
      employee: 'Ana Cris Mijares',
      empId: 'WAH-005',
      leaveType: 'Emergency Leave',
      days: 1,
      status: 'Pending',
      dateFrom: '2026-03-12',
      dateTo: '2026-03-12',
    },
  ]

  const attendanceReports = [
    { date: '2026-03-12', present: 28, absent: 1, onLeave: 2, late: 3 },
    { date: '2026-03-11', present: 29, absent: 0, onLeave: 1, late: 2 },
    { date: '2026-03-10', present: 27, absent: 2, onLeave: 1, late: 4 },
    { date: '2026-03-09', present: 30, absent: 0, onLeave: 0, late: 1 },
  ]

  const leaveBalanceReports = [
    { employee: 'Jaline Latoga', empId: 'WAH-001', vacationUsed: 5, vacationBalance: 15, sickUsed: 2, sickBalance: 18, birthdayUsed: 0, birthdayBalance: 1 },
    { employee: 'Dominic Domantay', empId: 'WAH-002', vacationUsed: 3, vacationBalance: 17, sickUsed: 3, sickBalance: 17, birthdayUsed: 1, birthdayBalance: 0 },
    { employee: 'Kevin Greg Alvarado', empId: 'WAH-003', vacationUsed: 2, vacationBalance: 18, sickUsed: 1, sickBalance: 19, birthdayUsed: 0, birthdayBalance: 1 },
    { employee: 'Meryll Jen Lee', empId: 'WAH-004', vacationUsed: 8, vacationBalance: 12, sickUsed: 0, sickBalance: 20, birthdayUsed: 1, birthdayBalance: 0 },
  ]

  const statusColors = {
    Approved: 'bg-green-100 text-green-800',
    Denied: 'bg-red-100 text-red-800',
    Pending: 'bg-yellow-100 text-yellow-800',
  }

  return (
    <div className="max-w-full">
      <h1 className="m-0 text-[1.4rem] font-bold text-white mb-6">HR Reports</h1>

      {/* Report Type Selector */}
      <div className="mb-8 rounded-lg border border-gray-200 bg-white shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full border-[1.8px] border-gray-300 rounded-lg px-4 py-2 text-base text-gray-900 outline-none focus:border-purple-600"
            >
              <option value="leave">Leave Applications</option>
              <option value="attendance">Attendance Summary</option>
              <option value="balance">Leave Balance</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full border-[1.8px] border-gray-300 rounded-lg px-4 py-2 text-base text-gray-900 outline-none focus:border-purple-600"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Leave Applications Report */}
      {reportType === 'leave' && (
        <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <h3 className="m-0 text-lg font-semibold text-gray-900">Leave Applications Report</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Leave Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Days</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">From Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">To Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {leaveReports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-3 text-sm text-gray-900 font-medium">{report.employee}</td>
                    <td className="px-6 py-3 text-sm text-gray-700">{report.leaveType}</td>
                    <td className="px-6 py-3 text-sm text-gray-700">{report.days}</td>
                    <td className="px-6 py-3 text-sm text-gray-700">{report.dateFrom}</td>
                    <td className="px-6 py-3 text-sm text-gray-700">{report.dateTo}</td>
                    <td className="px-6 py-3 text-sm">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusColors[report.status]}`}>
                        {report.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Attendance Summary Report */}
      {reportType === 'attendance' && (
        <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <h3 className="m-0 text-lg font-semibold text-gray-900">Attendance Summary Report</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Present</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Absent</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">On Leave</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Late</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {attendanceReports.map((report, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-3 text-sm font-medium text-gray-900">{report.date}</td>
                    <td className="px-6 py-3 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-800 font-semibold text-sm">{report.present}</span>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-800 font-semibold text-sm">{report.absent}</span>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 text-yellow-800 font-semibold text-sm">{report.onLeave}</span>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-800 font-semibold text-sm">{report.late}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Leave Balance Report */}
      {reportType === 'balance' && (
        <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <h3 className="m-0 text-lg font-semibold text-gray-900">Leave Balance Report</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Vacation Used</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Vacation Balance</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Sick Used</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Sick Balance</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Birthday Used</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Birthday Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {leaveBalanceReports.map((report, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-3 text-sm font-medium text-gray-900">{report.employee}</td>
                    <td className="px-6 py-3 text-center text-sm font-semibold text-orange-600">{report.vacationUsed}</td>
                    <td className="px-6 py-3 text-center text-sm font-semibold text-green-600">{report.vacationBalance}</td>
                    <td className="px-6 py-3 text-center text-sm font-semibold text-orange-600">{report.sickUsed}</td>
                    <td className="px-6 py-3 text-center text-sm font-semibold text-green-600">{report.sickBalance}</td>
                    <td className="px-6 py-3 text-center text-sm font-semibold text-orange-600">{report.birthdayUsed}</td>
                    <td className="px-6 py-3 text-center text-sm font-semibold text-green-600">{report.birthdayBalance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
