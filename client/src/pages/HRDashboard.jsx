import { useState } from 'react'

export default function HRDashboard() {
  const stats = [
    { label: 'Total Employees', value: 30, borderColor: '#5a1ea2' },
    { label: 'Present Today', value: 28, borderColor: '#1a8f3c' },
    { label: 'On Leave', value: 2, borderColor: '#d4a017' },
    { label: 'Absent', value: 1, borderColor: '#c0392b' },
  ]

  return (
    <div className="max-w-full">
      <h1 className="m-0 text-[1.4rem] font-bold text-white mb-6">Dashboard</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all duration-200"
            style={{ borderTop: `4px solid ${stat.borderColor}` }}
          >
            <div className="p-5">
              <p className="m-0 text-sm font-medium text-gray-600 mb-2">{stat.label}</p>
              <p className="m-0 text-3xl font-bold" style={{ color: stat.borderColor }}>
                {stat.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <section className="mb-8">
        <h2 className="m-0 text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-6 rounded-lg border-2 border-dashed border-purple-300 bg-purple-50 text-center hover:bg-purple-100 transition-colors cursor-pointer">
            <p className="m-0 text-2xl mb-2">👥</p>
            <p className="m-0 font-semibold text-gray-900">View Employees</p>
            <p className="m-0 text-xs text-gray-600 mt-1">Manage employee records</p>
          </button>
          <button className="p-6 rounded-lg border-2 border-dashed border-green-300 bg-green-50 text-center hover:bg-green-100 transition-colors cursor-pointer">
            <p className="m-0 text-2xl mb-2">📋</p>
            <p className="m-0 font-semibold text-gray-900">Attendance</p>
            <p className="m-0 text-xs text-gray-600 mt-1">View & manage attendance</p>
          </button>
          <button className="p-6 rounded-lg border-2 border-dashed border-amber-300 bg-amber-50 text-center hover:bg-amber-100 transition-colors cursor-pointer">
            <p className="m-0 text-2xl mb-2">📅</p>
            <p className="m-0 font-semibold text-gray-900">Leave Requests</p>
            <p className="m-0 text-xs text-gray-600 mt-1">Process employee leave</p>
          </button>
        </div>
      </section>

      {/* Recent Activity */}
      <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="m-0 text-lg font-semibold text-gray-900">Recent Activity</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Action</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr className="hover:bg-gray-50 transition-colors duration-150">
                <td className="px-6 py-3 text-sm text-gray-900">2026-03-12</td>
                <td className="px-6 py-3 text-sm text-gray-700">Mark Johnson</td>
                <td className="px-6 py-3 text-sm text-gray-700">Time-in Recorded</td>
                <td className="px-6 py-3 text-sm">
                  <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                    Complete
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-gray-50 transition-colors duration-150">
                <td className="px-6 py-3 text-sm text-gray-900">2026-03-11</td>
                <td className="px-6 py-3 text-sm text-gray-700">Sarah Williams</td>
                <td className="px-6 py-3 text-sm text-gray-700">Leave Request Filed</td>
                <td className="px-6 py-3 text-sm">
                  <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800">
                    Pending
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-gray-50 transition-colors duration-150">
                <td className="px-6 py-3 text-sm text-gray-900">2026-03-10</td>
                <td className="px-6 py-3 text-sm text-gray-700">James Brown</td>
                <td className="px-6 py-3 text-sm text-gray-700">Salary Reviewed</td>
                <td className="px-6 py-3 text-sm">
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                    Reviewed
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
