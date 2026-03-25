import { Card } from "@/components/ui/card";

export default function StatCard({ stats, onCardClick }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat) => (
        <Card
          key={stat.label}
          onClick={() => onCardClick(stat.modalKey)}
          className="hover:shadow-md transition-all duration-200 hover:-translate-y-1 cursor-pointer border-t-4"
          style={{ borderTopColor: stat.borderColor }}
        >
          <div className="p-5">
            <p className="text-sm font-medium text-gray-600 mb-2">
              {stat.label}
            </p>
            <p
              className="text-3xl font-bold"
              style={{ color: stat.borderColor }}
            >
              {stat.value}
            </p>
            <p className="text-xs text-gray-400 mt-2">Click to view details</p>
          </div>
        </Card>
      ))}
    </div>
  );
}
