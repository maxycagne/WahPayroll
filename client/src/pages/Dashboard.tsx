import { useMemo } from "react";
import AdminDashboard from "@/features/dashboard/views/AdminDashboard";
import EmployeeDashboard from "@/features/dashboard/views/EmployeeDashboard";
import SupervisorDashboard from "@/features/dashboard/views/SupervisorDashboard";
import React from "react";
import type { CurrentUser } from "@/features/dashboard/types/Dashboard";
import { useAuthStore } from "@/stores/authStore";

export default function Dashboard() {
  const authUser = useAuthStore((state) => state.user);
  const currentUser = useMemo<CurrentUser>(
    () => ((authUser && typeof authUser === "object" ? authUser : {}) as CurrentUser),
    [authUser],
  );

  if (currentUser?.role === "RankAndFile") {
    return <EmployeeDashboard currentUser={currentUser} />;
  }

  if (currentUser?.role === "Supervisor") {
    return <SupervisorDashboard currentUser={currentUser} />;
  }

  return <AdminDashboard currentUser={currentUser} />;
}
