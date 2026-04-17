import React from "react";
import { CalendarPlus2, Clock3, FolderClock } from "lucide-react";
import type { EmployeePendingRequest } from "../../types/EmployeeDashboard";

type EmployeePendingRequestsCardProps = {
  pendingRequests: EmployeePendingRequest[];
};

export default function EmployeePendingRequestsCard({
  pendingRequests,
}: EmployeePendingRequestsCardProps) {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3">
        <h3 className="m-0 text-sm font-bold text-slate-900">My Pending Requests</h3>
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
          {pendingRequests.length} Pending
        </span>
      </div>
      <div className="max-h-[300px] flex-1 overflow-y-auto p-5">
        {pendingRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <span className="mb-2 rounded-full bg-emerald-100 p-2 text-emerald-700">
              <FolderClock className="h-5 w-5" />
            </span>
            <p className="m-0 text-sm font-semibold text-slate-700">You are all caught up!</p>
            <p className="m-0 mt-1 text-xs text-slate-500">
              No pending requests waiting for approval.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingRequests.map((req) => (
              <div
                key={req.id}
                className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50/80 p-3"
              >
                <div className="mt-0.5 rounded-md bg-white p-1.5 text-violet-700 ring-1 ring-slate-200">
                  {req.type === "Leave" ? (
                    <CalendarPlus2 className="h-3.5 w-3.5" />
                  ) : (
                    <Clock3 className="h-3.5 w-3.5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="m-0 text-sm font-bold text-slate-900">{req.type} Request</p>
                  <p className="m-0 text-xs text-slate-600">{req.title}</p>
                  <p className="m-0 mt-1 text-[10px] text-slate-400">
                    Filed on {new Date(req.date).toLocaleDateString()}
                  </p>
                </div>
                <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800">
                  Pending
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
