import { NextRequest, NextResponse } from "next/server";
import { getSupabase, type Category } from "@/lib/supabase";
import { getSessionUser } from "@/lib/auth";
import { ensurePeriodForDate } from "@/lib/period";

export const dynamic = "force-dynamic";

const VALID_CATEGORIES: Category[] = ["food", "petrol", "adhoc"];

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { category, amount, description, spend_date } = await req.json();

  if (!VALID_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    return NextResponse.json({ error: "Enter a valid amount" }, { status: 400 });
  }
  if (!spend_date || Number.isNaN(Date.parse(spend_date))) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const period = await ensurePeriodForDate(new Date(`${spend_date}T00:00:00Z`));

  const { data, error } = await getSupabase()
    .from("transactions")
    .insert({
      period_id: period.id,
      category,
      amount: numericAmount,
      description: description?.trim() || null,
      spend_date,
      logged_by: user.username,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
