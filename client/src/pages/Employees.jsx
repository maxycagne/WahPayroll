import { useState, useEffect } from "react";

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State for new employee
  const [formData, setFormData] = useState({
    emp_id: "",
    first_name: "",
    middle_initial: "", // <-- Added Middle Initial
    last_name: "",
    designation: "",
    position: "",
    status: "Permanent",
    email: "",
    dob: "",
    hired_date: "",
  });

  const statusClasses = {
    Permanent: "bg-green-100 text-green-800",
    Casual: "bg-blue-100 text-blue-800",
    "Job Order": "bg-purple-100 text-purple-800",
    "PGT Employee": "bg-orange-100 text-orange-800",
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/employees");
      const data = await res.json();

      if (Array.isArray(data)) {
        setEmployees(data);
      } else {
        setEmployees([]);
      }
      setLoading(false);
    } catch (err) {
      console.error("Error fetching employees:", err);
      setEmployees([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5000/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setIsModalOpen(false);
        fetchEmployees(); // Refresh the table
        setFormData({
          emp_id: "",
          first_name: "",
          middle_initial: "", // Reset field
          last_name: "",
          designation: "",
          position: "",
          status: "Permanent",
          email: "",
          dob: "",
          hired_date: "",
        });
        alert("Employee added successfully!");
      } else {
        alert(`Failed to add employee: ${data.message}`);
      }
    } catch (error) {
      console.error("Error adding employee:", error);
      alert("Server error while adding employee.");
    }
  };

  const handleDelete = async (emp_id) => {
    if (window.confirm(`Are you sure you want to delete employee ${emp_id}?`)) {
      try {
        const res = await fetch(
          `http://localhost:5000/api/employees/${emp_id}`,
          {
            method: "DELETE",
          },
        );
        if (res.ok) {
          fetchEmployees(); // Refresh after deleting
        } else {
          alert("Failed to delete employee");
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const filtered = employees.filter((emp) => {
    const s = searchTerm.toLowerCase();
    // Include middle initial in search if it exists
    const mi = emp.middle_initial ? `${emp.middle_initial} ` : "";
    const fullName = `${emp.first_name} ${mi}${emp.last_name}`.toLowerCase();
    return emp.emp_id.toLowerCase().includes(s) || fullName.includes(s);
  });

  if (loading)
    return <div className="p-6 text-black font-bold">Loading Employees...</div>;

  return (
    <div className="max-w-full">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <h1 className="m-0 text-[1.4rem] font-bold text-gray-900">
          Employee Management
        </h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 rounded-lg border-0 text-white text-sm font-semibold cursor-pointer bg-gradient-to-r from-purple-600 to-purple-800 shadow-md hover:opacity-90 transition-opacity"
        >
          + Add New Employee
        </button>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <input
            type="text"
            placeholder="Search by ID or Name..."
            className="w-full max-w-md border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Designation
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map((emp) => (
                <tr
                  key={emp.emp_id}
                  className="hover:bg-gray-50 transition-colors duration-150"
                >
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {emp.emp_id}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-700">
                    {emp.first_name}{" "}
                    {emp.middle_initial ? `${emp.middle_initial}. ` : ""}
                    {emp.last_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {emp.designation}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClasses[emp.status] || "bg-gray-100 text-gray-800"}`}
                    >
                      {emp.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {emp.email}
                  </td>
                  <td className="px-6 py-4 text-sm text-right">
                    <button
                      onClick={() => handleDelete(emp.emp_id)}
                      className="text-red-600 hover:text-red-800 font-semibold cursor-pointer border-0 bg-transparent"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-purple-800 px-6 py-4 flex justify-between items-center">
              <h2 className="text-white text-lg font-bold m-0">
                Add New Employee
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white hover:text-gray-200 text-2xl leading-none border-0 bg-transparent cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700">
                    Employee ID
                  </label>
                  <input
                    required
                    name="emp_id"
                    value={formData.emp_id}
                    onChange={handleInputChange}
                    className="border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                    placeholder="WAH-00X"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700">
                    Email Address
                  </label>
                  <input
                    required
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                    placeholder="name@wah.org"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700">
                    First Name
                  </label>
                  <input
                    required
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className="border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700">
                    M.I. (Optional)
                  </label>
                  <input
                    name="middle_initial"
                    value={formData.middle_initial}
                    onChange={handleInputChange}
                    className="border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                    placeholder="e.g. A"
                    maxLength="5"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700">
                    Last Name
                  </label>
                  <input
                    required
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className="border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700">
                    Designation
                  </label>
                  <input
                    required
                    name="designation"
                    value={formData.designation}
                    onChange={handleInputChange}
                    className="border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                    placeholder="e.g. Manager"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700">
                    Position
                  </label>
                  <input
                    required
                    name="position"
                    value={formData.position}
                    onChange={handleInputChange}
                    className="border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                    placeholder="e.g. IT Department"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                  >
                    <option>Permanent</option>
                    <option>Casual</option>
                    <option>Job Order</option>
                    <option>PGT Employee</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleInputChange}
                    className="border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700">
                    Hired Date
                  </label>
                  <input
                    type="date"
                    name="hired_date"
                    value={formData.hired_date}
                    onChange={handleInputChange}
                    className="border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium cursor-pointer border-0"
                >
                  Save Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
