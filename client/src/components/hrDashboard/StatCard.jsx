import { Card } from "@/components/ui/card";

export default function StatCard({ stats, onCardClick }) {
  return (
    <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card
          key={stat.label}
          onClick={() => onCardClick(stat.modalKey)}
          className="cursor-pointer rounded-lg border border-slate-200 dark:border-gray-800 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          style={{ boxShadow: `inset 0 3px 0 0 ${stat.borderColor}` }}
        >
          <div className="p-3.5 md:p-3">
            <p className="mb-1 text-xs font-medium text-slate-600 dark:text-gray-400">
              {stat.label}
            </p>
            <p
              className="text-2xl font-bold leading-none md:text-[1.35rem]"
              style={{ color: stat.borderColor }}
            >
              {stat.value}
            </p>
            <p className="mt-1.5 text-[11px] text-slate-400 dark:text-gray-500">
              Click to view details
            </p>
          </div>
        </Card>
      ))}
    </div>
  );
}
