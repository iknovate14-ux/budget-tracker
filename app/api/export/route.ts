import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getSupabase, type Transaction, type BudgetPeriod } from "@/lib/supabase";
import { categoryLabel } from "@/lib/categories";
import { ensureCurrentPeriod } from "@/lib/period";

export const dynamic = "force-dynamic";

function periodLabel(p: BudgetPeriod): string {
  return `${p.start_date} to ${p.end_date}`;
}

function toRow(t: Transaction, period: string) {
  return {
    Date: t.spend_date,
    Category: categoryLabel(t.category),
    "Amount (£)": Number(t.amount),
    Description: t.description ?? "",
    "Logged By": t.logged_by,
    Period: period,
  };
}

export async function GET(req: NextRequest) {
  const supabase = getSupabase();
  const { searchParams } = new URL(req.url);
  const all = searchParams.get("all") === "true";
  let periodId = searchParams.get("period_id");

  if (!all && !periodId) {
    const current = await ensureCurrentPeriod();
    periodId = current.id;
  }

  const { data: periods, error: periodsError } = await supabase
    .from("budget_periods")
    .select("id, start_date, end_date")
    .order("start_date", { ascending: false });
  if (periodsError) return NextResponse.json({ error: periodsError.message }, { status: 500 });

  const periodMap = new Map((periods ?? []).map((p) => [p.id, p as BudgetPeriod]));

  let txQuery = supabase
    .from("transactions")
    .select("*")
    .order("spend_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (!all) txQuery = txQuery.eq("period_id", periodId as string);

  const { data: transactions, error: txError } = await txQuery;
  if (txError) return NextResponse.json({ error: txError.message }, { status: 500 });

  const rows = ((transactions ?? []) as Transaction[]).map((t) =>
    toRow(t, periodMap.has(t.period_id) ? periodLabel(periodMap.get(t.period_id)!) : "")
  );

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Transactions");
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  const filename = all
    ? "budget-log-all-periods.xlsx"
    : `budget-log-${periodMap.get(periodId as string)?.start_date ?? periodId}.xlsx`;

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
