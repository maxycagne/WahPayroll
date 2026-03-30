import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function ResignationTable({ resignations, mutation }) {
  const [confirmDecision, setConfirmDecision] = useState(null);

  const handleConfirm = () => {
    if (!confirmDecision || !mutation) return;

    mutation.mutate({
      id: confirmDecision.id,
      status: confirmDecision.status,
    });
    setConfirmDecision(null);
  };

  return (
    <>
      <section className="mb-6 rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3 md:py-2.5">
          <h3 className="text-base font-semibold text-slate-900">
            Pending Resignation Approval
          </h3>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                {[
                  "Date",
                  "Employee",
                  "Resignation Type",
                  "Status",
                  "Actions",
                ].map((h) => (
                  <TableHead
                    key={h}
                    className="h-9 px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-700 md:h-8"
                  >
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {!resignations || resignations.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-5 text-center text-sm font-medium text-slate-500"
                  >
                    No pending resignations.
                  </TableCell>
                </TableRow>
              ) : (
                resignations.map((r) => (
                  <TableRow key={r.id} className="hover:bg-slate-50/80">
                    <TableCell className="px-3 py-2.5 text-sm text-slate-900 md:py-2">
                      {new Date(r.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="px-3 py-2.5 md:py-2">
                      <div className="text-sm font-semibold text-slate-900">
                        {r.first_name} {r.last_name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        ID: {r.emp_id}
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-2.5 md:py-2">
                      <div className="text-sm">{r.resignation_type}</div>
                      <div className="mt-0.5 text-[11px] text-slate-500">
                        Effective:{" "}
                        {new Date(r.effective_date).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-2.5 md:py-2">
                      <Badge
                        variant="outline"
                        className="border-yellow-200 bg-yellow-100 text-[11px] text-yellow-800"
                      >
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-3 py-2.5 md:py-2">
                      {r.status === "Pending Approval" && (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() =>
                              setConfirmDecision({
                                id: r.id,
                                status: "Approved",
                                first_name: r.first_name,
                                last_name: r.last_name,
                                resignation_type: r.resignation_type,
                                effective_date: r.effective_date,
                              })
                            }
                            disabled={mutation.isPending}
                            className="rounded-md border-0 bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-200 disabled:opacity-50 md:px-2 md:py-0.5"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() =>
                              setConfirmDecision({
                                id: r.id,
                                status: "Denied",
                                first_name: r.first_name,
                                last_name: r.last_name,
                                resignation_type: r.resignation_type,
                                effective_date: r.effective_date,
                              })
                            }
                            disabled={mutation.isPending}
                            className="rounded-md border-0 bg-rose-100 px-2.5 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-200 disabled:opacity-50 md:px-2 md:py-0.5"
                          >
                            Deny
                          </button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <Dialog
        open={!!confirmDecision}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setConfirmDecision(null);
        }}
      >
        <DialogContent className="max-w-[460px] overflow-hidden p-0">
          <DialogHeader className="border-b border-slate-200 bg-white px-4 py-3">
            <DialogTitle className="text-base font-semibold text-slate-900">
              {confirmDecision?.status === "Denied"
                ? "Confirm Denial"
                : "Confirm Approval"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 bg-slate-50 px-4 py-3">
            <p className="m-0 text-sm text-slate-700">
              <span className="font-semibold text-slate-900">
                {confirmDecision?.first_name} {confirmDecision?.last_name}
              </span>
            </p>
            <p className="m-0 text-xs text-slate-600">
              {confirmDecision?.resignation_type}
            </p>
            <p className="m-0 text-xs text-slate-500">
              Effective Date:{" "}
              {confirmDecision?.effective_date
                ? new Date(confirmDecision.effective_date).toLocaleDateString()
                : "N/A"}
            </p>
            <p className="m-0 pt-1 text-sm text-slate-700">
              Are you sure you want to {confirmDecision?.status?.toLowerCase()}{" "}
              this resignation request?
            </p>
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-200 bg-white px-4 py-3">
            <button
              type="button"
              onClick={() => setConfirmDecision(null)}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={mutation?.isPending}
              className={`rounded-md px-4 py-2 text-sm font-semibold text-white ${confirmDecision?.status === "Denied" ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"} disabled:opacity-50`}
            >
              {confirmDecision?.status === "Denied"
                ? "Confirm Denial"
                : "Confirm Approval"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
