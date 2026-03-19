import { useState } from "react";
import { URL } from "../assets/constant";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function Employees() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State for new employee
  const [formData, setFormData] = useState({
    emp_id: "",
    first_name: "",
    middle_initial: "",
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

  // --- TANSTACK QUERY: FETCH EMPLOYEES ---
  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const res = await fetch(`${URL}/api/employees`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "69420",
          "bypass-tunnel-reminder": "true",
        },
      });
      if (!res.ok) throw new Error("Network response was not ok");
      return res.json();
    },
  });

  // --- TANSTACK MUTATION: ADD EMPLOYEE ---
  const addEmployeeMutation = useMutation({
    mutationFn: async (newEmployee) => {
      const res = await fetch(`${URL}/api/employees`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "69420",
          "bypass-tunnel-reminder": "true",
        },
        body: JSON.stringify(newEmployee),
      });
      return res.json();
    },
    onSuccess: () => {
      // Refresh the list automatically
      queryClient.invalidateQueries(["employees"]);
      setIsModalOpen(false);
      resetForm();
      alert("Employee added successfully!");
    },
    onError: (error) => {
      console.error("Error adding employee:", error);
      alert("Server error while adding employee.");
    },
  });

  // --- TANSTACK MUTATION: DELETE EMPLOYEE ---
  const deleteEmployeeMutation = useMutation({
    mutationFn: async (emp_id) => {
      const res = await fetch(`${URL}/api/employees/${emp_id}`, {
        method: "DELETE",
        headers: {
          "ngrok-skip-browser-warning": "69420",
          "bypass-tunnel-reminder": "true",
        },
      });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["employees"]);
    },
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setFormData({
      emp_id: "",
      first_name: "",
      middle_initial: "",
      last_name: "",
      designation: "",
      position: "",
      status: "Permanent",
      email: "",
      dob: "",
      hired_date: "",
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    addEmployeeMutation.mutate(formData);
  };

  const handleDelete = (emp_id) => {
    if (window.confirm(`Are you sure you want to delete employee ${emp_id}?`)) {
      deleteEmployeeMutation.mutate(emp_id);
    }
  };

  const filtered = employees.filter((emp) => {
    const s = searchTerm.toLowerCase();
    const mi = emp.middle_initial ? `${emp.middle_initial} ` : "";
    const fullName = `${emp.first_name} ${mi}${emp.last_name}`.toLowerCase();
    return emp.emp_id.toLowerCase().includes(s) || fullName.includes(s);
  });

  if (isLoading)
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
                      disabled={deleteEmployeeMutation.isPending}
                      className="text-red-600 hover:text-red-800 font-semibold cursor-pointer border-0 bg-transparent disabled:opacity-50"
                    >
                      {deleteEmployeeMutation.variables === emp.emp_id
                        ? "Deleting..."
                        : "Delete"}
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
                {/* Inputs same as before */}
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700">
                    Employee ID
                  </label>
                  <input
                    required
                    name="emp_id"
                    value={formData.emp_id}
                    onChange={handleInputChange}
                    className="border border-gray-300 rounded p-2 text-sm"
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
                    className="border border-gray-300 rounded p-2 text-sm"
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
                    className="border border-gray-300 rounded p-2 text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700">
                    M.I.
                  </label>
                  <input
                    name="middle_initial"
                    value={formData.middle_initial}
                    onChange={handleInputChange}
                    className="border border-gray-300 rounded p-2 text-sm"
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
                    className="border border-gray-300 rounded p-2 text-sm"
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
                    className="border border-gray-300 rounded p-2 text-sm"
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
                    className="border border-gray-300 rounded p-2 text-sm"
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
                    className="border border-gray-300 rounded p-2 text-sm"
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
                    className="border border-gray-300 rounded p-2 text-sm"
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
                    className="border border-gray-300 rounded p-2 text-sm"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addEmployeeMutation.isPending}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {addEmployeeMutation.isPending
                    ? "Saving..."
                    : "Save Employee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
