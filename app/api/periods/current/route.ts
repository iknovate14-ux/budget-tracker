import { NextResponse } from "next/server";
import { ensureCurrentPeriod, getPeriodDetail } from "@/lib/period";

export const dynamic = "force-dynamic";

export async function GET() {
  const period = await ensureCurrentPeriod();
  const detail = await getPeriodDetail(period.id);
  return NextResponse.json(detail);
}
