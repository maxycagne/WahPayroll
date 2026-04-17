export function parseDateOnly(value: string | number | Date | null | undefined) {
  if (value instanceof Date) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  const raw = String(value || "").trim();
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (match) {
    const [, y, m, d] = match;
    return new Date(Number(y), Number(m) - 1, Number(d));
  }

  const parsed = new Date(raw);
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

export function getDateDiffInclusive(
  start: string | number | Date,
  end: string | number | Date,
) {
  const from = parseDateOnly(start).getTime();
  const to = parseDateOnly(end).getTime();
  return Math.floor((to - from) / (1000 * 60 * 60 * 24)) + 1;
}

export function getDateRangeInclusive(
  start: string | number | Date,
  end: string | number | Date,
) {
  const dates: string[] = [];
  const current = parseDateOnly(start);
  const to = parseDateOnly(end);

  while (current <= to) {
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, "0");
    const day = String(current.getDate()).padStart(2, "0");
    dates.push(`${year}-${month}-${day}`);
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

export const fmtCompactCurrency = (value: string | number | null | undefined) => {
  const number = Number(value || 0);
  return `₱${number.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
};
