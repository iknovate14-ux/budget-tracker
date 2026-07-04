import { NextResponse } from "next/server";
import { getSupabase, type Category } from "@/lib/supabase";
import { ensureCurrentPeriod, getPeriodBounds } from "@/lib/period";

export const dynamic = "force-dynamic";

// Ensures the current 28-day period exists, then returns every period
// (current + historical) newest first, each with per-category spend totals.
export async function GET() {
  await ensureCurrentPeriod();
  const supabase = getSupabase();

  const [{ data: periods, error: periodsError }, { data: txs, error: txError }] = await Promise.all([
    supabase.from("budget_periods").select("id, start_date, end_date").order("start_date", { ascending: false }),
    supabase.from("transactions").select("spend_date, category, amount"),
  ]);

  if (periodsError) return NextResponse.json({ error: periodsError.message }, { status: 500 });
  if (txError) return NextResponse.json({ error: txError.message }, { status: 500 });

  // Bucket each transaction by the period whose [start_date, end_date)
  // window its spend_date falls in — not by its stored period_id — so
  // totals stay correct even if a row's period_id was ever mis-assigned.
  const totalsByPeriodStart: Record<string, Record<Category, number>> = {};
  for (const t of txs ?? []) {
    const key = getPeriodBounds(new Date(`${t.spend_date}T00:00:00Z`)).start;
    const bucket = (totalsByPeriodStart[key] ??= { food: 0, petrol: 0, adhoc: 0 });
    bucket[t.category as Category] += Number(t.amount);
  }

  const result = (periods ?? []).map((p) => ({
    ...p,
    totals: totalsByPeriodStart[p.start_date] ?? { food: 0, petrol: 0, adhoc: 0 },
  }));

  return NextResponse.json(result);
}
