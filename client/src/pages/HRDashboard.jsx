import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { URL } from "../assets/constant";
import { useQuery } from "@tanstack/react-query";

const attendanceTypes = {
  Present: { abbr: "P", color: "bg-green-100 text-green-800" },
  Absent: { abbr: "A", color: "bg-red-100 text-red-800" },
  "Week-Off / Weekends": { abbr: "WO", color: "bg-orange-100 text-orange-800" },
  "Sick Leave": { abbr: "SL", color: "bg-blue-100 text-blue-800" },
  "Un/Scheduled Leave": { abbr: "V", color: "bg-purple-100 text-purple-800" },
  "Work From Home": { abbr: "WFH", color: "bg-indigo-100 text-indigo-800" },
  Quarantine: { abbr: "Q", color: "bg-pink-100 text-pink-800" },
  Holiday: { abbr: "H", color: "bg-yellow-100 text-yellow-800" },
  "Birthday Leave": { abbr: "BL", color: "bg-pink-200 text-pink-900" },
  Late: { abbr: "L", color: "bg-yellow-200 text-yellow-900" },
  Field: { abbr: "FLD", color: "bg-orange-200 text-orange-900" },
  "PGT Leave": { abbr: "PGT", color: "bg-green-200 text-green-900" },
  "Maternity Leave": { abbr: "ML", color: "bg-cyan-100 text-cyan-800" },
  "Team Building": { abbr: "TB", color: "bg-red-900 text-white" },
};

export default function HRDashboard() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [activeModal, setActiveModal] = useState(null);

  const [formData, setFormData] = useState({
    employeeName: "",
    designation: "",
    dateEmployed: "",
    requirementsMissing: "",
  });

  // --- FETCH REAL DASHBOARD DATA ---
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["dashboardSummary"],
    queryFn: async () => {
      const res = await fetch(`${URL}/api/employees/dashboard-summary`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "69420",
          "bypass-tunnel-reminder": "true",
        },
      });
      if (!res.ok) throw new Error("Failed to fetch dashboard data");
      return res.json();
    },
  });

  const stats = [
    {
      label: "Pending Leave Approval",
      value: dashboardData?.pendingLeaves?.length || 0,
      borderColor: "#d4a017",
      modalKey: "pending-leave-approval",
    },
    {
      label: "Pending Resignation Approval",
      value: 1,
      borderColor: "#1a8f3c",
      modalKey: "pending-resignation-approval",
    }, // Placeholder value
    {
      label: "On Leave",
      value: dashboardData?.onLeave?.length || 0,
      borderColor: "#d4a017",
      modalKey: "on-leave",
    },
    {
      label: "Absent",
      value: dashboardData?.absents?.length || 0,
      borderColor: "#c0392b",
      modalKey: "absent",
    },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    alert("New hire plan added successfully!");
    setFormData({
      employeeName: "",
      designation: "",
      dateEmployed: "",
      requirementsMissing: "",
    });
    setShowModal(false);
  };

  if (isLoading) {
    return (
      <div className="p-6 text-white font-bold">Loading HR Dashboard...</div>
    );
  }

  return (
    <div className="max-w-full">
      <h1 className="m-0 text-[1.4rem] font-bold text-gray-900 mb-6">
        HR Dashboard
      </h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <button
            key={stat.label}
            type="button"
            onClick={() => setActiveModal(stat.modalKey)}
            className="rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1 cursor-pointer text-left"
            style={{ borderTop: `4px solid ${stat.borderColor}` }}
          >
            <div className="p-5">
              <p className="m-0 text-sm font-medium text-gray-600 mb-2">
                {stat.label}
              </p>
              <p
                className="m-0 text-3xl font-bold"
                style={{ color: stat.borderColor }}
              >
                {stat.value}
              </p>
              <p className="m-0 text-xs text-gray-400 mt-2">
                Click to view details
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Quick Actions */}
      <section className="mb-8">
        <h2 className="m-0 text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate("/employees")}
            className="p-6 rounded-lg border-2 border-dashed border-purple-300 bg-purple-50 text-center hover:bg-purple-100 transition-colors cursor-pointer"
          >
            <p className="m-0 text-2xl mb-2">👥</p>
            <p className="m-0 font-semibold text-gray-900">View Employees</p>
            <p className="m-0 text-xs text-gray-600 mt-1">
              Manage employee records
            </p>
          </button>
          <button
            onClick={() => navigate("/attendance")}
            className="p-6 rounded-lg border-2 border-dashed border-green-300 bg-green-50 text-center hover:bg-green-100 transition-colors cursor-pointer"
          >
            <p className="m-0 text-2xl mb-2">📋</p>
            <p className="m-0 font-semibold text-gray-900">Attendance</p>
            <p className="m-0 text-xs text-gray-600 mt-1">
              View & manage attendance
            </p>
          </button>
          <button
            onClick={() => navigate("/leave")}
            className="p-6 rounded-lg border-2 border-dashed border-amber-300 bg-amber-50 text-center hover:bg-amber-100 transition-colors cursor-pointer"
          >
            <p className="m-0 text-2xl mb-2">📅</p>
            <p className="m-0 font-semibold text-gray-900">Leave Requests</p>
            <p className="m-0 text-xs text-gray-600 mt-1">
              Process employee leave
            </p>
          </button>
        </div>
      </section>

      {/* Pending Resignation Approval */}
      <section className="rounded-lg border border-gray-200 bg-white shadow-sm mb-8">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="m-0 text-lg font-semibold text-gray-900">
            Pending Resignation Approval
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Resignation Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr className="hover:bg-gray-50 transition-colors duration-150">
                <td className="px-6 py-3 text-sm text-gray-900">2026-03-10</td>
                <td className="px-6 py-3 text-sm text-gray-700">
                  Robert Michael Martinez
                </td>
                <td className="px-6 py-3 text-sm text-gray-700">
                  Voluntary Resignation
                </td>
                <td className="px-6 py-3 text-sm">
                  <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800">
                    Pending Approval
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* New Hire Onboard Plan */}
      <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h3 className="m-0 text-lg font-semibold text-gray-900">
            New Hire Onboard Plan
          </h3>
          <div className="flex gap-3">
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 rounded-lg bg-purple-600 text-white text-xs font-semibold cursor-pointer hover:bg-purple-700 transition-all duration-200 hover:shadow-md border-0 shadow-sm"
            >
              Add New Hire
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Employee Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Designation
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Date Employed
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Requirements Missing
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr className="hover:bg-gray-50 transition-colors duration-150">
                <td className="px-6 py-3 text-sm font-medium text-gray-900">
                  Meryll Jen Lee
                </td>
                <td className="px-6 py-3 text-sm text-gray-700">
                  Assistant Partner
                </td>
                <td className="px-6 py-3 text-sm text-gray-700">2026-01-12</td>
                <td className="px-6 py-3 text-sm">
                  <span className="inline-flex items-center rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-800">
                    2
                  </span>
                </td>
                <td className="px-6 py-3 text-sm">
                  <button className="px-3 py-1 rounded-lg bg-purple-100 text-purple-700 text-xs font-semibold cursor-pointer hover:bg-purple-200 transition-all duration-200 border-0 shadow-sm">
                    VIEW PLAN
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal for Add New Hire */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900/40 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-0 w-full max-w-[500px] overflow-hidden">
            <div className="flex items-center justify-between bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
              <h2 className="m-0 text-lg font-semibold text-white">
                Add New Hire
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="bg-transparent border-0 text-2xl cursor-pointer text-white/80 hover:text-white"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Employee Name *
                </label>
                <input
                  type="text"
                  name="employeeName"
                  value={formData.employeeName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter employee name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Designation *
                </label>
                <input
                  type="text"
                  name="designation"
                  value={formData.designation}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter designation"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Date Employed *
                </label>
                <input
                  type="date"
                  name="dateEmployed"
                  value={formData.dateEmployed}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Requirements Missing *
                </label>
                <input
                  type="number"
                  name="requirementsMissing"
                  value={formData.requirementsMissing}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter number"
                  min="0"
                />
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-200 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-semibold cursor-pointer hover:bg-gray-200 transition-colors border-0"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-lg bg-purple-600 text-white font-semibold cursor-pointer hover:bg-purple-700 transition-colors border-0"
                >
                  Save New Hire
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- DYNAMIC STAT CARD MODALS --- */}

      {/* Pending Leave Approval Modal (Read Only for HR) */}
      {activeModal === "pending-leave-approval" && (
        <div className="fixed inset-0 bg-gray-900/40 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-0 w-full max-w-[500px] overflow-hidden flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 shrink-0">
              <h2 className="m-0 text-lg font-semibold text-white">
                Pending Leaves (Read-Only)
              </h2>
              <button
                onClick={() => setActiveModal(null)}
                className="bg-transparent border-0 text-2xl cursor-pointer text-white/80 hover:text-white"
              >
                ×
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
              {dashboardData?.pendingLeaves?.length === 0 ? (
                <p className="text-center text-gray-500 font-medium">
                  No pending requests.
                </p>
              ) : (
                <div className="space-y-3">
                  {dashboardData?.pendingLeaves?.map((employee, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-600 font-bold text-sm shrink-0">
                        {employee.first_name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="m-0 text-sm font-bold text-gray-900">
                          {employee.first_name} {employee.last_name}
                        </p>
                        <p className="m-0 text-xs text-gray-600 mt-1">
                          {employee.leave_type}
                        </p>
                        <p className="m-0 text-xs text-gray-500 mt-0.5">
                          {new Date(employee.date_from).toLocaleDateString()} -{" "}
                          {new Date(employee.date_to).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-bold text-yellow-800">
                        Pending
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* On Leave Modal */}
      {activeModal === "on-leave" && (
        <div className="fixed inset-0 bg-gray-900/40 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-0 w-full max-w-[500px] overflow-hidden flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 shrink-0">
              <h2 className="m-0 text-lg font-semibold text-white">
                Employees Currently on Leave
              </h2>
              <button
                onClick={() => setActiveModal(null)}
                className="bg-transparent border-0 text-2xl cursor-pointer text-white/80 hover:text-white"
              >
                ×
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
              {dashboardData?.onLeave?.length === 0 ? (
                <p className="text-center text-gray-500 font-medium">
                  No employees on leave today.
                </p>
              ) : (
                <div className="space-y-3">
                  {dashboardData?.onLeave?.map((employee, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600 font-bold text-sm shrink-0">
                        {employee.first_name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="m-0 text-sm font-bold text-gray-900">
                          {employee.first_name} {employee.last_name}
                        </p>
                        <p className="m-0 text-xs text-gray-600 mt-1">
                          {employee.leave_type}
                        </p>
                      </div>
                      <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                        On Leave
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Absent Modal */}
      {activeModal === "absent" && (
        <div className="fixed inset-0 bg-gray-900/40 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-0 w-full max-w-[500px] overflow-hidden flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 shrink-0">
              <h2 className="m-0 text-lg font-semibold text-white">
                Absent Employees
              </h2>
              <button
                onClick={() => setActiveModal(null)}
                className="bg-transparent border-0 text-2xl cursor-pointer text-white/80 hover:text-white"
              >
                ×
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
              {dashboardData?.absents?.length === 0 ? (
                <p className="text-center text-gray-500 font-medium">
                  No absent employees today.
                </p>
              ) : (
                <div className="space-y-3">
                  {dashboardData?.absents?.map((employee, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600 font-bold text-sm shrink-0">
                        {employee.first_name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="m-0 text-sm font-bold text-gray-900">
                          {employee.first_name} {employee.last_name}
                        </p>
                        <p className="m-0 text-xs text-gray-600 mt-1">
                          Not marked present for today.
                        </p>
                      </div>
                      <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-800">
                        Absent
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Resignation Modal (Placeholder) */}
      {activeModal === "pending-resignation-approval" && (
        <div className="fixed inset-0 bg-gray-900/40 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-0 w-full max-w-[500px] overflow-hidden">
            <div className="flex items-center justify-between bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
              <h2 className="m-0 text-lg font-semibold text-white">
                Pending Resignations
              </h2>
              <button
                onClick={() => setActiveModal(null)}
                className="bg-transparent border-0 text-2xl cursor-pointer text-white/80 hover:text-white"
              >
                ×
              </button>
            </div>
            <div className="p-6 text-center text-gray-500">
              <p>Robert Michael Martinez - Pending Approval</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
