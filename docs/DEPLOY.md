# Deploying Spending Tracker

Steps to run before and when deploying (e.g. to Vercel).

## Pre-deploy checklist

### 1. Verify the app builds

From the project root:

```bash
npm run build
```

Fix any TypeScript or build errors before deploying.

### 2. Run the linter (optional)

```bash
npm run lint
```

Resolve any reported issues.

### 3. Production environment variables

Set these in your host’s dashboard (e.g. Vercel → Project → Settings → Environment Variables):

| Variable | Required | Notes |
|----------|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Your Supabase project URL (same as in `.env.local`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Your Supabase anon public key |
| `GEMINI_API_KEY` / `OPENAI_API_KEY` | No | Only if you enable AI insights |

Use the same Supabase project as local so data and auth stay in one place. Do not commit `.env.local` (it is in `.gitignore`).

### 4. Configure Supabase for the production URL

After you know your production URL (e.g. `https://your-app.vercel.app`):

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project.
2. Go to **Authentication** → **URL Configuration**.
3. Set **Site URL** to your production app URL.
4. Under **Redirect URLs**, add the same URL (e.g. `https://your-app.vercel.app` or `https://your-app.vercel.app/**`).

This ensures sign-up, login, and email confirmation redirect back to the deployed app.

## Deploy (e.g. Vercel)

1. Push your code to a Git repo and connect it to Vercel.
2. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel → Project → Settings → Environment Variables.
3. Deploy. Vercel will run `next build` and serve the app.
4. In Supabase, set **Site URL** and **Redirect URLs** to your Vercel URL (see step 4 above).

Done. Use the same Supabase project for local and production so you have one database and one set of users.
