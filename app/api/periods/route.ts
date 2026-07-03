import { NextResponse } from "next/server";
import { getSupabase, type Category } from "@/lib/supabase";
import { ensureCurrentPeriod } from "@/lib/period";

export const dynamic = "force-dynamic";

// Ensures the current 28-day period exists, then returns every period
// (current + historical) newest first, each with per-category spend totals.
export async function GET() {
  await ensureCurrentPeriod();
  const supabase = getSupabase();

  const [{ data: periods, error: periodsError }, { data: txs, error: txError }] = await Promise.all([
    supabase.from("budget_periods").select("id, start_date, end_date").order("start_date", { ascending: false }),
    supabase.from("transactions").select("period_id, category, amount"),
  ]);

  if (periodsError) return NextResponse.json({ error: periodsError.message }, { status: 500 });
  if (txError) return NextResponse.json({ error: txError.message }, { status: 500 });

  const totalsByPeriod: Record<string, Record<Category, number>> = {};
  for (const t of txs ?? []) {
    const bucket = (totalsByPeriod[t.period_id] ??= { food: 0, petrol: 0, adhoc: 0 });
    bucket[t.category as Category] += Number(t.amount);
  }

  const result = (periods ?? []).map((p) => ({
    ...p,
    totals: totalsByPeriod[p.id] ?? { food: 0, petrol: 0, adhoc: 0 },
  }));

  return NextResponse.json(result);
}
