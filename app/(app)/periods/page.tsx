"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format, parseISO, subDays } from "date-fns";
import { CATEGORIES } from "@/lib/categories";
import type { BudgetConfig, Category } from "@/lib/supabase";

type PeriodSummary = {
  id: string;
  start_date: string;
  end_date: string;
  totals: Record<Category, number>;
};

function formatGBP(n: number): string {
  return `£${n.toFixed(2)}`;
}

export default function PeriodsPage() {
  const [periods, setPeriods] = useState<PeriodSummary[] | null>(null);
  const [config, setConfig] = useState<BudgetConfig[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/periods").then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      }),
      fetch("/api/config").then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      }),
    ])
      .then(([p, c]) => {
        setPeriods(p);
        setConfig(c);
      })
      .catch(() => setError("Failed to load periods. Please try again."));
  }, []);

  if (error) return <p className="text-red-600 text-sm">{error}</p>;
  if (!periods || !config) return <p className="text-sm text-gray-400">Loading…</p>;

  const budgetByCategory = Object.fromEntries(
    config.map((c) => [c.category, Number(c.budget_amount)])
  ) as Record<Category, number>;
  const totalBudget = config.reduce((sum, c) => sum + Number(c.budget_amount), 0);

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Previous Periods</h1>

      <div className="flex flex-col gap-3">
        {periods.map((p) => {
          const totalSpent = CATEGORIES.reduce((sum, c) => sum + (p.totals[c.key] ?? 0), 0);
          const lastDay = format(subDays(parseISO(p.end_date), 1), "d MMM yyyy");
          return (
            <Link
              key={p.id}
              href={`/periods/${p.id}`}
              className="bg-white rounded-2xl border border-gray-200 p-5 hover:border-blue-300 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-900">
                  {format(parseISO(p.start_date), "d MMM yyyy")} – {lastDay}
                </p>
                <p className="text-sm font-semibold text-gray-900">
                  {formatGBP(totalSpent)}{" "}
                  <span className="text-xs font-normal text-gray-400">of {formatGBP(totalBudget)}</span>
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs text-gray-500">
                {CATEGORIES.map((c) => {
                  const spent = p.totals[c.key] ?? 0;
                  const budget = budgetByCategory[c.key] ?? 0;
                  const over = spent > budget;
                  return (
                    <div key={c.key}>
                      <p className="font-medium text-gray-600">{c.label}</p>
                      <p className={over ? "text-red-600 font-medium" : ""}>
                        {formatGBP(spent)} / {formatGBP(budget)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
