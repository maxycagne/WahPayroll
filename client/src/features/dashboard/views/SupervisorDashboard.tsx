import React from "react";
import { useNavigate } from "react-router-dom";
import SupervisorHeaderAndActions from "../components/supervisor/SupervisorHeaderAndActions";
import SupervisorPersonalPanels from "../components/supervisor/SupervisorPersonalPanels";
import SupervisorTeamPanels from "../components/supervisor/SupervisorTeamPanels";
import SupervisorTeamSummaryCards from "../components/supervisor/SupervisorTeamSummaryCards";
import { useSupervisorDashboardData } from "../hooks/useSupervisorDashboardData";
import type { DashboardViewProps } from "../types/Dashboard";

export default function SupervisorDashboard({
  currentUser,
}: DashboardViewProps) {
  const navigate = useNavigate();
  const {
    isLoading,
    personalSummary,
    employeeStatus,
    teamSummary,
    teamAttendanceRows,
    teamPendingRequests,
    myAttendance,
    myPendingRequests,
    statusClass,
  } = useSupervisorDashboardData(currentUser);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 font-semibold text-slate-700 shadow-sm">
        Loading Supervisor Dashboard...
      </div>
    );
  }

  return (
    <div className="max-w-full space-y-4">
      <SupervisorHeaderAndActions
        employeeStatus={employeeStatus}
        personalSummary={personalSummary}
        onOpenLeave={() => navigate("/leave")}
        onOpenAttendance={() => navigate("/attendance")}
      />

      <SupervisorTeamSummaryCards teamSummary={teamSummary} />

      <SupervisorTeamPanels
        teamAttendanceRows={teamAttendanceRows}
        teamPendingRequests={teamPendingRequests}
        statusClass={statusClass}
      />

      <SupervisorPersonalPanels
        myAttendance={myAttendance}
        myPendingRequests={myPendingRequests}
        statusClass={statusClass}
      />
    </div>
  );
}
