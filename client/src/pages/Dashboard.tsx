import { useMemo } from "react";
import AdminDashboard from "@/features/dashboard/views/AdminDashboard";
import EmployeeDashboard from "@/features/dashboard/views/EmployeeDashboard";
import SupervisorDashboard from "@/features/dashboard/views/SupervisorDashboard";
import React from "react";
import type { CurrentUser } from "@/features/dashboard/types/Dashboard";

export default function Dashboard() {
  const currentUser = useMemo<CurrentUser>(() => {
    try {
      return JSON.parse(localStorage.getItem("wah_user") || "{}");
    } catch {
      return {};
    }
  }, []);

  if (currentUser?.role === "RankAndFile") {
    return <EmployeeDashboard currentUser={currentUser} />;
  }

  if (currentUser?.role === "Supervisor") {
    return <SupervisorDashboard currentUser={currentUser} />;
  }

  return <AdminDashboard currentUser={currentUser} />;
}
