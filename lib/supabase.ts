import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

// Uses the service role key — bypasses RLS. All data isolation (auth checks)
// is enforced in app code via the session cookie. RLS is enabled on the
// users table with a deny-all anon policy as a backstop against direct
// Supabase access; the service role key bypasses it intentionally.
export function getSupabase(): SupabaseClient {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("Supabase env vars are not set");
    _client = createClient(url, key, {
      auth: { persistSession: false },
    });
  }
  return _client;
}

export type Category = "food" | "petrol" | "adhoc";

export type BudgetPeriod = {
  id: string;
  start_date: string;
  end_date: string;
};

export type BudgetConfig = {
  category: Category;
  budget_amount: number;
};

export type Transaction = {
  id: string;
  period_id: string;
  category: Category;
  amount: number;
  description: string | null;
  spend_date: string;
  logged_by: string;
  created_at: string;
};

export type AppUser = {
  id: string;
  username: string;
};
