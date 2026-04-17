import React from "react";
import { useNavigate } from "react-router-dom";
import EmployeeAttendanceCard from "../components/employee/EmployeeAttendanceCard";
import EmployeeMissingDocsAlert from "../components/employee/EmployeeMissingDocsAlert";
import EmployeePendingRequestsCard from "../components/employee/EmployeePendingRequestsCard";
import EmployeeSummaryCards from "../components/employee/EmployeeSummaryCards";
import { useEmployeeDashboardData } from "../hooks/useEmployeeDashboardData";
import type { DashboardViewProps } from "../types/Dashboard";

export default function EmployeeDashboard({ currentUser }: DashboardViewProps) {
  const navigate = useNavigate();
  const {
    isLoading,
    myAttendance,
    myBalanceRecord,
    myMissingDocsRecord,
    displayedLeaveBalance,
    pendingRequests,
    badgeClass,
    employeeStatus,
  } = useEmployeeDashboardData(currentUser);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 font-semibold text-slate-700 shadow-sm">
        Loading My Dashboard...
      </div>
    );
  }

  return (
    <div className="max-w-full space-y-6">
      <div>
        <h1 className="m-0 text-[1.6rem] font-bold text-slate-900">
          Welcome back, {currentUser?.first_name || currentUser?.name || "Employee"}!
        </h1>
        <p className="m-0 mt-1 text-sm text-slate-500">
          Here is what is happening with your account today.
        </p>
        <p className="m-0 mt-2 inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-600">
          Employment Status: {employeeStatus}
        </p>
      </div>

      <EmployeeMissingDocsAlert missingDocs={myMissingDocsRecord?.missing_docs} />

      <EmployeeSummaryCards
        displayedLeaveBalance={displayedLeaveBalance}
        offsetCredits={myBalanceRecord?.offset_credits || 0}
        onOpenLeave={() => navigate("/leave")}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <EmployeeAttendanceCard
          attendance={myAttendance}
          badgeClass={badgeClass}
          onOpenAttendance={() => navigate("/attendance")}
        />
        <EmployeePendingRequestsCard pendingRequests={pendingRequests} />
      </div>
    </div>
  );
}
