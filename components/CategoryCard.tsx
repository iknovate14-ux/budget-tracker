import { categoryLabel } from "@/lib/categories";
import type { Category } from "@/lib/supabase";

function formatGBP(n: number): string {
  return `£${n.toFixed(2)}`;
}

export default function CategoryCard({
  category,
  budget,
  spent,
}: {
  category: Category;
  budget: number;
  spent: number;
}) {
  const remaining = budget - spent;
  const pct = budget > 0 ? (spent / budget) * 100 : 0;
  const barPct = Math.min(100, pct);

  let barColor = "bg-green-500";
  if (pct >= 100) barColor = "bg-red-500";
  else if (pct >= 75) barColor = "bg-amber-500";

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-900">{categoryLabel(category)}</h3>
        <span className="text-xs text-gray-400">
          {formatGBP(spent)} of {formatGBP(budget)}
        </span>
      </div>

      <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden mb-2">
        <div className={`h-full ${barColor} transition-all`} style={{ width: `${barPct}%` }} />
      </div>

      {remaining >= 0 ? (
        <p className="text-sm text-gray-500">{formatGBP(remaining)} remaining</p>
      ) : (
        <p className="text-sm font-medium text-red-600">{formatGBP(-remaining)} over budget</p>
      )}
    </div>
  );
}
