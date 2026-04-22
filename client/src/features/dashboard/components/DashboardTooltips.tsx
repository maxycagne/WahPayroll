import React from "react";

export const fmtCompactCurrency = (value: number | string) => {
  const number = Number(value || 0);
  return `₱${number.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
};

export const AttendanceTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-lg border border-slate-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur-sm">
      <p className="m-0 text-[11px] font-bold uppercase tracking-wider text-slate-500">
        Day {label}
      </p>
      <div className="mt-1 space-y-0.5">
        {payload.map((entry: any) => (
          <p
            key={entry.dataKey}
            className="m-0 flex items-center justify-between gap-3 text-xs font-semibold"
            style={{ color: entry.color }}
          >
            <span>{entry.name}</span>
            <span>{Number(entry.value || 0)}</span>
          </p>
        ))}
      </div>
    </div>
  );
};

export const PayrollTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-lg border border-slate-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur-sm">
      <p className="m-0 text-[11px] font-bold uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <div className="mt-1 space-y-0.5">
        {payload.map((entry: any) => (
          <p
            key={entry.dataKey}
            className="m-0 flex items-center justify-between gap-3 text-xs font-semibold"
            style={{ color: entry.color }}
          >
            <span>{entry.name}</span>
            <span>{fmtCompactCurrency(entry.value)}</span>
          </p>
        ))}
      </div>
    </div>
  );
};
