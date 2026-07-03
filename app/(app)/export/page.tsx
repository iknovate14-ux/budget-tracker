"use client";

import { useEffect, useState } from "react";
import { format, parseISO, subDays } from "date-fns";

type PeriodOption = { id: string; start_date: string; end_date: string };

export default function ExportPage() {
  const [periods, setPeriods] = useState<PeriodOption[] | null>(null);
  const [selection, setSelection] = useState<string>("current");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/periods")
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(setPeriods)
      .catch(() => setError("Failed to load periods."));
  }, []);

  async function handleExport() {
    setLoading(true);
    setError("");
    try {
      const url =
        selection === "all"
          ? "/api/export?all=true"
          : selection === "current"
          ? "/api/export"
          : `/api/export?period_id=${selection}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = "budget-log.xlsx";
      a.click();
      URL.revokeObjectURL(objectUrl);
    } catch {
      setError("Export failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-xl font-semibold mb-4">Export</h1>

      <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-2">Period</label>
          <select
            value={selection}
            onChange={(e) => setSelection(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="current">Current period</option>
            <option value="all">All periods</option>
            {periods?.map((p) => (
              <option key={p.id} value={p.id}>
                {format(parseISO(p.start_date), "d MMM yyyy")} –{" "}
                {format(subDays(parseISO(p.end_date), 1), "d MMM yyyy")}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-600">
          <p className="text-xs text-gray-500">
            Columns: date, category, amount, description, logged by, period.
          </p>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          onClick={handleExport}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
        >
          {loading ? "Preparing download…" : "Download .xlsx"}
        </button>
      </div>
    </div>
  );
}
