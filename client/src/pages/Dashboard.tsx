import React, { useMemo } from "react";
import { EmployeeDashboard } from "../features/dashboard/components/EmployeeDashboard";
import { SupervisorDashboard } from "../features/dashboard/components/SupervisorDashboard";
import { AdminDashboard } from "../features/dashboard/components/AdminDashboard";
import { User } from "../features/dashboard/types";

const Dashboard: React.FC = () => {
  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("wah_user") || "{}") as User;
    } catch {
      return {} as User;
    }
  }, []);

  if (currentUser?.role === "RankAndFile") {
    return <EmployeeDashboard currentUser={currentUser} />;
  }

  if (currentUser?.role === "Supervisor") {
    return <SupervisorDashboard currentUser={currentUser} />;
  }

  return <AdminDashboard currentUser={currentUser} />;
};

export default Dashboard;
