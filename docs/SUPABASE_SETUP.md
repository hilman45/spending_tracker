# Supabase Setup Guide

This guide walks you through creating a Supabase project and connecting it to the Spending Tracker app.

## Step 1: Create a Supabase Account

1. Go to [https://supabase.com](https://supabase.com)
2. Click **Start your project** or **Sign in**
3. Sign up or log in with GitHub, Google, or email

## Step 2: Create a New Project

1. From the Supabase dashboard, click **New Project**
2. Fill in:
   - **Name:** e.g. `spending-tracker`
   - **Database Password:** Choose a strong password and **save it** (you’ll need it for migrations)
   - **Region:** Pick the closest region
3. Click **Create new project**
4. Wait for the project to finish provisioning (1–2 minutes)

## Step 3: Get Your API Keys

1. In the project dashboard, go to **Settings** (gear icon) → **API**
2. Copy these values:
   - **Project URL** under "Project URL"
   - **anon public** key under "Project API keys"

## Step 4: Configure the App

1. In the project root, copy the example env file:
   ```bash
   copy .env.local.example .env.local
   ```
   (On Mac/Linux: `cp .env.local.example .env.local`)

2. Open `.env.local` and replace the placeholders:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

   Use the **Project URL** and **anon public** key from Step 3.

## Step 5: Run Database Migrations

1. Install the Supabase CLI (optional for local development):
   ```bash
   npm install -g supabase
   ```

2. Link and push migrations:
   - **Option A – Supabase Dashboard (simplest):**
     - Go to **SQL Editor** in your Supabase project
     - Open the migration file in `supabase/migrations/`
     - Copy its contents and run it in the SQL Editor

   - **Option B – Supabase CLI:**
     ```bash
     supabase login
     supabase link --project-ref your-project-id
     supabase db push
     ```

3. To get your project ID for `supabase link`:
   - Project URL: `https://abcdefgh.supabase.co` → project ID is `abcdefgh`

## Step 6: Enable Auth (Email/Password)

1. In Supabase, go to **Authentication** → **Providers**
2. Enable **Email** provider (it’s usually on by default)
3. Email confirmations can stay disabled for local development

## Step 7: Create Storage Bucket (for file uploads)

1. Go to **Storage** in the Supabase dashboard
2. Click **New bucket**
3. Name it `expense-files`
4. Set it to **Private** and click **Create bucket**
5. Run the storage migration in `supabase/migrations/20250208000002_storage_bucket.sql` via SQL Editor to add RLS policies

## Verify Setup

1. Start the app: `npm run dev`
2. Open http://localhost:3000
3. Go to the signup page and create an account
4. If you can sign up and log in, Supabase is configured correctly

## Troubleshooting

### "Invalid API key" or "Check the API"

1. **Restart the dev server** – Next.js only loads `.env.local` at startup. After adding or changing env vars:
   - Stop the server (Ctrl+C)
   - Run `npm run dev` again

2. **File location** – `.env.local` must be in the project root (`spending_tracker1.0/`), same folder as `package.json`.

3. **No quotes** – Use values without quotes:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
   ```
   Wrong: `NEXT_PUBLIC_SUPABASE_URL="https://..."` (quotes become part of the value)

4. **Correct key** – Use the **anon public** key (Project API keys → anon public), not the `service_role` key.

5. **No extra spaces** – No spaces around `=` or at the end of lines.

### Other errors

- **"Failed to fetch"** – Ensure your Supabase project is running and the URL is correct.
- **Auth errors** – Confirm Email provider is enabled under Authentication → Providers.
- **RLS errors** – Make sure migrations have been run and RLS policies are applied.




