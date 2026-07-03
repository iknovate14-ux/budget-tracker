"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { format, subDays } from "date-fns";
import { CATEGORIES } from "@/lib/categories";
import type { Category } from "@/lib/supabase";

type DateOption = "today" | "yesterday" | "other";

function todayStr() {
  return format(new Date(), "yyyy-MM-dd");
}
function yesterdayStr() {
  return format(subDays(new Date(), 1), "yyyy-MM-dd");
}

export default function AddSpendPage() {
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);
  const [category, setCategory] = useState<Category>("food");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [dateOption, setDateOption] = useState<DateOption>("today");
  const [customDate, setCustomDate] = useState(todayStr());
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setUsername(data?.username ?? null));
  }, []);

  function getDate(): string {
    if (dateOption === "today") return todayStr();
    if (dateOption === "yesterday") return yesterdayStr();
    return customDate;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) return;

    setStatus("saving");
    setErrorMsg("");

    // Safety timeout — always re-enable the submit button after 30s
    timeoutRef.current = setTimeout(() => {
      setStatus("error");
      setErrorMsg("Request timed out. Please try again.");
    }, 30000);

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          amount: numericAmount,
          description,
          spend_date: getDate(),
        }),
      });

      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to save spend");
      }

      setStatus("done");
      router.push("/dashboard");
    } catch (err: unknown) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  const isSubmitting = status === "saving";

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-xl font-semibold mb-4">Add Spend</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Category</label>
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setCategory(c.key)}
                className={`py-3 rounded-xl text-sm font-medium border transition-colors ${
                  category === c.key
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Amount (£)</label>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            required
            className="border border-gray-300 rounded-lg px-3 py-3 text-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">
            Description <span className="text-gray-400">(optional)</span>
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Tesco, Shell garage"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Date</label>
          <div className="flex gap-2 flex-wrap">
            {(["today", "yesterday", "other"] as DateOption[]).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setDateOption(opt)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  dateOption === opt
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
                }`}
              >
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
              </button>
            ))}
          </div>
          {dateOption === "other" && (
            <input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              max={todayStr()}
              className="mt-2 border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
          <p className="text-xs text-gray-400 mt-1">
            Logging for: <strong>{getDate()}</strong>
          </p>
        </div>

        {username && (
          <p className="text-xs text-gray-400">
            Logging as: <strong>{username}</strong>
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting || !amount}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
        >
          {status === "saving" ? "Saving…" : "Add Spend"}
        </button>
      </form>

      {status === "error" && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start justify-between gap-3">
          <p className="text-red-700 text-sm">{errorMsg}</p>
          <button onClick={() => setStatus("idle")} className="text-xs text-red-500 underline whitespace-nowrap">
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
