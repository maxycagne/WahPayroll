import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Toast from "../components/Toast";

import {
  dashboardSummary,
  employees,
} from "@/components/queries/hrDashboard/queryHrDashboard";
import { mutationHandler } from "@/features/leave/hooks/createMutationHandler";
import axiosInterceptor from "@/hooks/interceptor";
import {
  updateMutationDoc,
  updateLeaveMutationOptions,
  updateResignationMutationOptions,
} from "@/components/mutations/hrDashboard/mutationHrDashboard";

import UpdateDocsModal from "@/components/hrDashboard/UpdateDocsModal";
import {
  AbsentModal,
  OnLeaveModal,
  PendingLeaveModal,
  ResignationModal,
} from "@/components/hrDashboard/StatsModal";
import { HR_DASHBOARD_QUICK_ACCESS } from "@/assets/constantData";

const fmtCompactCurrency = (value) => {
  const number = Number(value || 0);
  return `₱${number.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
};

const DashboardLegend = () => (
  <Legend
    iconType="circle"
    iconSize={8}
    wrapperStyle={{
      fontSize: "11px",
      fontWeight: 600,
      color: "#475569",
      paddingTop: "8px",
    }}
  />
);

const AttendanceTooltip = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-lg border border-slate-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur-sm">
      <p className="m-0 text-[11px] font-bold uppercase tracking-wider text-slate-500">
        Day {label}
      </p>
      <div className="mt-1 space-y-0.5">
        {payload.map((entry) => (
          <p
            key={entry.dataKey}
            className="m-0 flex items-center justify-between gap-3 text-xs font-semibold"
            style={{ color: entry.color }}
          >
            <span>{entry.name}</span>
            <span>{Number(entry.value || 0)}</span>
          </p>
        ))}
      </div>
    </div>
  );
};

const PayrollTooltip = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-lg border border-slate-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur-sm">
      <p className="m-0 text-[11px] font-bold uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <div className="mt-1 space-y-0.5">
        {payload.map((entry) => (
          <p
            key={entry.dataKey}
            className="m-0 flex items-center justify-between gap-3 text-xs font-semibold"
            style={{ color: entry.color }}
          >
            <span>{entry.name}</span>
            <span>{fmtCompactCurrency(entry.value)}</span>
          </p>
        ))}
      </div>
    </div>
  );
};

export default function HRDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showDocsModal, setShowDocsModal] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [period] = useState(new Date().toISOString().slice(0, 7));
  const [year, month] = period.split("-").map(Number);

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
  const { data: payrollData = [] } = useQuery({
    queryKey: ["dashboard-payroll", period],
    queryFn: async () => {
      return mutationHandler(
        axiosInterceptor.get(`/api/employees/payroll?period=${period}`),
      );
    },
  });

  const { data: attendanceSummary = [] } = useQuery({
    queryKey: ["dashboard-attendance-summary", year, month],
    queryFn: async () => {
      return mutationHandler(
        axiosInterceptor.get(
          `/api/employees/attendance-summary?year=${year}&month=${month}`,
        ),
      );
    },
  });

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

  const updateLeaveMutation = useMutation({
    ...updateLeaveMutationOptions,
    onSuccess: () => {
      queryClient.invalidateQueries(["dashboardSummary"]);
      showToast("Leave request updated successfully!", "success");
    },
    onError: (error) =>
      showToast(error.message || "Error updating leave request", "error"),
  });

  const filteredEmployees = employeesData.filter((emp) => {
    if (emp.role === "Admin") return false;
    return `${emp.emp_id} ${emp.first_name} ${emp.last_name}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
  });

  const selectedEmployee = employeesData.find(
    // FORCE STRING COMPARISON
    (e) => String(e.emp_id) === String(docForm.emp_id),
  );

  useEffect(() => {
    if (docForm.emp_id && dashboardData?.information?.missingDocs) {
      const existing = dashboardData.information.missingDocs.find(
        // FORCE STRING COMPARISON
        (d) => String(d.emp_id) === String(docForm.emp_id),
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
    updateDocsMutation.mutate({
      emp_id: docForm.emp_id,
      missing_docs: docForm.missing_docs,
    });
  };

  if (isLoadingDashboard || isLoadingEmployees) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 font-semibold text-slate-700 shadow-sm">
        Loading HR Dashboard...
      </div>
    );
  }

  const quickActionTheme = {
    purple:
      "border-violet-200 bg-violet-50 hover:bg-violet-100 text-violet-800",
    green:
      "border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800",
    amber: "border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800",
  };

  const stats = dashboardData?.stats || [];
  const attendanceChartData = attendanceSummary
    .map((item) => ({
      day: String(item.formatted_date || item.date || "").slice(8, 10),
      Present: Number(item.present_count || 0),
      Absent: Number(item.absent_count || 0),
      Late: Number(item.late_count || 0),
    }))
    .sort((a, b) => Number(a.day) - Number(b.day));

  const payrollChartData = [...payrollData]
    .sort((a, b) => Number(b.net_pay || 0) - Number(a.net_pay || 0))
    .slice(0, 5)
    .map((row) => ({
      employee:
        employeesData.find((e) => String(e.emp_id) === String(row.emp_id))
          ?.first_name || `${row.emp_id}`,
      Net: Number(row.net_pay || 0),
      Gross: Number(row.gross_pay || 0),
    }));

  return (
    <div className="max-w-full space-y-4">
      {/* Toast Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <h1 className="m-0 text-[1.3rem] font-bold text-slate-900">
          HR Dashboard
        </h1>
        <p className="m-0 mt-0.5 text-xs text-slate-500">
          Workforce approvals, attendance signals, and document compliance in
          one view.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => (
          <button
            key={stat.label}
            type="button"
            onClick={() => setActiveModal(stat.modalKey)}
            className="group relative rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
            style={{ boxShadow: `inset 0 3px 0 0 ${stat.borderColor}` }}
          >
            <div className="p-3.5 text-left">
              <p className="m-0 mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                {stat.label}
              </p>
              <p
                className="m-0 text-2xl font-black"
                style={{ color: stat.borderColor }}
              >
                {stat.value}
              </p>
              <p className="m-0 mt-1 text-[10px] text-slate-400 transition-colors group-hover:text-slate-500">
                Click to view
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Quick Actions */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-bold text-slate-900">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {HR_DASHBOARD_QUICK_ACCESS.map(
            ({ icon, label, sub, path, color }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`group rounded-lg border p-3.5 text-left shadow-sm transition-colors cursor-pointer md:p-3 ${quickActionTheme[color] || "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800"}`}
              >
                <p className="mb-1 text-xl md:text-lg">{icon}</p>
                <p className="text-sm font-semibold text-slate-900 md:text-[13px]">
                  {label}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-600">{sub}</p>
                <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600">
                  Open
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </button>
            ),
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md">
          <h3 className="m-0 text-sm font-bold text-slate-900">
            Attendance Overview ({period})
          </h3>
          <p className="m-0 mt-1 text-[11px] text-slate-500">
            Daily present, absent, and late counts for the selected month.
          </p>
          <div className="mt-3 h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={attendanceChartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E2E8F0"
                />
                <XAxis dataKey="day" axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
                <Tooltip
                  content={<AttendanceTooltip />}
                  cursor={{ stroke: "#cbd5e1", strokeDasharray: "4 4" }}
                />
                <DashboardLegend />
                <Line
                  type="monotone"
                  dataKey="Present"
                  stroke="#0f766e"
                  strokeWidth={2.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="Absent"
                  stroke="#dc2626"
                  strokeWidth={2.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="Late"
                  stroke="#d97706"
                  strokeWidth={2.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md">
          <h3 className="m-0 text-sm font-bold text-slate-900">
            Payroll Snapshot ({period})
          </h3>
          <p className="m-0 mt-1 text-[11px] text-slate-500">
            Top employees by net pay for the selected payroll period.
          </p>
          <div className="mt-3 h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={payrollChartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E2E8F0"
                />
                <XAxis dataKey="employee" axisLine={false} tickLine={false} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₱${Math.round(v / 1000)}k`}
                />
                <Tooltip
                  content={<PayrollTooltip />}
                  cursor={{ fill: "rgba(148, 163, 184, 0.1)" }}
                />
                <DashboardLegend />
                <Bar dataKey="Gross" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Net" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

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
        mutation={updateLeaveMutation}
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
