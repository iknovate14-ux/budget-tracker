import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSupabase } from "@/lib/supabase";
import { setSessionCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  console.log("[login] request received");

  let body: { username?: string; pin?: string };
  try {
    body = await req.json();
  } catch (err) {
    console.error("[login] failed to parse request body:", err);
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  console.log("[login] raw body:", JSON.stringify(body));

  const { username, pin } = body;
  if (!username || !pin) {
    console.log("[login] missing username or pin, aborting");
    return NextResponse.json({ error: "Username and PIN required" }, { status: 400 });
  }

  let supabase;
  try {
    supabase = getSupabase();
    console.log("[login] supabase client initialized ok");
  } catch (err) {
    console.error("[login] supabase client failed to initialize:", err);
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  const lookupUsername = String(username).trim().toLowerCase();
  console.log("[login] querying users table for username:", lookupUsername);

  let user, error;
  try {
    const result = await supabase
      .from("users")
      .select("id, pin_hash")
      .eq("username", lookupUsername)
      .single();
    user = result.data;
    error = result.error;
  } catch (err) {
    console.error("[login] supabase query threw:", err);
    return NextResponse.json({ error: "Server error during login" }, { status: 500 });
  }

  console.log("[login] user row found:", !!user, "| supabase error:", error?.message ?? null);

  if (error || !user) {
    return NextResponse.json({ error: "Invalid username or PIN" }, { status: 401 });
  }

  console.log("[login] pin type:", typeof pin, "| pin value repr:", JSON.stringify(pin));
  console.log("[login] hash from DB (first 20 chars):", user.pin_hash?.slice(0, 20));
  console.log("[login] hash length:", user.pin_hash?.length);

  const trimmedHash = user.pin_hash.trim();
  console.log("[login] comparing pin against trimmed hash…");
  const valid = await bcrypt.compare(String(pin), trimmedHash);
  console.log("[login] bcrypt.compare result:", valid);

  if (!valid) {
    return NextResponse.json({
      error: "Invalid username or PIN",
      _debug: {
        pinType: typeof pin,
        pinLength: String(pin).length,
        hashLength: user.pin_hash.length,
        hashTrimmedLength: trimmedHash.length,
        hashPrefix: user.pin_hash.slice(0, 7),
        compareResult: valid,
      },
    }, { status: 401 });
  }

  await setSessionCookie(user.id);
  console.log("[login] success — session set for user:", user.id);
  return NextResponse.json({ ok: true });
}
