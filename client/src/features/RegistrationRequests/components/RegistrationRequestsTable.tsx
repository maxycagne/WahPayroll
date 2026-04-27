import { useState } from "react";
import { usePendingRequests, useApproveRegistration, useRejectRegistration } from "../hooks/useRegistrationRequests";
import { Button } from "@/components/ui/button";
import { Check, X, Edit2 } from "lucide-react";
import { RegistrationRequest } from "../types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const designations = {
  Operations: [
    "Supervisor(Finance & Operations)",
    "Assistant Finance & Operations Partner",
    "Admin & Human Resources Partner",
  ],
  "Health Program Partners": [
    "Supervisor(Health Program Partner)",
    "Health Program Partner",
    "Profiler",
  ],
  "Platform Innovation": [
    "Supervisor(Platform Innovation)",
    "Senior Platform Innovation Partner",
    "Platform Innovation Partner",
    "Data Analyst",
    "Business Analyst/Quality Assurance",
  ],
  "Network & System": [
    "Supervisor(Network & Systems)",
    "Network & Systems Partner",
  ],
};

export const RegistrationRequestsTable = () => {
  const { data: requests, isLoading } = usePendingRequests();
  const approveMutation = useApproveRegistration();
  const rejectMutation = useRejectRegistration();
  const [editingRequest, setEditingRequest] = useState<RegistrationRequest | null>(null);
  const [rejectConfirm, setRejectConfirm] = useState<RegistrationRequest | null>(null);

  if (isLoading) return <div className="p-4">Loading requests...</div>;

  if (!requests || requests.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <p className="text-gray-500 font-medium">No pending registration requests found.</p>
      </div>
    );
  }

  const handleApprove = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRequest) {
      // Use the original TEMP_ ID for the URL parameter
      const originalId = (editingRequest as any).original_temp_id;
      
      approveMutation.mutate({ 
        id: originalId, 
        data: editingRequest 
      }, {
        onSuccess: () => setEditingRequest(null)
      });
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <table className="w-full text-left text-sm border-collapse">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 font-bold text-gray-700">Full Name</th>
            <th className="px-6 py-3 font-bold text-gray-700">Designation / Role</th>
            <th className="px-6 py-3 font-bold text-gray-700">Email Address</th>
            <th className="px-6 py-3 font-bold text-gray-700 text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {requests.map((req) => (
            <tr key={req.emp_id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4">
                <div className="font-semibold text-gray-800">
                  {req.last_name}, {req.first_name}
                </div>
              </td>
              <td className="px-6 py-4 text-gray-600">
                <div className="font-medium text-gray-900">{req.designation}</div>
                <div className="text-xs opacity-75">{req.role}</div>
              </td>
              <td className="px-6 py-4 text-gray-600">{req.email}</td>
              <td className="px-6 py-4">
                <div className="flex justify-center gap-2">
                  <Button
                    onClick={() => {
                        // Reset emp_id to empty when opening modal so admin can fill it
                        setEditingRequest({ ...req, emp_id: req.emp_id, original_temp_id: req.emp_id } as any);
                        // We actually need a way to track the original TEMP_ID while editing the new emp_id
                    }}
                    variant="outline"
                    className="h-8 px-2 text-purple-600 border-purple-200 hover:bg-purple-50"
                  >
                    <Edit2 className="h-4 w-4 mr-1" /> Review & Approve
                  </Button>
                  <Button
                    onClick={() => setRejectConfirm(req)}
                    disabled={rejectMutation.isPending}
                    variant="outline"
                    className="h-8 w-8 p-0 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                    title="Reject"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Edit & Approve Modal */}
      {editingRequest && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden my-auto">
            <div className="px-6 py-4 bg-purple-600 flex justify-between items-center text-white">
              <h2 className="text-xl font-bold m-0">Review & Approve Registration</h2>
              <button onClick={() => setEditingRequest(null)} className="text-white text-2xl bg-transparent border-0 cursor-pointer">&times;</button>
            </div>
            <form onSubmit={handleApprove} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1 md:col-span-2">
                  <label className="text-xs font-bold text-purple-600 uppercase">ASSIGN EMPLOYEE ID (REQUIRED)</label>
                  <input
                    name="emp_id_new"
                    value={editingRequest.emp_id.startsWith('TEMP_') ? '' : editingRequest.emp_id}
                    onChange={(e) => setEditingRequest({...editingRequest, emp_id: e.target.value})}
                    placeholder="Enter permanent Employee ID"
                    required
                    className="border-2 border-purple-200 rounded-lg p-2.5 focus:border-purple-500 outline-none font-bold"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">First Name</label>
                  <input
                    value={editingRequest.first_name}
                    onChange={(e) => setEditingRequest({...editingRequest, first_name: e.target.value})}
                    required
                    className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Last Name</label>
                  <input
                    value={editingRequest.last_name}
                    onChange={(e) => setEditingRequest({...editingRequest, last_name: e.target.value})}
                    required
                    className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
                
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Email</label>
                  <input
                    value={editingRequest.email}
                    onChange={(e) => setEditingRequest({...editingRequest, email: e.target.value})}
                    required
                    className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Designation</label>
                  <select
                    value={editingRequest.designation}
                    onChange={(e) => setEditingRequest({...editingRequest, designation: e.target.value, position: ""})}
                    required
                    className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 outline-none"
                  >
                    <option value="">Select Designation</option>
                    {Object.keys(designations).map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Position</label>
                  <select
                    value={editingRequest.position}
                    onChange={(e) => setEditingRequest({...editingRequest, position: e.target.value})}
                    required
                    disabled={!editingRequest.designation}
                    className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 outline-none"
                  >
                    <option value="">Select Position</option>
                    {editingRequest.designation &&
                      designations[editingRequest.designation as keyof typeof designations].map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Status</label>
                  <select
                    value={editingRequest.status}
                    onChange={(e) => setEditingRequest({...editingRequest, status: e.target.value})}
                    className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 outline-none"
                  >
                    <option value="Permanent">Permanent</option>
                    <option value="Job Order">Job Order</option>
                    <option value="Casual">Casual</option>
                    <option value="PGT Employee">PGT Employee</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Hired Date</label>
                  <input
                    type="date"
                    value={editingRequest.hired_date ? editingRequest.hired_date.split('T')[0] : ''}
                    onChange={(e) => setEditingRequest({...editingRequest, hired_date: e.target.value})}
                    required
                    className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>

                <div className="md:col-span-2 border-t border-gray-100 pt-4">
                  <label className="text-xs font-bold text-purple-600 uppercase mb-3 block">Government IDs</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">PHILHEALTH No.</label>
                      <input
                        value={editingRequest.philhealth_no || ""}
                        onChange={(e) => setEditingRequest({...editingRequest, philhealth_no: e.target.value})}
                        className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">TIN <span className="text-red-500">*</span></label>
                      <input
                        value={editingRequest.tin || ""}
                        onChange={(e) => setEditingRequest({...editingRequest, tin: e.target.value})}
                        required
                        className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">SSS No. <span className="text-red-500">*</span></label>
                      <input
                        value={editingRequest.sss_no || ""}
                        onChange={(e) => setEditingRequest({...editingRequest, sss_no: e.target.value})}
                        required
                        className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">PAG-IBIG MID <span className="text-red-500">*</span></label>
                      <input
                        value={editingRequest.pag_ibig_mid_no || ""}
                        onChange={(e) => setEditingRequest({...editingRequest, pag_ibig_mid_no: e.target.value})}
                        required
                        className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">GSIS No.</label>
                      <input
                        value={editingRequest.gsis_no || ""}
                        onChange={(e) => setEditingRequest({...editingRequest, gsis_no: e.target.value})}
                        className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                <Button type="button" variant="outline" onClick={() => setEditingRequest(null)}>Cancel</Button>
                <Button 
                    type="submit" 
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                    disabled={approveMutation.isPending || editingRequest.emp_id.startsWith('TEMP_')}
                >
                    {approveMutation.isPending ? "Approving..." : "Confirm & Approve"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Dialog
        open={Boolean(rejectConfirm)}
        onOpenChange={(open) => {
          if (!open) {
            setRejectConfirm(null);
          }
        }}
      >
        <DialogContent className="max-w-md overflow-hidden p-0">
          <DialogHeader className="bg-gradient-to-r from-red-600 to-red-700 px-5 py-4">
            <DialogTitle className="text-base font-semibold text-white">
              Reject Registration Request
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 px-5 py-4">
            <p className="text-sm text-slate-700">
              Are you sure you want to reject the registration request for
              <span className="font-semibold text-slate-900">
                {" "}
                {rejectConfirm?.first_name} {rejectConfirm?.last_name}
              </span>
              ?
            </p>
            <p className="text-xs leading-5 text-slate-500">
              This will permanently remove the pending registration request from
              the queue.
            </p>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setRejectConfirm(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={rejectMutation.isPending}
              onClick={() => {
                if (!rejectConfirm) return;

                rejectMutation.mutate(
                  { id: rejectConfirm.emp_id },
                  {
                    onSuccess: () => setRejectConfirm(null),
                  },
                );
              }}
            >
              {rejectMutation.isPending ? "Rejecting..." : "Confirm Reject"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
