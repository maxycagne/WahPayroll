import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function EmployeeCard({
  employee,
  avatarColor,
  badgeClass,
  badgeLabel,
  children,
}) {
  return (
    <div className="flex items-start gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-full font-bold text-sm shrink-0 ${avatarColor}`}
      >
        {employee.first_name.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-900">
          {employee.first_name} {employee.last_name}
        </p>
        {children}
      </div>
      <Badge variant="outline" className={badgeClass}>
        {badgeLabel}
      </Badge>
    </div>
  );
}

export function PendingLeaveModal({ open, onClose, pendingLeaves }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[500px] p-0 overflow-hidden flex flex-col max-h-[80vh]">
        <DialogHeader className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 shrink-0">
          <DialogTitle className="text-white text-lg font-semibold">
            Pending Leaves (Read-Only)
          </DialogTitle>
        </DialogHeader>
        <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
          {!pendingLeaves?.length ? (
            <p className="text-center text-gray-500 font-medium">
              No pending requests.
            </p>
          ) : (
            <div className="space-y-3">
              {pendingLeaves.map((employee, idx) => (
                <EmployeeCard
                  key={idx}
                  employee={employee}
                  avatarColor="bg-purple-100 text-purple-600"
                  badgeClass="bg-yellow-100 text-yellow-800 border-yellow-200"
                  badgeLabel="Pending"
                >
                  <p className="text-xs text-gray-600 mt-1">
                    {employee.leave_type}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(employee.date_from).toLocaleDateString()} -{" "}
                    {new Date(employee.date_to).toLocaleDateString()}
                  </p>
                </EmployeeCard>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function OnLeaveModal({ open, onClose, onLeave }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[500px] p-0 overflow-hidden flex flex-col max-h-[80vh]">
        <DialogHeader className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 shrink-0">
          <DialogTitle className="text-white text-lg font-semibold">
            Employees Currently on Leave
          </DialogTitle>
        </DialogHeader>
        <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
          {!onLeave?.length ? (
            <p className="text-center text-gray-500 font-medium">
              No employees on leave today.
            </p>
          ) : (
            <div className="space-y-3">
              {onLeave.map((employee, idx) => (
                <EmployeeCard
                  key={idx}
                  employee={employee}
                  avatarColor="bg-amber-100 text-amber-600"
                  badgeClass="bg-amber-100 text-amber-800 border-amber-200"
                  badgeLabel="On Leave"
                >
                  <p className="text-xs text-gray-600 mt-1">
                    {employee.leave_type}
                  </p>
                </EmployeeCard>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AbsentModal({ open, onClose, absents }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[500px] p-0 overflow-hidden flex flex-col max-h-[80vh]">
        <DialogHeader className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 shrink-0">
          <DialogTitle className="text-white text-lg font-semibold">
            Absent Employees
          </DialogTitle>
        </DialogHeader>
        <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
          {!absents?.length ? (
            <p className="text-center text-gray-500 font-medium">
              No absent employees today.
            </p>
          ) : (
            <div className="space-y-3">
              {absents.map((employee, idx) => (
                <EmployeeCard
                  key={idx}
                  employee={employee}
                  avatarColor="bg-red-100 text-red-600"
                  badgeClass="bg-red-100 text-red-800 border-red-200"
                  badgeLabel="Absent"
                >
                  <p className="text-xs text-gray-600 mt-1">
                    Not marked present for today.
                  </p>
                </EmployeeCard>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ResignationModal({ open, onClose, resignations, mutation }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[500px] p-0 overflow-hidden">
        <DialogHeader className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
          <DialogTitle className="text-white text-lg font-semibold">
            Pending Resignations
          </DialogTitle>
        </DialogHeader>
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {!resignations?.length ? (
            <p className="text-center text-gray-500 font-medium">
              No pending resignations.
            </p>
          ) : (
            <div className="space-y-3">
              {resignations.map((r, idx) => (
                <div
                  key={idx}
                  className="flex flex-col p-4 border border-gray-200 rounded-lg bg-gray-50 gap-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-900 text-sm">
                        {r.first_name} {r.last_name}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {r.resignation_type}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-yellow-100 text-yellow-800 border-yellow-200"
                    >
                      {r.status}
                    </Badge>
                  </div>
                  {r.status === "Pending Approval" && (
                    <div className="flex gap-2 pt-3 border-t border-gray-200">
                      <button
                        onClick={() =>
                          mutation.mutate({ id: r.id, status: "Approved" })
                        }
                        disabled={mutation.isPending}
                        className="flex-1 px-3 py-1.5 rounded-md bg-green-100 text-green-700 text-xs font-bold hover:bg-green-200 border-0 disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() =>
                          mutation.mutate({ id: r.id, status: "Denied" })
                        }
                        disabled={mutation.isPending}
                        className="flex-1 px-3 py-1.5 rounded-md bg-red-100 text-red-700 text-xs font-bold hover:bg-red-200 border-0 disabled:opacity-50"
                      >
                        Deny
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
