"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { format, parseISO, subDays } from "date-fns";
import CategoryCard from "@/components/CategoryCard";
import { CATEGORIES, categoryLabel } from "@/lib/categories";
import type { BudgetConfig, Category, Transaction } from "@/lib/supabase";

type PeriodDetail = {
  period: { id: string; start_date: string; end_date: string };
  config: BudgetConfig[];
  transactions: Transaction[];
  totals: Record<Category, number>;
};

function formatGBP(n: number): string {
  return `£${Number(n).toFixed(2)}`;
}

export default function PeriodDetailPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<PeriodDetail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/periods/${params.id}`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(setData)
      .catch(() => setError("Failed to load this period. Please try again."));
  }, [params.id]);

  if (error) return <p className="text-red-600 text-sm">{error}</p>;
  if (!data) return <p className="text-sm text-gray-400">Loading…</p>;

  const budgetByCategory = Object.fromEntries(
    data.config.map((c) => [c.category, Number(c.budget_amount)])
  ) as Record<Category, number>;
  const lastDay = format(subDays(parseISO(data.period.end_date), 1), "d MMM yyyy");

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          {format(parseISO(data.period.start_date), "d MMM yyyy")} – {lastDay}
        </h1>
        <Link href="/periods" className="text-sm text-blue-600 hover:text-blue-800">
          ← All periods
        </Link>
      </div>

      {CATEGORIES.map((c) => (
        <CategoryCard
          key={c.key}
          category={c.key}
          budget={budgetByCategory[c.key] ?? 0}
          spent={data.totals[c.key] ?? 0}
        />
      ))}

      <h2 className="text-sm font-semibold text-gray-700 mt-2">Transactions</h2>
      {data.transactions.length === 0 ? (
        <p className="text-sm text-gray-400">No transactions in this period.</p>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
          {data.transactions.map((t) => (
            <div key={t.id} className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {categoryLabel(t.category)}
                  {t.description ? ` — ${t.description}` : ""}
                </p>
                <p className="text-xs text-gray-400">
                  {format(parseISO(t.spend_date), "d MMM yyyy")} · logged by {t.logged_by}
                </p>
              </div>
              <span className="text-sm font-semibold text-gray-900 tabular-nums shrink-0">
                {formatGBP(t.amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
