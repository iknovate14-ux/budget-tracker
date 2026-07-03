# Setup Guide

## 1. Create a Supabase project

1. Go to supabase.com and create a free project (separate from the calorie tracker's project)
2. In the SQL editor, paste and run the contents of `supabase-schema.sql`
3. Copy your **Project URL**, **anon key**, and **service role key** from Project Settings → API

## 2. Create Ryan and Emily's logins

1. Choose a PIN for each user, then run:
   ```
   node scripts/hash-pin.mjs <ryans-pin>
   node scripts/hash-pin.mjs <emilys-pin>
   ```
2. Paste the resulting hashes into the SQL editor:
   ```sql
   insert into users (username, pin_hash) values ('ryan', '<hash>');
   insert into users (username, pin_hash) values ('emily', '<hash>');
   ```

## 3. Configure environment variables

Edit `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## 4. Run locally

```
npm run dev
```

Then open http://localhost:3000 and log in as ryan or emily.

## 5. Deploy to Vercel

Connect this repo to Vercel (via GitHub, for git-push deploys) and add the same
3 environment variables in Project → Settings → Environment Variables.

## App structure

| Route | Description |
|-------|-------------|
| `/dashboard` | Current period budget vs spend, per category |
| `/add` | Log a new spend against the shared household budget |
| `/history` | Current period transactions, filterable by category, deletable |
| `/periods` | Past pay periods, tap through to a full breakdown |
| `/export` | Download `.xlsx` for the current period, a past period, or all periods |

Pay periods are 28 days, anchored to Friday 4 July 2026, and roll over
automatically — no manual reset needed.
