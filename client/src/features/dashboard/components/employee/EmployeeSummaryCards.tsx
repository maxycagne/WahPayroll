import React from "react";
import { ArrowRight, CalendarPlus2, Clock3 } from "lucide-react";

type EmployeeSummaryCardsProps = {
  displayedLeaveBalance: number;
  offsetCredits: number | string;
  onOpenLeave: () => void;
};

export default function EmployeeSummaryCards({
  displayedLeaveBalance,
  offsetCredits,
  onOpenLeave,
}: EmployeeSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      <div className="flex flex-col justify-between rounded-xl border border-emerald-200/70 bg-white p-5 shadow-sm">
        <p className="m-0 mb-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
          Leave Balance
        </p>
        <div className="flex items-baseline gap-2">
          <h2 className="m-0 text-4xl font-black text-slate-900">
            {displayedLeaveBalance}
          </h2>
          <span className="text-sm font-medium text-slate-500">Days Remaining</span>
        </div>
      </div>

      <div className="flex flex-col justify-between rounded-xl border border-violet-200/80 bg-white p-5 shadow-sm">
        <p className="m-0 mb-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
          Offset Credits
        </p>
        <div className="flex items-baseline gap-2">
          <h2 className="m-0 text-4xl font-black text-slate-900">{offsetCredits}</h2>
          <span className="text-sm font-medium text-slate-500">Earned Credits</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <button
          onClick={onOpenLeave}
          className="group flex flex-1 cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 shadow-sm transition-colors hover:bg-slate-50"
        >
          <span className="rounded-md bg-violet-100 p-1.5 text-violet-700">
            <CalendarPlus2 className="h-4 w-4" />
          </span>
          <span className="text-sm font-bold text-slate-800">File a Leave Request</span>
          <ArrowRight className="ml-auto h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5" />
        </button>
        <button
          onClick={onOpenLeave}
          className="group flex flex-1 cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 shadow-sm transition-colors hover:bg-slate-50"
        >
          <span className="rounded-md bg-indigo-100 p-1.5 text-indigo-700">
            <Clock3 className="h-4 w-4" />
          </span>
          <span className="text-sm font-bold text-slate-800">File an Offset</span>
          <ArrowRight className="ml-auto h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
}
