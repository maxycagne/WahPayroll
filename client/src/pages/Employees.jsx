import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";

const designationMap = {
  Operations: [
    "Supervisor(Finance & Operations)",
    "Assistant Finance & Operations Partner",
    "Admin & Human Resources Partner",
  ],
  "Health Program Partners": [
    "Supervisor(Health Program Partner)",
    "Health Program Partner",
    "Profiler",
  ],
  "Platform Innovation": [
    "Supervisor(Platform Innovation)",
    "Senior Platform Innovation Partner",
    "Platform Innovation Partner",
    "Data Analyst",
    "Business Analyst/Quality Assurance",
  ],
  "Network & System": [
    "Supervisor(Network & Systems)",
    "Network & Systems Partner",
  ],
};

export default function Employees() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterDesignation, setFilterDesignation] = useState("All");
  const [activeMenu, setActiveMenu] = useState(null); // For Ellipsis

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editEmployee, setEditEmployee] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

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

  // --- QUERIES ---
  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const res = await apiFetch("/api/employees");
      return res.json();
    },
  });

  // --- MUTATIONS ---
  const addMutation = useMutation({
    mutationFn: (newData) => {
      // Auto Password Logic: ID + FirstName (No spaces)
      const autoPassword = `${newData.emp_id}${newData.first_name.replace(/\s+/g, "")}`;
      return apiFetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newData, password: autoPassword }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["employees"]);
      setIsAddModalOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (updatedData) => {
      const res = await apiFetch(`/api/employees/${updatedData.emp_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to update employee");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["employees"]);
      setEditEmployee(null);
    },
    onError: (error) => {
      alert(error.message || "Update failed");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiFetch(`/api/employees/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries(["employees"]);
      setDeleteConfirm(null);
    },
  });

  // --- HANDLERS ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "middle_initial") {
      setFormData({
        ...formData,
        middle_initial: value.slice(0, 1).toUpperCase(),
      });
      return;
    }

    if (name === "designation") {
      setFormData({ ...formData, designation: value, position: "" });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const resetForm = () =>
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

  const filteredEmployees = employees.filter((emp) => {
    const fullName =
      `${emp.first_name} ${emp.last_name} ${emp.emp_id}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "All" || emp.status === filterStatus;
    const matchesDesignation =
      filterDesignation === "All" || emp.designation === filterDesignation;
    return matchesSearch && matchesStatus && matchesDesignation;
  });

  if (isLoading)
    return <div className="p-6 font-bold">Loading Employees...</div>;

  return (
    <div className="max-w-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Employee Management
        </h1>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
        >
          + Add Employee
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <input
          type="text"
          placeholder="Search ID or Name..."
          className="flex-1 min-w-[200px] border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-purple-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-purple-500"
          value={filterDesignation}
          onChange={(e) => setFilterDesignation(e.target.value)}
        >
          <option value="All">All Designations</option>
          {Object.keys(designationMap).map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <select
          className="border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-purple-500"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="All">All Status</option>
          <option value="Permanent">Permanent</option>
          <option value="Job Order">Job Order</option>
          <option value="Casual">Casual</option>
          <option value="PGT Employee">PGT Employee</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-visible">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 font-bold text-gray-700">ID</th>
              <th className="px-6 py-3 font-bold text-gray-700">Full Name</th>
              <th className="px-6 py-3 font-bold text-gray-700">
                Designation / Position
              </th>
              <th className="px-6 py-3 font-bold text-gray-700">
                Email Address
              </th>
              <th className="px-6 py-3 font-bold text-gray-700">Status</th>
              <th className="px-6 py-3 font-bold text-gray-700 text-center w-20">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredEmployees.map((emp) => (
              <tr
                key={emp.emp_id}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4 font-medium">{emp.emp_id}</td>
                <td className="px-6 py-4 font-semibold text-gray-800">
                  {emp.last_name}, {emp.first_name}{" "}
                  {emp.middle_initial ? `${emp.middle_initial}.` : ""}
                </td>
                <td className="px-6 py-4 text-gray-600">
                  <div className="font-medium text-gray-900">
                    {emp.designation}
                  </div>
                  <div className="text-xs opacity-75">{emp.position}</div>
                </td>
                <td className="px-6 py-4 text-gray-600">{emp.email}</td>
                <td className="px-6 py-4">
                  <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
                    {emp.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-center relative">
                  <button
                    onClick={() =>
                      setActiveMenu(
                        activeMenu === emp.emp_id ? null : emp.emp_id,
                      )
                    }
                    className="p-1 rounded-full hover:bg-gray-200 transition-colors border-0 bg-transparent cursor-pointer text-gray-500"
                  >
                    <svg
                      width="20"
                      height="20"
                      fill="currentColor"
                      viewBox="0 0 16 16"
                    >
                      <path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z" />
                    </svg>
                  </button>

                  {/* Action Menu Dropdown */}
                  {activeMenu === emp.emp_id && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setActiveMenu(null)}
                      ></div>
                      <div className="absolute right-12 top-4 z-20 w-40 bg-white border border-gray-200 rounded-lg shadow-xl py-1 animate-in fade-in zoom-in duration-100">
                        <button
                          onClick={() => {
                            setEditEmployee(emp);
                            setActiveMenu(null);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 border-0 bg-transparent cursor-pointer font-medium"
                        >
                          Edit Info
                        </button>
                        <button
                          onClick={() => {
                            /* Handle Reset Logic */ setActiveMenu(null);
                            alert(
                              "Password reset to: " +
                                emp.emp_id +
                                emp.first_name.replace(/\s+/g, ""),
                            );
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 border-0 bg-transparent cursor-pointer font-medium"
                        >
                          Reset Password
                        </button>
                        <hr className="my-1 border-gray-100" />
                        <button
                          onClick={() => {
                            setDeleteConfirm(emp);
                            setActiveMenu(null);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 border-0 bg-transparent cursor-pointer font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modals same as before but updated with logic */}
      {isAddModalOpen && (
        <EmployeeModal
          title="Add New Employee"
          data={formData}
          onChange={handleInputChange}
          onClose={() => {
            setIsAddModalOpen(false);
            resetForm();
          }}
          onSubmit={(e) => {
            e.preventDefault();
            addMutation.mutate(formData);
          }}
          isPending={addMutation.isPending}
        />
      )}

      {editEmployee && (
        <EmployeeModal
          title="Edit Employee Information"
          data={editEmployee}
          isEdit={true}
          onChange={(e) => {
            const { name, value } = e.target;
            if (name === "middle_initial") {
              setEditEmployee({
                ...editEmployee,
                middle_initial: value.slice(0, 1).toUpperCase(),
              });
              return;
            }

            if (name === "designation") {
              setEditEmployee({
                ...editEmployee,
                designation: value,
                position: "",
              });
              return;
            }

            setEditEmployee({
              ...editEmployee,
              [name]: value,
            });
          }}
          onClose={() => setEditEmployee(null)}
          onSubmit={(e) => {
            e.preventDefault();
            updateMutation.mutate(editEmployee);
          }}
          isPending={updateMutation.isPending}
        />
      )}

      {/* Delete Confirmation remains unchanged */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full text-center shadow-2xl">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
              ⚠️
            </div>
            <h2 className="text-xl font-bold mb-2">Are you sure?</h2>
            <p className="text-gray-600 mb-6">
              You are about to delete{" "}
              <b>
                {deleteConfirm.first_name} {deleteConfirm.last_name}
              </b>
              .
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2 border border-gray-300 rounded-lg font-semibold text-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteConfirm.emp_id)}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmployeeModal({
  title,
  data,
  onChange,
  onClose,
  onSubmit,
  isPending,
  isEdit = false,
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-gray-900 px-6 py-4 flex justify-between items-center text-white">
          <h2 className="text-lg font-bold m-0">{title}</h2>
          <button
            onClick={onClose}
            className="text-white text-2xl bg-transparent border-0 cursor-pointer"
          >
            &times;
          </button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-500 uppercase">
                Employee ID
              </label>
              <input
                name="emp_id"
                value={data.emp_id}
                onChange={onChange}
                disabled={isEdit}
                required
                className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 outline-none disabled:bg-gray-100"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-500 uppercase">
                Email Address
              </label>
              <input
                name="email"
                type="email"
                value={data.email}
                onChange={onChange}
                required
                className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>

            <div className="flex flex-col gap-1 col-span-2">
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1 flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    First Name
                  </label>
                  <input
                    name="first_name"
                    value={data.first_name}
                    onChange={onChange}
                    required
                    className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
                <div className="col-span-1 flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    M.I.
                  </label>
                  <input
                    name="middle_initial"
                    value={data.middle_initial || ""}
                    onChange={onChange}
                    maxLength="1"
                    className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
                <div className="col-span-1 flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    Last Name
                  </label>
                  <input
                    name="last_name"
                    value={data.last_name}
                    onChange={onChange}
                    required
                    className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-500 uppercase">
                Designation
              </label>
              <select
                name="designation"
                value={data.designation}
                onChange={onChange}
                required
                className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 outline-none"
              >
                <option value="">Select Designation</option>
                {Object.keys(designationMap).map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-500 uppercase">
                Position
              </label>
              <select
                name="position"
                value={data.position}
                onChange={onChange}
                required
                disabled={!data.designation}
                className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 outline-none disabled:bg-gray-50"
              >
                <option value="">Select Position</option>
                {data.designation &&
                  designationMap[data.designation].map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-500 uppercase">
                Emp. Status
              </label>
              <select
                name="status"
                value={data.status}
                onChange={onChange}
                className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 outline-none"
              >
                <option>Permanent</option>
                <option>Job Order</option>
                <option>Casual</option>
                <option>PGT Employee</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-500 uppercase">
                Hired Date
              </label>
              <input
                name="hired_date"
                type="date"
                value={data.hired_date?.split("T")[0]}
                onChange={onChange}
                required
                className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
          </div>

          {!isEdit && (
            <div className="mt-4 p-3 bg-purple-50 border border-purple-100 rounded-lg">
              <p className="m-0 text-xs text-purple-700 font-semibold">
                Auto-generated Password:{" "}
                <span className="font-mono bg-white px-2 py-0.5 rounded border border-purple-200">
                  {data.emp_id}
                  {data.first_name.replace(/\s+/g, "") || "[FirstName]"}
                </span>
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg font-semibold text-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-8 py-2 bg-purple-600 text-white rounded-lg font-semibold"
            >
              {isPending
                ? "Processing..."
                : isEdit
                  ? "Update Employee"
                  : "Save Employee"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
