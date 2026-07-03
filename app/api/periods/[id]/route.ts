import { NextRequest, NextResponse } from "next/server";
import { getPeriodDetail } from "@/lib/period";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const detail = await getPeriodDetail(id);
  if (!detail) return NextResponse.json({ error: "Period not found" }, { status: 404 });
  return NextResponse.json(detail);
}
