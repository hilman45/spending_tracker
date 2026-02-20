We are extending the existing Spending Tracker project.

Follow PRD.md, FEATURES.md, DATA_MODEL.md, NON_GOALS.md, and AI_EXTENSIBILITY.md strictly.
Do NOT introduce out-of-scope features.
Do NOT add banking integrations or AI auto-saving.

We are adding the following new features:

---------------------------------------------------
FEATURE 1: Budget Tracking (Per Category, Monthly)
---------------------------------------------------

Requirements:
- Users can set a monthly budget per category.
- Budgets are defined per user.
- Budget applies to a specific month and year.
- Example: Food - RM800 for March 2026.

Database:
- Create a new table: budgets
  Fields:
    - id
    - user_id
    - category_id
    - month (integer 1-12)
    - year (integer)
    - amount
    - created_at

Behavior:
- Dashboard must show:
    - Budget amount
    - Total spent for that category in that month
    - Remaining amount
    - Percentage used
- If spending exceeds budget:
    - Show visual warning (red indicator)
- No automatic blocking of spending.

UI:
- Add “Manage Budgets” page or modal.
- Allow create, edit, delete budget.
- Clean Tailwind UI.

---------------------------------------------------
FEATURE 2: Recurring Expense Detection
---------------------------------------------------

Goal:
Detect recurring expenses automatically using rules.

Rules:
- Same merchant/description
- Similar amount (+/- 5%)
- Appears at regular interval (monthly or weekly)
- Minimum 3 occurrences

Implementation:
- Do NOT create background jobs.
- Detection runs dynamically when viewing dashboard or transactions.
- Mark transaction as:
    - recurring_suggestion: true/false

Database:
- Add optional boolean field:
    - is_recurring (default false, user-confirmable)
- Add:
    - recurring_pattern_id (nullable)

Behavior:
- Show label: “Recurring Suggestion”
- User can confirm recurring status.
- No AI.

---------------------------------------------------
FEATURE 3: Multi-Currency Support
---------------------------------------------------

Goal:
Support transactions in different currencies.

Database:
- Transactions already store currency.
- Add to User:
    - base_currency (default MYR)

Behavior:
- Dashboard totals convert to base_currency.
- Use a simple exchange rate API or mocked exchange rate service.
- Store exchange rate at time of calculation (optional improvement).
- Do NOT implement complex forex history tracking.

UI:
- Display:
    - Original amount + currency
    - Converted amount (base currency)
- Clear formatting.

---------------------------------------------------
FEATURE 4: Month-to-Month Comparison
---------------------------------------------------

Goal:
Compare current month spending to previous month.

Behavior:
- On dashboard:
    - Show total spending this month
    - Show total spending previous month
    - Show % difference
- Also show comparison per category.
- Highlight:
    - Increase (red)
    - Decrease (green)

Formula:
((current - previous) / previous) * 100

Edge cases:
- If previous month = 0:
    - Do not divide by zero.
    - Show “No previous data”.

---------------------------------------------------
GENERAL RULES
---------------------------------------------------

- Keep architecture clean.
- Do NOT refactor existing confirmed_category logic.
- Do NOT modify review & confirmation flow.
- Do NOT auto-save recurring detection.
- Respect NON_GOALS.md.

Deliver:
1. Updated database schema (SQL for Supabase)
2. Updated types/interfaces
3. Backend logic additions
4. New UI components (Tailwind)
5. Updated dashboard calculations
6. Clear separation of concerns
7. Comments explaining logic

Make changes incrementally and explain what files are created or modified.

---------------------------------------------------
FEATURE 5: Tag System
---------------------------------------------------

Goal: Allow users to assign multiple user-defined tags to transactions (optional, many-to-many); tags do not replace categories.

Requirements: Tag CRUD (create, rename, delete) per user; assign tags during review and when editing a transaction; multi-select + quick-add inline; filter transactions by one or multiple tags, combinable with category/date.

Database: tags (id, user_id, name, created_at); transaction_tags (transaction_id, tag_id). Tags per user; delete tag removes associations only.

UI: Tag management (create/rename/delete); multi-select and inline add in review and transaction edit; tag filters alongside existing filters.

Constraints: Do not replace confirmed_category logic.

---------------------------------------------------
FEATURE 6: Search + Smart Filters
---------------------------------------------------

Goal: Fast, intuitive search and advanced filtering for transactions.

Search: By merchant/description (partial, case-insensitive), amount (exact), currency; partial keyword matching.

Advanced filters: Date range, category, tag(s), amount range (min/max), recurring status, currency, source file; combinable; collapsible panel, clear button, visible filter state.

Performance: Optimized queries, use indexed fields (user_id, date, category, description); no full table scans. Out of scope: Elasticsearch, fuzzy search, AI search.

UI: Tailwind; collapsible filter panel, clear filters, filter state visible.

---------------------------------------------------
FEATURE 7: File to Transaction Link View
---------------------------------------------------

Goal: Let users see the original uploaded file linked to a transaction for transparency.

Behavior: On transaction view, show transaction details and linked source file when file_id exists; "View Original File" button; open preview (modal or new tab); if no file (manual entry), show "Manual Entry" indicator.

File preview: PDF embedded, image inline, DOCX download or preview; authenticated, signed URLs (Supabase); user may only access own files.

Data: No new schema; use existing transaction.file_id; enforce file ownership before preview. Optional later: highlight extracted text in preview.

---------------------------------------------------
FEATURE 8: AI Insights Layer
---------------------------------------------------

Goal: Provide AI-generated insights from confirmed transactions to help users understand spending. AI is strictly read-only: analyze data, generate summaries and recommendations; never modify or auto-save.

Requirements:
- In scope: Monthly spending summaries, category-based insights, spending trend explanations, simple recommendations, natural language summaries.
- Out of scope: Automatic budget/transaction edits, auto-tagging, investment/tax/legal advice, predictive forecasting, AI-based categorization.

Core insight types: Monthly summary (total, top category, largest transaction, vs previous month); category breakdown (dominant, grew/shrunk); spending patterns (frequent small vs large one-off); budget-aware (near limit 80%+, exceeded) when budgets exist.

Triggering: On dashboard load (monthly view), when user selects month, or when user clicks "Generate Insights". No automatic background processing.

Data input to AI:
- Allowed: Confirmed transactions (aggregated), selected time range, user base currency, budget data if applicable.
- Not allowed: Suggested categories, raw OCR text, unconfirmed transactions.

Architecture: Data aggregation → structured JSON → AI service → presentation. AI receives only pre-calculated JSON; never accesses DB. Presentation displays insights and allows refresh; no auto-save. AI must never write to DB, modify transactions, or override categories.

Example I/O:
- Input: `{ "month": "2026-03", "total_spending": 2450, "currency": "MYR", "category_breakdown": { "Food": 820, "Transport": 450, ... }, "previous_month_total": 2100, "budget_status": { "Food": { "budget": 900, "spent": 820 }, ... } }`
- Output: `{ "summary": "...", "highlights": ["...", ...], "warnings": ["...", ...] }`

UI: Add "AI Insights" section on dashboard; summary paragraph, bullet highlights, warnings, refresh button; optional loading indicator and "Last generated" timestamp. Clean card, Tailwind, clearly labeled as AI-generated.

Safety and transparency: Label as AI-generated; disclaimer: "Insights are generated automatically and may not always be accurate." No investment, tax, or legal advice.

Performance: Insights generation under 3 seconds; no heavy background jobs; no long-term AI memory in V1.

Privacy: Send only data needed for insights; no PII; do not store AI responses unless user explicitly saves later.

Extensibility: Future may add personalized suggestions, cost-cutting tips, behavioral analysis, anomaly detection, conversational AI; all must keep read-only AI and no auto data mutation.