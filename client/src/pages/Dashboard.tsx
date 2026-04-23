import React, { useEffect, useMemo } from "react";
import { EmployeeDashboard } from "../features/dashboard/components/EmployeeDashboard";
import { SupervisorDashboard } from "../features/dashboard/components/SupervisorDashboard";
import { AdminDashboard } from "../features/dashboard/components/AdminDashboard";
import { User } from "../features/dashboard/types";
import useSocket from "@/hooks/useSocket";

const Dashboard: React.FC = () => {
  const currentUser = useMemo(() => {
    try {
      const user = localStorage.getItem("wah_user");
      if (!user) return {} as User;

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
