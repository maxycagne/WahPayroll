import React from "react";
import type { SupervisorTeamSummary } from "../../types/SupervisorDashboard";

type SupervisorTeamSummaryCardsProps = {
  teamSummary: Required<SupervisorTeamSummary>;
};

export default function SupervisorTeamSummaryCards({
  teamSummary,
}: SupervisorTeamSummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm lg:col-span-1">
        <p className="m-0 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Team Size
        </p>
        <p className="m-0 mt-1 text-2xl font-black text-slate-900">
          {teamSummary.teamSize}
        </p>
      </div>
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 shadow-sm lg:col-span-1">
        <p className="m-0 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
          Present
        </p>
        <p className="m-0 mt-1 text-2xl font-black text-emerald-800">
          {teamSummary.presentCount}
        </p>
      </div>
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 shadow-sm lg:col-span-1">
        <p className="m-0 text-[10px] font-bold uppercase tracking-wider text-amber-700">
          Late
        </p>
        <p className="m-0 mt-1 text-2xl font-black text-amber-800">
          {teamSummary.lateCount}
        </p>
      </div>
      <div className="rounded-xl border border-red-200 bg-red-50 p-3 shadow-sm lg:col-span-1">
        <p className="m-0 text-[10px] font-bold uppercase tracking-wider text-red-700">
          Absent
        </p>
        <p className="m-0 mt-1 text-2xl font-black text-red-800">
          {teamSummary.absentCount}
        </p>
      </div>
      <div className="rounded-xl border border-violet-200 bg-violet-50 p-3 shadow-sm lg:col-span-1">
        <p className="m-0 text-[10px] font-bold uppercase tracking-wider text-violet-700">
          On Leave
        </p>
        <p className="m-0 mt-1 text-2xl font-black text-violet-800">
          {teamSummary.onLeaveCount}
        </p>
      </div>
      <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 shadow-sm lg:col-span-1">
        <p className="m-0 text-[10px] font-bold uppercase tracking-wider text-sky-700">
          Pending
        </p>
        <p className="m-0 mt-1 text-2xl font-black text-sky-800">
          {teamSummary.pendingApprovals}
        </p>
      </div>
    </div>
  );
}
