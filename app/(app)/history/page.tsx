"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { CATEGORIES, categoryLabel } from "@/lib/categories";
import type { Category, Transaction } from "@/lib/supabase";

type PeriodDetail = {
  period: { id: string; start_date: string; end_date: string };
  transactions: Transaction[];
};

function formatGBP(n: number): string {
  return `£${Number(n).toFixed(2)}`;
}

export default function HistoryPage() {
  const [data, setData] = useState<PeriodDetail | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Category | "all">("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch("/api/periods/current")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load history");
        return res.json();
      })
      .then(setData)
      .catch(() => setError("Failed to load history. Please try again."));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      load();
    } catch {
      setError("Failed to delete transaction. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  if (error) return <p className="text-red-600 text-sm">{error}</p>;
  if (!data) return <p className="text-sm text-gray-400">Loading…</p>;

  const transactions = data.transactions.filter((t) => filter === "all" || t.category === filter);

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Transaction History</h1>
        <Link href="/periods" className="text-sm text-blue-600 hover:text-blue-800">
          Previous periods →
        </Link>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
            filter === "all"
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
          }`}
        >
          All
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => setFilter(c.key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              filter === c.key
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {transactions.length === 0 ? (
        <p className="text-sm text-gray-400">No transactions yet this period.</p>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
          {transactions.map((t) => (
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
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-sm font-semibold text-gray-900 tabular-nums">
                  {formatGBP(t.amount)}
                </span>
                <button
                  onClick={() => handleDelete(t.id)}
                  disabled={deletingId === t.id}
                  className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
                >
                  {deletingId === t.id ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
