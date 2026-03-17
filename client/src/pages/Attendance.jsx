import { useState, useEffect } from "react";

const badgeClass = {
  Present: "bg-green-100 text-green-800",
  Absent: "bg-red-100 text-red-800",
  "On Leave": "bg-yellow-100 text-yellow-800",
  "Half-Day": "bg-orange-100 text-orange-800",
};

export default function Attendance() {
  const [search, setSearch] = useState("");
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State for Admin Adjustment
  const [adjModal, setAdjModal] = useState(null);
  const [adjType, setAdjType] = useState("Subtract");
  const [adjDays, setAdjDays] = useState("");

  const fetchAttendance = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/employees/attendance");
      const data = await res.json();
      if (Array.isArray(data)) {
        setAttendance(data);
      } else {
        setAttendance([]);
      }
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch attendance:", err);
      setAttendance([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  // Handle Admin Balance Adjustment Submission
  const handleAdjustSubmit = async (e) => {
    e.preventDefault();

    // If Subtracting, turn the number into a negative value
    const amount =
      adjType === "Subtract" ? -Math.abs(adjDays) : Math.abs(adjDays);

    try {
      const res = await fetch(
        `http://localhost:5000/api/employees/leave-balance/${adjModal.emp_id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ adjustment: amount }),
        },
      );

      if (res.ok) {
        alert(`Leave balance updated successfully!`);
        setAdjModal(null);
        setAdjDays("");
        fetchAttendance(); // Refresh table to show new 27/27 balance
      } else {
        alert("Failed to adjust leave balance.");
      }
    } catch (error) {
      console.error("Error adjusting balance:", error);
    }
  };

  const getLeaveHighlightColor = (remaining) => {
    if (remaining <= 0) return "bg-red-100 text-red-800";
    if (remaining <= 3) return "bg-orange-100 text-orange-800";
    return "bg-blue-100 text-blue-800";
  };

  const filtered = attendance.filter((a) => {
    const fullName = `${a.first_name} ${a.last_name}`.toLowerCase();
    const query = search.toLowerCase();
    return (
      fullName.includes(query) ||
      (a.emp_id && a.emp_id.toLowerCase().includes(query))
    );
  });

  if (loading) {
    return (
      <div className="p-6 text-gray-900 font-bold">
        Loading Attendance Management...
      </div>
    );
  }

  return (
    <div className="max-w-full">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <h1 className="m-0 text-[1.4rem] font-bold text-gray-900">
          Attendance Management
        </h1>
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
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Employee ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Total Absences
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Leave Balance
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Today's Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Admin Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No attendance records found.
                  </td>
                </tr>
              ) : (
                filtered.map((a) => {
                  // Determine maximum allocation based on employment status
                  const maxAllocation =
                    a.emp_status === "Job Order" || a.emp_status === "Casual"
                      ? 12
                      : 27;

                  return (
                    <tr
                      key={a.emp_id}
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {a.emp_id}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-700">
                        {a.first_name} {a.last_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 text-center">
                        {a.total_absences || 0}
                      </td>
                      <td className="px-6 py-4 text-sm text-center">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${getLeaveHighlightColor(a.leave_balance)}`}
                        >
                          {Number(a.leave_balance)} / {maxAllocation}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${badgeClass[a.status] || "bg-gray-100 text-gray-800"}`}
                        >
                          {a.status || "No Data"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-right">
                        <button
                          onClick={() => setAdjModal(a)}
                          className="px-3 py-1.5 rounded-md bg-purple-100 text-purple-700 text-xs font-bold hover:bg-purple-200 border-0 cursor-pointer transition-colors"
                        >
                          Adjust Balance
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Adjustment Modal */}
      {adjModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-purple-800 px-6 py-4 flex justify-between items-center">
              <h2 className="text-white text-lg font-bold m-0">
                Adjust Leave Balance
              </h2>
              <button
                onClick={() => setAdjModal(null)}
                className="text-white hover:text-gray-200 text-2xl leading-none border-0 bg-transparent cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="p-6">
              <p className="m-0 mb-5 text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-200">
                Employee:{" "}
                <strong className="text-gray-900">
                  {adjModal.first_name} {adjModal.last_name}
                </strong>
                <br />
                Current Balance:{" "}
                <strong className="text-purple-700">
                  {adjModal.leave_balance}
                </strong>
              </p>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Action
                  </label>
                  <select
                    value={adjType}
                    onChange={(e) => setAdjType(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="Subtract">Subtract Days (Minus)</option>
                    <option value="Add">Add Days (Plus)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Number of Days
                  </label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    required
                    value={adjDays}
                    onChange={(e) => setAdjDays(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g. 1 or 0.5"
                  />
                </div>
              </div>

              <div className="mt-7 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setAdjModal(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-semibold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:opacity-90 text-sm font-semibold cursor-pointer border-0 transition-opacity"
                >
                  Save Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
