import { addDays, differenceInCalendarDays, formatISO } from "date-fns";
import { getSupabase, type BudgetPeriod, type BudgetConfig, type Transaction, type Category } from "./supabase";

export const PERIOD_LENGTH_DAYS = 28;
// First period start (Friday). end_date of any period = start_date + 28 days,
// treated as an exclusive upper bound (the day the next period starts).
export const ANCHOR_START_DATE = "2026-07-04";

function dateOnlyUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export function getPeriodBounds(date: Date): { start: string; end: string } {
  const anchor = new Date(`${ANCHOR_START_DATE}T00:00:00Z`);
  const dateUTC = dateOnlyUTC(date);
  const daysSinceAnchor = differenceInCalendarDays(dateUTC, anchor);
  const periodIndex = Math.floor(daysSinceAnchor / PERIOD_LENGTH_DAYS);
  const start = addDays(anchor, periodIndex * PERIOD_LENGTH_DAYS);
  const end = addDays(start, PERIOD_LENGTH_DAYS);
  return {
    start: formatISO(start, { representation: "date" }),
    end: formatISO(end, { representation: "date" }),
  };
}

export function getCurrentPeriodBounds(today: Date = new Date()): { start: string; end: string } {
  return getPeriodBounds(today);
}

// Looks up the period containing `date`, creating it if it doesn't exist yet
// (e.g. the first request of a new 28-day window). Called on every
// dashboard/add-spend load so periods roll over automatically with no
// manual reset.
export async function ensurePeriodForDate(date: Date): Promise<BudgetPeriod> {
  const { start, end } = getPeriodBounds(date);
  const supabase = getSupabase();

  const { data: existing, error: findError } = await supabase
    .from("budget_periods")
    .select("id, start_date, end_date")
    .eq("start_date", start)
    .maybeSingle();

  if (findError) throw new Error(findError.message);
  if (existing) return existing as BudgetPeriod;

  const { data: created, error: insertError } = await supabase
    .from("budget_periods")
    .insert({ start_date: start, end_date: end })
    .select("id, start_date, end_date")
    .single();

  if (insertError) throw new Error(insertError.message);
  return created as BudgetPeriod;
}

export async function ensureCurrentPeriod(): Promise<BudgetPeriod> {
  return ensurePeriodForDate(new Date());
}

export function daysRemaining(endDate: string, today: Date = new Date()): number {
  const end = new Date(`${endDate}T00:00:00Z`);
  return Math.max(0, differenceInCalendarDays(end, dateOnlyUTC(today)));
}

export type PeriodDetail = {
  period: BudgetPeriod;
  config: BudgetConfig[];
  transactions: Transaction[];
  totals: Record<Category, number>;
};

function emptyTotals(): Record<Category, number> {
  return { food: 0, petrol: 0, adhoc: 0 };
}

export async function getPeriodDetail(periodId: string): Promise<PeriodDetail | null> {
  const supabase = getSupabase();

  const { data: period, error: periodError } = await supabase
    .from("budget_periods")
    .select("id, start_date, end_date")
    .eq("id", periodId)
    .maybeSingle();
  if (periodError) throw new Error(periodError.message);
  if (!period) return null;

  const [configRes, txRes] = await Promise.all([
    supabase.from("budget_config").select("category, budget_amount"),
    supabase
      .from("transactions")
      .select("*")
      .eq("period_id", periodId)
      .order("spend_date", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);
  if (configRes.error) throw new Error(configRes.error.message);
  if (txRes.error) throw new Error(txRes.error.message);

  const transactions = (txRes.data ?? []) as Transaction[];
  const totals = emptyTotals();
  for (const t of transactions) {
    totals[t.category] = (totals[t.category] ?? 0) + Number(t.amount);
  }

  return {
    period: period as BudgetPeriod,
    config: (configRes.data ?? []) as BudgetConfig[],
    transactions,
    totals,
  };
}
