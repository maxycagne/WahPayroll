export function safeText(value: string | number | null | undefined): string {
  const text = String(value || "").trim();
  const lowered = text.toLowerCase();
  if (!text) return "";
  if (
    lowered === "undefined" ||
    lowered === "null" ||
    lowered === "undefined undefined" ||
    lowered === "null null"
  ) {
    return "";
  }
  return text;
}

export function toDateInputValue(
  value: string | number | null | undefined,
): string {
  const normalized = safeText(value);
  if (!normalized) return "";
  return normalized.slice(0, 10);
}

export function buildEmployeeDisplayName(
  currentUser?: CurrentUserLike | null,
): string {
  const name = safeText(currentUser?.name);
  if (name) return name;
  return safeText(
    `${safeText(currentUser?.first_name)} ${safeText(currentUser?.last_name)}`,
  );
}
