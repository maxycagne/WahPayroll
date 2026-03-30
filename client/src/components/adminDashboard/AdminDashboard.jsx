import { useState } from "react";
import { dashboardSummary } from "../queries/hrDashboard/queryHrDashboard";
import StatCard from "../hrDashboard/StatCard";

function AdminDashboard() {
  const [activeModal, setActiveModal] = useState(null);
  const [approvedLeaves, setApprovedLeaves] = useState(new Set());
  const [reviewConfirm, setReviewConfirm] = useState(null);

  const dashboardData = async () => {
    const res = await axiosInterceptor.get(dashboardSummary());
    console.log(res.data);
    return res.data;
  };
  return (
    <>
      <StatCard stats={dashboardData.stats} onCardClick={setActiveModal} />
    </>
  );
}

export default AdminDashboard;
