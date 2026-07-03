import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSupabase } from "@/lib/supabase";
import { setSessionCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { username, pin } = await req.json();

  if (!username || !pin) {
    return NextResponse.json({ error: "Username and PIN required" }, { status: 400 });
  }

  const { data: user, error } = await getSupabase()
    .from("users")
    .select("id, pin_hash")
    .eq("username", String(username).trim().toLowerCase())
    .single();

  if (error || !user) {
    return NextResponse.json({ error: "Invalid username or PIN" }, { status: 401 });
  }

  const valid = await bcrypt.compare(String(pin), user.pin_hash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid username or PIN" }, { status: 401 });
  }

  await setSessionCookie(user.id);
  return NextResponse.json({ ok: true });
}
