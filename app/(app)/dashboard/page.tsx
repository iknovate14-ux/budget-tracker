"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format, parseISO, differenceInCalendarDays, subDays } from "date-fns";
import CategoryCard from "@/components/CategoryCard";
import { CATEGORIES } from "@/lib/categories";
import type { BudgetConfig, Category } from "@/lib/supabase";

type PeriodDetail = {
  period: { id: string; start_date: string; end_date: string };
  config: BudgetConfig[];
  totals: Record<Category, number>;
};

function formatGBP(n: number): string {
  return `£${n.toFixed(2)}`;
}

function formatDate(d: string): string {
  return format(parseISO(d), "d MMM yyyy");
}

export default function DashboardPage() {
  const [data, setData] = useState<PeriodDetail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/periods/current")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load dashboard");
        return res.json();
      })
      .then(setData)
      .catch(() => setError("Failed to load dashboard. Please try again."));
  }, []);

  if (error) {
    return <p className="text-red-600 text-sm">{error}</p>;
  }

  if (!data) {
    return (
      <div className="animate-pulse flex flex-col gap-4">
        <div className="h-24 bg-white border border-gray-200 rounded-2xl" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 bg-white border border-gray-200 rounded-2xl" />
        ))}
      </div>
    );
  }

  const budgetByCategory = Object.fromEntries(
    data.config.map((c) => [c.category, Number(c.budget_amount)])
  ) as Record<Category, number>;

  const totalBudget = data.config.reduce((sum, c) => sum + Number(c.budget_amount), 0);
  const totalSpent = CATEGORIES.reduce((sum, c) => sum + (data.totals[c.key] ?? 0), 0);
  // end_date is an exclusive boundary (the day the next period starts).
  const daysLeft = Math.max(
    0,
    differenceInCalendarDays(parseISO(data.period.end_date), new Date())
  );
  const lastDay = format(subDays(parseISO(data.period.end_date), 1), "d MMM yyyy");

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <p className="text-xs text-gray-400 mb-1">
          {formatDate(data.period.start_date)} – {lastDay} · {daysLeft} day{daysLeft === 1 ? "" : "s"} remaining
        </p>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-gray-500">Total spent</p>
            <p className="text-3xl font-bold text-gray-900">
              {formatGBP(totalSpent)}{" "}
              <span className="text-base font-normal text-gray-400">of {formatGBP(totalBudget)}</span>
            </p>
          </div>
          <Link
            href="/add"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-colors whitespace-nowrap"
          >
            + Add Spend
          </Link>
        </div>
      </div>

      {CATEGORIES.map((c) => (
        <CategoryCard
          key={c.key}
          category={c.key}
          budget={budgetByCategory[c.key] ?? 0}
          spent={data.totals[c.key] ?? 0}
        />
      ))}
    </div>
  );
}
