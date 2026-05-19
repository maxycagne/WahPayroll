export const normalizeAccessRole = (role: string | undefined | null) => {
  if (String(role || "").trim() === "Manager") return "RankAndFile";
  return String(role || "RankAndFile").trim() || "RankAndFile";
};

export const applyManagerDisplayOverride = <T extends { emp_id?: string | number; position?: string; designation?: string }>(user: T | null | undefined) => {
  if (!user || String(user.emp_id || "") !== "15") return user;
  return {
    ...user,
    position: "Manager",
    designation: "Manager",
  };
};

export const getDisplayRoleLabel = (role: string | undefined | null) => {
  const value = String(role || "").trim();
  if (value === "Manager") return "Manager";
  if (value === "RankAndFile") return "Rank and File";
  return value || "Employee";
};