import { useState } from "react";
import { useFormData } from "./useFormData";

export const useRoleComputation = () => {
  const {
    user: { currentUser },
  } = useFormData();

  const normalizedRole = String(currentUser?.role || "")
    .trim()
    .toLowerCase();
  const isAdminRole = normalizedRole === "admin";
  const isHRRole = normalizedRole === "hr";
  const isSupervisorRole =
    normalizedRole === "supervisor" || normalizedRole.includes("supervisor");
  const isApprover = isHRRole || isSupervisorRole;

  const [calendarScope, setCalendarScope] = useState(
    isHRRole || isAdminRole ? "overall" : isSupervisorRole ? "team" : "own",
  );

  return {
    roles: {
      isAdminRole,
      isHRRole,
      isApprover,
      isSupervisorRole,
    },
    calendar: {
      calendarScope,
      setCalendarScope,
    },
  };
};
