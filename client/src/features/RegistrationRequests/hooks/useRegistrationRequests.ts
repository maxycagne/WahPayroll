import { useQuery } from "@tanstack/react-query";
import { getPendingRequests, approveRequest, rejectRequest } from "../api/registrationRequests";
import { useToast } from "@/hooks/useToast";
import { RegistrationRequest } from "../types";
import { createMutation } from "../../leave/hooks/createMutationHandler";

export const usePendingRequests = () => {
  return useQuery({
    queryKey: ["pending-registrations"],
    queryFn: getPendingRequests,
    staleTime: 5 * 60 * 1000,
  });
};

export const useApproveRegistration = () => {
  const { showToast } = useToast();

  return createMutation<{ message: string }, { id: string; data: Partial<RegistrationRequest> }>({
    mutationFn: ({ id, data }) => approveRequest(id, data),
    successMsg: "Registration approved successfully",
    invalidateKeys: ["pending-registrations"],
    showToast: (msg, type) => showToast(msg, "", type as any),
  });
};

export const useRejectRegistration = () => {
  const { showToast } = useToast();

  return createMutation<{ message: string }, { id: string; remarks?: string }>({
    mutationFn: ({ id, remarks }) => rejectRequest(id, remarks),
    successMsg: "Registration rejected and removed successfully",
    invalidateKeys: ["pending-registrations"],
    showToast: (msg, type) => showToast(msg, "", type as any),
  });
};
