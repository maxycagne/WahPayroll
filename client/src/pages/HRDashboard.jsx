import { useState } from "react";

export default function HRDashboard() {
  const [showModal, setShowModal] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [formData, setFormData] = useState({
    employeeName: "",
    designation: "",
    dateEmployed: "",
    requirementsMissing: "",
  });

  const stats = [
    { label: "Pending Leave Approval", value: 1, borderColor: "#d4a017" },
    { label: "Pending Resignation Approval", value: 1, borderColor: "#1a8f3c" },
    { label: "On Leave", value: 2, borderColor: "#d4a017" },
    { label: "Absent", value: 1, borderColor: "#c0392b" },
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
    setFormData({
      employeeName: "",
      designation: "",
      dateEmployed: "",
      requirementsMissing: "",
    });
    setShowModal(false);
  };

  return (
    <div className="max-w-full">
      <h1 className="m-0 text-[1.4rem] font-bold text-white mb-6">Dashboard</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <button
            key={stat.label}
            type="button"
            onClick={() => setActiveModal(stat.label.toLowerCase().replace(/\s+/g, "-"))}
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
            </div>
          </button>
        ))}
      </div>

      {/* Attendance Section */}
      <section className="rounded-lg border border-gray-200 bg-white shadow-sm mb-8">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="m-0 text-lg font-semibold text-gray-900">
            Attendance
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Employee Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr className="hover:bg-gray-50 transition-colors duration-150">
                <td className="px-6 py-3 text-sm font-medium text-gray-900">
                  aldrin Villanueva
                </td>
                <td className="px-6 py-3 text-sm text-gray-700">2026-03-18</td>
                <td className="px-6 py-3 text-sm">
                  <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                    Present
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-gray-50 transition-colors duration-150">
                <td className="px-6 py-3 text-sm font-medium text-gray-900">
                  gregy boy Jimenez
                </td>
                <td className="px-6 py-3 text-sm text-gray-700">2026-03-18</td>
                <td className="px-6 py-3 text-sm">
                  <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800">
                    On Leave
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-gray-50 transition-colors duration-150">
                <td className="px-6 py-3 text-sm font-medium text-gray-900">
                  Maria Santos Lopez
                </td>
                <td className="px-6 py-3 text-sm text-gray-700">2026-03-18</td>
                <td className="px-6 py-3 text-sm">
                  <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                    Present
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-gray-50 transition-colors duration-150">
                <td className="px-6 py-3 text-sm font-medium text-gray-900">
                  James Rivera Cruz
                </td>
                <td className="px-6 py-3 text-sm text-gray-700">2026-03-18</td>
                <td className="px-6 py-3 text-sm">
                  <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800">
                    Absent
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Pending Approval Sections - Side by Side */}

      {/* New Hire Onboard Plan */}
      <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h3 className="m-0 text-lg font-semibold text-gray-900">
            New Hire Onboard Plan
          </h3>
          <div className="flex gap-3">
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 rounded-lg bg-purple-600 text-white text-xs font-semibold cursor-pointer hover:bg-purple-700 transition-all duration-200 hover:shadow-md hover:-translate-y-1 border-0 shadow-sm"
            >
              Add
            </button>
            <button className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 text-xs font-semibold cursor-pointer hover:bg-gray-300 transition-all duration-200 hover:shadow-md hover:-translate-y-1 border-0 shadow-sm">
              History
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
                  <button className="px-3 py-1 rounded-lg bg-purple-100 text-purple-700 text-xs font-semibold cursor-pointer hover:bg-purple-200 transition-all duration-200 hover:shadow-md hover:-translate-y-1 border-0 shadow-sm">
                    VIEW ON BOARD PLAN
                  </button>
                </td>
              </tr>
              <tr className="hover:bg-gray-50 transition-colors duration-150">
                <td className="px-6 py-3 text-sm font-medium text-gray-900">
                  Carla Shey Aguinaldo
                </td>
                <td className="px-6 py-3 text-sm text-gray-700">
                  Health Program Partner
                </td>
                <td className="px-6 py-3 text-sm text-gray-700">2026-02-01</td>
                <td className="px-6 py-3 text-sm">
                  <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                    0
                  </span>
                </td>
                <td className="px-6 py-3 text-sm">
                  <button className="px-3 py-1 rounded-lg bg-purple-100 text-purple-700 text-xs font-semibold cursor-pointer hover:bg-purple-200 transition-all duration-200 hover:shadow-md hover:-translate-y-1 border-0 shadow-sm">
                    VIEW ON BOARD PLAN
                  </button>
                </td>
              </tr>
              <tr className="hover:bg-gray-50 transition-colors duration-150">
                <td className="px-6 py-3 text-sm font-medium text-gray-900">
                  John Vincent Antonio
                </td>
                <td className="px-6 py-3 text-sm text-gray-700">
                  Senior Partner
                </td>
                <td className="px-6 py-3 text-sm text-gray-700">2026-05-20</td>
                <td className="px-6 py-3 text-sm">
                  <span className="inline-flex items-center rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-800">
                    1
                  </span>
                </td>
                <td className="px-6 py-3 text-sm">
                  <button className="px-3 py-1 rounded-lg bg-purple-100 text-purple-700 text-xs font-semibold cursor-pointer hover:bg-purple-200 transition-all duration-200 hover:shadow-md hover:-translate-y-1 border-0 shadow-sm">
                    VIEW ON BOARD PLAN
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal for Add New Hire */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900/20 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-0 w-full max-w-[500px] overflow-hidden">
            <div className="flex items-center justify-between bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
              <h2 className="m-0 text-lg font-semibold text-white">
                Add New Hire
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="bg-none border-0 text-2xl cursor-pointer text-white/80 hover:text-white"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employee Name *
                </label>
                <input
                  type="text"
                  name="employeeName"
                  value={formData.employeeName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                  placeholder="Enter employee name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Designation *
                </label>
                <input
                  type="text"
                  name="designation"
                  value={formData.designation}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                  placeholder="Enter designation"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date Employed *
                </label>
                <input
                  type="date"
                  name="dateEmployed"
                  value={formData.dateEmployed}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Requirements Missing *
                </label>
                <input
                  type="number"
                  name="requirementsMissing"
                  value={formData.requirementsMissing}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                  placeholder="Enter number"
                  min="0"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-lg bg-purple-600 text-white font-semibold cursor-pointer hover:bg-purple-700 transition-colors border-0"
                >
                  Submit
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold cursor-pointer hover:bg-gray-300 transition-colors border-0"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pending Leave Approval Modal */}
      {activeModal === "pending-leave-approval" && (
        <div className="fixed inset-0 bg-gray-900/20 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-0 w-full max-w-[500px] overflow-hidden">
            <div className="flex items-center justify-between bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
              <h2 className="m-0 text-lg font-semibold text-white">
                Pending Leave Approvals
              </h2>
              <button
                onClick={() => setActiveModal(null)}
                className="bg-none border-0 text-2xl cursor-pointer text-white/80 hover:text-white"
              >
                ×
              </button>
            </div>
            <div className="py-8 text-center text-gray-500 px-6">
              <p className="m-0">Modal content will be added here</p>
            </div>
            <div className="flex gap-3 p-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="flex-1 px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold cursor-pointer hover:bg-gray-300 transition-colors border-0"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pending Resignation Approval Modal */}
      {activeModal === "pending-resignation-approval" && (
        <div className="fixed inset-0 bg-gray-900/20 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-0 w-full max-w-[500px] overflow-hidden">
            <div className="flex items-center justify-between bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
              <h2 className="m-0 text-lg font-semibold text-white">
                Pending Resignation Approval
              </h2>
              <button
                onClick={() => setActiveModal(null)}
                className="bg-none border-0 text-2xl cursor-pointer text-white/80 hover:text-white"
              >
                ×
              </button>
            </div>
            <div className="py-8 text-center text-gray-500 px-6">
              <p className="m-0">Modal content will be added here</p>
            </div>
            <div className="flex gap-3 p-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="flex-1 px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold cursor-pointer hover:bg-gray-300 transition-colors border-0"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* On Leave Modal */}
      {activeModal === "on-leave" && (
        <div className="fixed inset-0 bg-gray-900/20 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-0 w-full max-w-[500px] overflow-hidden">
            <div className="flex items-center justify-between bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
              <h2 className="m-0 text-lg font-semibold text-white">
                On Leave
              </h2>
              <button
                onClick={() => setActiveModal(null)}
                className="bg-none border-0 text-2xl cursor-pointer text-white/80 hover:text-white"
              >
                ×
              </button>
            </div>
            <div className="py-8 text-center text-gray-500 px-6">
              <p className="m-0">Modal content will be added here</p>
            </div>
            <div className="flex gap-3 p-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="flex-1 px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold cursor-pointer hover:bg-gray-300 transition-colors border-0"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Absent Modal */}
      {activeModal === "absent" && (
        <div className="fixed inset-0 bg-gray-900/20 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-0 w-full max-w-[500px] overflow-hidden">
            <div className="flex items-center justify-between bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
              <h2 className="m-0 text-lg font-semibold text-white">
                Absent
              </h2>
              <button
                onClick={() => setActiveModal(null)}
                className="bg-none border-0 text-2xl cursor-pointer text-white/80 hover:text-white"
              >
                ×
              </button>
            </div>
            <div className="py-8 text-center text-gray-500 px-6">
              <p className="m-0">Modal content will be added here</p>
            </div>
            <div className="flex gap-3 p-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="flex-1 px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold cursor-pointer hover:bg-gray-300 transition-colors border-0"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
