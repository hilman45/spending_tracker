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
