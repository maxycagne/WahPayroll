import { useFormData } from "../hooks/useFormData";

const {
  user: { currentUser },
} = useFormData();

export const isPendingApprovalStatus = (status: string) => {
  const normalized = String(status || "")
    .trim()
    .toLowerCase();
  return normalized === "pending" || normalized === "pending approval";
};
export const isSupervisorTeamMember = (item: any) => {
  return String(item?.emp_id) !== String(currentUser?.emp_id);
};
export const canApproverReviewRecord = (
  item: any,
  isHRRole: boolean,
  isAdminRole: boolean,
  isSupervisorRole: boolean,
) => {
  if (!item) return false;
  if (String(item.emp_id) === String(currentUser?.emp_id)) return false;

  const roleValue = String(item.requester_role || "")
    .trim()
    .toLowerCase();

  if (isHRRole) {
    return true;
  }

  if (isAdminRole) {
    return roleValue !== "admin";
  }

  if (isSupervisorRole) {
    return isSupervisorTeamMember(item);
  }

  return false;
};
