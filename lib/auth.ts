import { cookies } from "next/headers";
import { getSupabase, type AppUser } from "./supabase";

const SESSION_COOKIE = "budget_session";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getSessionUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const val = cookieStore.get(SESSION_COOKIE)?.value;
  if (!val || !UUID_RE.test(val)) return null;
  return val;
}

export async function setSessionCookie(userId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSessionUser(): Promise<AppUser | null> {
  const userId = await getSessionUserId();
  if (!userId) return null;
  const { data } = await getSupabase()
    .from("users")
    .select("id, username")
    .eq("id", userId)
    .single();
  return (data as AppUser) ?? null;
}
