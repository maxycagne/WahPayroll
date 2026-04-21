export const pad = (n: number) => (n < 10 ? "0" + n : "" + n);

export const getLeaveHighlightColor = (remaining: number) => {
  if (remaining <= 0) return "bg-red-100 text-red-800";
  if (remaining <= 3) return "bg-orange-100 text-orange-800";
  return "bg-blue-100 text-blue-800";
};
