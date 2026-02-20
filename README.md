# Spending Tracker

A web-based personal spending tracker. Upload expense documents, extract transactions, categorize them, review and confirm, then visualize analytics and export to Google Sheets.

## Quick Start

### 1. Set Up Supabase

**You need a Supabase project before running the app.** Follow the detailed guide:

→ **[docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md)**

Summary:

1. Create an account at [supabase.com](https://supabase.com)
2. Create a new project
3. Copy **Project URL** and **anon public** key from Settings → API
4. Create `.env.local` from `.env.local.example` and paste your values
5. Run the SQL migrations in `supabase/migrations/` via the Supabase SQL Editor
6. Create the `expense-files` storage bucket and run the storage migration (see [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md) Step 7)

### 2. Run the App

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign up for an account and you’ll land on the dashboard.

## Tech Stack

- **Frontend:** Next.js 16 (App Router), Tailwind CSS, Chart.js
- **Backend:** Next.js Server Actions
- **Database & Auth:** Supabase (PostgreSQL + Auth)
- **Storage:** Supabase Storage (for file uploads)

## Project Structure

```
spending_tracker1.0/
├── app/              # Next.js App Router pages
├── lib/supabase/     # Supabase client utilities
├── supabase/         # Database migrations
├── docs/             # Setup and documentation
└── .docs/            # Product specs (PRD, FEATURES, etc.)
```

## Deploy

To deploy (e.g. Vercel): build, set env vars, and configure Supabase redirect URLs. See **[docs/DEPLOY.md](docs/DEPLOY.md)** for the full checklist.

## Next Steps

After Supabase is configured:

1. **File upload** – Done. Upload PDF, DOCX, JPG, PNG at `/upload`
2. **Text extraction** – PDF/DOCX parsing, Tesseract for images
3. **Transaction detection** – Pattern matching and editable fields
4. **Categorization** – Keyword rules, suggested vs confirmed categories
5. **Dashboard** – Charts, filters, analytics
