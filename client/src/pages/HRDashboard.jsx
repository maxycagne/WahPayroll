import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Toast from "../components/Toast";

import {
  dashboardSummary,
  employees,
} from "@/components/queries/hrDashboard/queryHrDashboard";
import {
  updateMutationDoc,
  updateResignationMutationOptions,
} from "@/components/mutations/hrDashboard/mutationHrDashboard";

import MissingDocsTracker from "@/components/hrDashboard/MissingDocsTracker";
import UpdateDocsModal from "@/components/hrDashboard/UpdateDocsModal";
import StatCard from "@/components/hrDashboard/StatCard";
import {
  AbsentModal,
  OnLeaveModal,
  PendingLeaveModal,
  ResignationModal,
} from "@/components/hrDashboard/StatsModal";
import ResignationTable from "@/components/hrDashboard/ResignationTable";
import { HR_DASHBOARD_QUICK_ACCESS } from "@/assets/constantData";

export default function HRDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showDocsModal, setShowDocsModal] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

  // Toast notification state
  const [toast, setToast] = useState(null);

  // Form & Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [docForm, setDocForm] = useState({ emp_id: "", missing_docs: [] });
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };
  const { data: dashboardData, isLoading: isLoadingDashboard } =
    useQuery(dashboardSummary);
  const { data: employeesData = [], isLoading: isLoadingEmployees } =
    useQuery(employees);

  const updateDocsMutation = useMutation({
    ...updateMutationDoc,
    onSuccess: () => {
      queryClient.invalidateQueries(["dashboardSummary"]);
      showToast("Employee documents updated successfully!", "success");

      setDocForm({ emp_id: "", missing_docs: [] });
      setSearchQuery("");
      setShowDocsModal(false);
    },
    onError: (error) =>
      showToast(error.message || "Error updating documents", "error"),
  });

  const updateResignationMutation = useMutation({
    ...updateResignationMutationOptions,
    onSuccess: () => {
      queryClient.invalidateQueries(["dashboardSummary"]);
      showToast("Resignation status updated successfully!", "success");
    },
    onError: (error) =>
      showToast(error.message || "Error updating resignation", "error"),
  });

  const filteredEmployees = employeesData.filter((emp) => {
    if (emp.role === "Admin") return false;
    return `${emp.emp_id} ${emp.first_name} ${emp.last_name}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
  });

  const selectedEmployee = employeesData.find(
    (e) => e.emp_id === docForm.emp_id,
  );

  useEffect(() => {
    if (docForm.emp_id && dashboardData?.missingDocs) {
      const existing = dashboardData.missingDocs.find(
        (d) => d.emp_id === docForm.emp_id,
      );
      setDocForm((prev) => ({
        ...prev,
        missing_docs: existing?.missing_docs
          ? existing.missing_docs.split(", ")
          : [],
      }));
    }
  }, [docForm.emp_id, dashboardData]);

  const handleCheckboxChange = (docName) => {
    setDocForm((prev) => ({
      ...prev,
      missing_docs: prev.missing_docs.includes(docName)
        ? prev.missing_docs.filter((d) => d !== docName)
        : [...prev.missing_docs, docName],
    }));
  };

  const handleSubmitDocs = (e) => {
    e.preventDefault();
    if (!docForm.emp_id)
      return alert("Please select an employee from the list.");

    // Show confirmation modal instead of directly mutating
    setConfirmAction({
      type: "updateDocuments",
      emp_id: docForm.emp_id,
      missing_docs: docForm.missing_docs,
      employee_name: `${selectedEmployee.first_name} ${selectedEmployee.last_name}`,
    });
  };

  const handleConfirmAction = () => {
    if (!confirmAction) return;

    if (confirmAction.type === "resignation") {
      setConfirmAction(null);
      updateResignationMutation.mutate({
        id: confirmAction.id,
        status: confirmAction.status,
      });
    } else if (confirmAction.type === "updateDocuments") {
      setConfirmAction(null);
      setShowModal(false);
      updateDocsMutation.mutate({
        emp_id: confirmAction.emp_id,
        missing_docs: confirmAction.missing_docs,
      });
    } else {
      setConfirmAction(null);
    }
  };

  if (isLoadingDashboard || isLoadingEmployees) {
    return (
      <div className="p-6 text-gray-900 font-bold">Loading HR Dashboard...</div>
    );
  }

  return (
    <div className="max-w-full">
      {/* Toast Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      <h1 className="text-[1.4rem] font-bold text-gray-900 mb-6">
        HR Dashboard
      </h1>

      <StatCard stats={dashboardData.stats} onCardClick={setActiveModal} />

      {/* Quick Actions */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {HR_DASHBOARD_QUICK_ACCESS.map(
            ({ icon, label, sub, path, color }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`p-6 rounded-lg border-2 border-dashed border-${color}-300 bg-${color}-50 text-center hover:bg-${color}-100 transition-colors cursor-pointer`}
              >
                <p className="text-2xl mb-2">{icon}</p>
                <p className="font-semibold text-gray-900">{label}</p>
                <p className="text-xs text-gray-600 mt-1">{sub}</p>
              </button>
            ),
          )}
        </div>
      </section>

      <ResignationTable
        resignations={dashboardData?.information.resignations}
        mutation={updateResignationMutation}
      />

      <MissingDocsTracker
        missingDocs={dashboardData?.information.missingDocs}
        onOpenModal={() => {
          setDocForm({ emp_id: "", missing_docs: [] });
          setSearchQuery("");
          setShowDocsModal(true);
        }}
      />

      <UpdateDocsModal
        open={showDocsModal}
        onClose={() => setShowDocsModal(false)}
        docForm={docForm}
        setDocForm={setDocForm}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filteredEmployees={filteredEmployees}
        selectedEmployee={selectedEmployee}
        handleCheckboxChange={handleCheckboxChange}
        handleSubmitDocs={handleSubmitDocs}
        mutation={updateDocsMutation}
      />

      <PendingLeaveModal
        open={activeModal === "pending-leave-approval"}
        onClose={() => setActiveModal(null)}
        pendingLeaves={dashboardData?.information.pendingLeaves}
      />
      <OnLeaveModal
        open={activeModal === "on-leave"}
        onClose={() => setActiveModal(null)}
        onLeave={dashboardData?.information.onLeave}
      />
      <AbsentModal
        open={activeModal === "absent"}
        onClose={() => setActiveModal(null)}
        absents={dashboardData?.information.absents}
      />
      <ResignationModal
        open={activeModal === "pending-resignation-approval"}
        onClose={() => setActiveModal(null)}
        resignations={dashboardData?.information.resignations}
        mutation={updateResignationMutation}
      />
    </div>
  );
}
