import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";

// --- MASTER LIST OF ONBOARDING DOCUMENTS ---
const STANDARD_DOCUMENTS = [
  "Resume / CV",
  "NBI Clearance",
  "Medical Certificate",
  "SSS E-1 Form / ID",
  "PhilHealth ID / MDR",
  "Pag-IBIG MID No.",
  "TIN / BIR Form 1902",
  "Transcript of Records (TOR)",
  "Diploma",
  "Birth Certificate (PSA)",
  "Marriage Certificate",
  "Certificate of Employment (COE)",
];

export default function HRDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [activeModal, setActiveModal] = useState(null);

  // Form & Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [docForm, setDocForm] = useState({
    emp_id: "",
    missing_docs: [], // <-- Now an array to hold selected checkboxes!
  });

  // --- FETCH DASHBOARD DATA ---
  const { data: dashboardData, isLoading: isLoadingDashboard } = useQuery({
    queryKey: ["dashboardSummary"],
    queryFn: async () => {
      const res = await apiFetch("/api/employees/dashboard-summary");
      if (!res.ok) throw new Error("Failed to fetch dashboard data");
      return res.json();
    },
  });

  // --- FETCH ALL EMPLOYEES (For the list) ---
  const { data: employeesData = [], isLoading: isLoadingEmployees } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const res = await apiFetch("/api/employees");
      if (!res.ok) throw new Error("Failed to fetch employees");
      return res.json();
    },
  });

  // --- MUTATION FOR SAVING MISSING DOCS ---
  const updateDocsMutation = useMutation({
    mutationFn: async (data) => {
      const res = await apiFetch("/api/employees/missing-docs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Join the array into a comma-separated string before sending to DB
        body: JSON.stringify({
          emp_id: data.emp_id,
          missing_docs: data.missing_docs.join(", "),
        }),
      });
      if (!res.ok) throw new Error("Failed to update documents");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["dashboardSummary"]);
      alert("Employee documents updated successfully!");
      setDocForm({ emp_id: "", missing_docs: [] });
      setSearchQuery("");
      setShowModal(false);
    },
    onError: () => alert("Error updating documents"),
  });

  // --- MUTATION FOR APPROVING/DENYING RESIGNATIONS ---
  const updateResignationMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const res = await apiFetch(`/api/employees/resignations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update resignation status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["dashboardSummary"]);
      alert("Resignation status updated successfully!");
    },
    onError: () => alert("Error updating resignation"),
  });

  // --- FILTER & SEARCH EMPLOYEES LOGIC ---
  const filteredEmployees = employeesData.filter((emp) => {
    // Hide Admins
    if (emp.role === "Admin") return false;

    // Apply Search Query
    const searchString =
      `${emp.emp_id} ${emp.first_name} ${emp.last_name}`.toLowerCase();
    return searchString.includes(searchQuery.toLowerCase());
  });

  // Find the currently selected employee to display their name nicely
  const selectedEmployee = employeesData.find(
    (e) => e.emp_id === docForm.emp_id,
  );

  const stats = [
    {
      label: "Pending Leave Approval",
      value: dashboardData?.pendingLeaves?.length || 0,
      borderColor: "#d4a017",
      modalKey: "pending-leave-approval",
    },
    {
      label: "Pending Resignation Approval",
      value: dashboardData?.resignations?.length || 0,
      borderColor: "#1a8f3c",
      modalKey: "pending-resignation-approval",
    },
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

  // Auto-fill the checkboxes if the selected employee already has missing docs saved
  useEffect(() => {
    if (docForm.emp_id && dashboardData?.missingDocs) {
      const existing = dashboardData.missingDocs.find(
        (d) => d.emp_id === docForm.emp_id,
      );
      setDocForm((prev) => ({
        ...prev,
        // Convert the comma-separated string back into an array!
        missing_docs:
          existing && existing.missing_docs
            ? existing.missing_docs.split(", ")
            : [],
      }));
    }
  }, [docForm.emp_id, dashboardData]);

  // Handle checking/unchecking a document
  const handleCheckboxChange = (docName) => {
    setDocForm((prev) => {
      const isSelected = prev.missing_docs.includes(docName);
      if (isSelected) {
        // Remove it
        return {
          ...prev,
          missing_docs: prev.missing_docs.filter((d) => d !== docName),
        };
      } else {
        // Add it
        return { ...prev, missing_docs: [...prev.missing_docs, docName] };
      }
    });
  };

  const handleSubmitDocs = (e) => {
    e.preventDefault();
    if (!docForm.emp_id)
      return alert("Please select an employee from the list.");
    updateDocsMutation.mutate(docForm);
  };

  if (isLoadingDashboard || isLoadingEmployees) {
    return (
      <div className="p-6 text-gray-900 font-bold">Loading HR Dashboard...</div>
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
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {!dashboardData?.resignations ||
              dashboardData.resignations.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-6 text-center text-gray-500 font-medium"
                  >
                    No pending resignations.
                  </td>
                </tr>
              ) : (
                dashboardData.resignations.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="px-6 py-3 text-sm text-gray-900">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-700">
                      <div className="font-semibold text-gray-900">
                        {r.first_name} {r.last_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        ID: {r.emp_id}
                      </div>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-700">
                      <div>{r.resignation_type}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        Effective:{" "}
                        {new Date(r.effective_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-3 text-sm">
                      <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800">
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm">
                      {r.status === "Pending Approval" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              updateResignationMutation.mutate({
                                id: r.id,
                                status: "Approved",
                              })
                            }
                            disabled={updateResignationMutation.isPending}
                            className="px-3 py-1 rounded-md bg-green-100 text-green-700 text-xs font-bold cursor-pointer hover:bg-green-200 border-0 disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() =>
                              updateResignationMutation.mutate({
                                id: r.id,
                                status: "Denied",
                              })
                            }
                            disabled={updateResignationMutation.isPending}
                            className="px-3 py-1 rounded-md bg-red-100 text-red-700 text-xs font-bold cursor-pointer hover:bg-red-200 border-0 disabled:opacity-50"
                          >
                            Deny
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Missing Documents Tracker */}
      <section className="rounded-lg border border-gray-200 bg-white shadow-sm mb-8">
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h3 className="m-0 text-lg font-semibold text-gray-900">
            Missing Requirements Tracker
          </h3>
          <button
            onClick={() => {
              setDocForm({ emp_id: "", missing_docs: [] });
              setSearchQuery("");
              setShowModal(true);
            }}
            className="px-4 py-2 rounded-lg bg-purple-600 text-white text-xs font-semibold cursor-pointer hover:bg-purple-700 transition-all duration-200 hover:shadow-md border-0 shadow-sm"
          >
            Update Documents
          </button>
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
                  Date Hired
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-1/3">
                  Missing Documents
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Last Updated
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {!dashboardData?.missingDocs ||
              dashboardData.missingDocs.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-6 text-center text-gray-500 font-medium"
                  >
                    All employees have submitted their complete requirements! 🎉
                  </td>
                </tr>
              ) : (
                dashboardData.missingDocs.map((doc) => (
                  <tr
                    key={doc.emp_id}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="px-6 py-3 text-sm font-bold text-gray-900">
                      {doc.first_name} {doc.last_name}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-700">
                      {doc.designation || "N/A"}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-700">
                      {doc.hired_date
                        ? new Date(doc.hired_date).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td className="px-6 py-3 text-sm text-red-600 font-medium">
                      {/* Render comma separated strings nicely with line breaks if multiple */}
                      <ul className="list-disc pl-4 m-0 space-y-0.5">
                        {doc.missing_docs.split(", ").map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-6 py-3 text-xs text-gray-500">
                      {new Date(doc.updated_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* --- MODAL: UPDATE MISSING DOCUMENTS WITH SEARCH --- */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900/40 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-0 w-full max-w-[600px] overflow-hidden">
            <div className="flex items-center justify-between bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
              <h2 className="m-0 text-lg font-semibold text-white">
                Update Employee Documents
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="bg-transparent border-0 text-2xl cursor-pointer text-white/80 hover:text-white"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmitDocs} className="p-6 space-y-4">
              {/* SEARCHABLE EMPLOYEE LIST */}
              <div className="flex flex-col">
                <label className="block text-sm font-semibold text-gray-700 mb-1 flex justify-between">
                  <span>Select Employee *</span>
                  {selectedEmployee && (
                    <span className="text-purple-600 font-bold text-xs">
                      Selected: {selectedEmployee.first_name}{" "}
                      {selectedEmployee.last_name}
                    </span>
                  )}
                </label>

                {/* Search Input */}
                <input
                  type="text"
                  placeholder="🔍 Search by name or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-t-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white border-b-0 text-sm"
                />

                {/* Scrollable Employee List Container */}
                <div className="max-h-36 overflow-y-auto border border-gray-300 rounded-b-lg bg-gray-50">
                  {filteredEmployees.length === 0 ? (
                    <div className="p-3 text-sm text-gray-500 text-center">
                      No employees found.
                    </div>
                  ) : (
                    filteredEmployees.map((emp) => (
                      <div
                        key={emp.emp_id}
                        onClick={() =>
                          setDocForm({ ...docForm, emp_id: emp.emp_id })
                        }
                        className={`px-4 py-2.5 text-sm cursor-pointer border-b border-gray-100 transition-colors last:border-b-0 ${
                          docForm.emp_id === emp.emp_id
                            ? "bg-purple-100 text-purple-800 font-bold border-l-4 border-l-purple-600"
                            : "hover:bg-gray-100 text-gray-700 border-l-4 border-l-transparent"
                        }`}
                      >
                        <span className="text-gray-500 font-mono text-xs mr-2">
                          {emp.emp_id}
                        </span>
                        {emp.first_name} {emp.last_name}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* CHECKBOX GRID FOR DOCUMENTS */}
              <div>
                <div className="flex justify-between items-end mb-2 mt-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Missing Documents
                  </label>
                  <span className="text-xs text-gray-500">
                    Select all that apply
                  </span>
                </div>

                <div
                  className={`grid grid-cols-2 gap-3 p-4 border rounded-lg ${!docForm.emp_id ? "bg-gray-100 border-gray-200 cursor-not-allowed opacity-60" : "border-gray-300 bg-white"}`}
                >
                  {STANDARD_DOCUMENTS.map((docName) => {
                    const isChecked = docForm.missing_docs.includes(docName);
                    return (
                      <label
                        key={docName}
                        className={`flex items-center gap-2 text-sm cursor-pointer select-none p-1 rounded transition-colors ${isChecked ? "text-purple-700 font-semibold" : "text-gray-700 hover:bg-gray-50"}`}
                      >
                        <input
                          type="checkbox"
                          disabled={!docForm.emp_id}
                          checked={isChecked}
                          onChange={() => handleCheckboxChange(docName)}
                          className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 cursor-pointer disabled:cursor-not-allowed"
                        />
                        {docName}
                      </label>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Uncheck all boxes to clear the employee from the missing
                  documents tracker.
                </p>
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
                  disabled={updateDocsMutation.isPending || !docForm.emp_id}
                  className="flex-1 px-4 py-2 rounded-lg bg-purple-600 text-white font-semibold cursor-pointer hover:bg-purple-700 transition-colors border-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updateDocsMutation.isPending ? "Saving..." : "Save Updates"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- DYNAMIC STAT CARD MODALS --- */}

      {/* Pending Leave Approval Modal */}
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

      {/* Resignation Modal */}
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
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {!dashboardData?.resignations ||
              dashboardData.resignations.length === 0 ? (
                <p className="text-center text-gray-500 font-medium">
                  No pending resignations.
                </p>
              ) : (
                <div className="space-y-3">
                  {dashboardData.resignations.map((r, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col p-4 border border-gray-200 rounded-lg bg-gray-50 gap-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="m-0 font-bold text-gray-900 text-sm">
                            {r.first_name} {r.last_name}
                          </p>
                          <p className="m-0 text-xs text-gray-500 mt-0.5">
                            {r.resignation_type}
                          </p>
                        </div>
                        <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-bold text-yellow-800">
                          {r.status}
                        </span>
                      </div>

                      {/* Approve/Deny buttons in Modal */}
                      {r.status === "Pending Approval" && (
                        <div className="flex gap-2 pt-3 border-t border-gray-200 mt-1">
                          <button
                            onClick={() =>
                              updateResignationMutation.mutate({
                                id: r.id,
                                status: "Approved",
                              })
                            }
                            disabled={updateResignationMutation.isPending}
                            className="flex-1 px-3 py-1.5 rounded-md bg-green-100 text-green-700 text-xs font-bold cursor-pointer hover:bg-green-200 border-0 disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() =>
                              updateResignationMutation.mutate({
                                id: r.id,
                                status: "Denied",
                              })
                            }
                            disabled={updateResignationMutation.isPending}
                            className="flex-1 px-3 py-1.5 rounded-md bg-red-100 text-red-700 text-xs font-bold cursor-pointer hover:bg-red-200 border-0 disabled:opacity-50"
                          >
                            Deny
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
