/**
 * Recurring expense detection (rule-based, in-memory only; no DB writes).
 * Rules: same merchant/description, similar amount (±5%), regular interval (weekly or monthly), minimum 3 occurrences.
 */

export type TransactionForDetection = {
  id: string;
  date: string;
  amount: number;
  description: string | null;
};

const AMOUNT_TOLERANCE = 0.05; // ±5%
const WEEKLY_DAYS_MIN = 5;
const WEEKLY_DAYS_MAX = 9;
const MONTHLY_DAYS_MIN = 27;
const MONTHLY_DAYS_MAX = 34;
const MIN_OCCURRENCES = 3;

/** Normalize description for grouping: trim, lowercase, collapse spaces. Empty becomes "" (we skip empty groups). */
function normalizeDescription(description: string | null | undefined): string {
  if (description == null) return "";
  return String(description).trim().toLowerCase().replace(/\s+/g, " ");
}

/** Check if amount is within ±5% of reference. */
function amountWithinTolerance(amount: number, ref: number): boolean {
  if (ref <= 0) return amount === ref;
  const ratio = Math.abs(amount - ref) / ref;
  return ratio <= AMOUNT_TOLERANCE;
}

/** Parse date string (YYYY-MM-DD) to days since epoch for gap math. */
function dateToDays(dateStr: string): number {
  const d = new Date(dateStr);
  return Math.floor(d.getTime() / (24 * 60 * 60 * 1000));
}

/**
 * Check if sorted dates have roughly regular gaps: either weekly (≈7 days) or monthly (≈28–31 days).
 * Returns 'weekly' | 'monthly' | null. Uses mean gap and tolerances: weekly ±2 days, monthly ±3 days.
 */
function detectInterval(sortedDates: string[]): "weekly" | "monthly" | null {
  if (sortedDates.length < 2) return null;
  const days = sortedDates.map(dateToDays);
  const gaps: number[] = [];
  for (let i = 1; i < days.length; i++) {
    gaps.push(days[i]! - days[i - 1]!);
  }
  const meanGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  if (meanGap >= WEEKLY_DAYS_MIN && meanGap <= WEEKLY_DAYS_MAX) return "weekly";
  if (meanGap >= MONTHLY_DAYS_MIN && meanGap <= MONTHLY_DAYS_MAX) return "monthly";
  return null;
}

/**
 * Returns a Set of transaction IDs that are part of at least one recurring group.
 * Group rules: same normalized description, ≥3 items, amounts within ±5% of median, regular weekly or monthly interval.
 */
export function detectRecurringTransactionIds(
  transactions: TransactionForDetection[]
): Set<string> {
  const recurringIds = new Set<string>();

  // Group by normalized description. Skip empty description to avoid lumping unrelated items.
  const byDesc = new Map<string, TransactionForDetection[]>();
  for (const t of transactions) {
    const key = normalizeDescription(t.description);
    if (key === "") continue;
    const list = byDesc.get(key) ?? [];
    list.push(t);
    byDesc.set(key, list);
  }

  for (const [, group] of byDesc) {
    if (group.length < MIN_OCCURRENCES) continue;

    // Sort by date
    const sorted = [...group].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Amount check: all within ±5% of median
    const amounts = sorted.map((t) => t.amount);
    const mid = Math.floor(amounts.length / 2);
    const median =
      amounts.length % 2 === 1
        ? amounts[mid]!
        : (amounts[mid - 1]! + amounts[mid]!) / 2;
    const allWithinAmount = sorted.every((t) =>
      amountWithinTolerance(t.amount, median)
    );
    if (!allWithinAmount) continue;

    // Interval check: gaps must be roughly weekly or monthly
    const interval = detectInterval(sorted.map((t) => t.date));
    if (interval === null) continue;

    // All rules pass: mark every transaction in this group as recurring suggestion
    for (const t of sorted) {
      recurringIds.add(t.id);
    }
  }

  return recurringIds;
}

/**
 * Attach recurring_suggestion to each transaction. Does not mutate; returns new array with added field.
 */
export function attachRecurringSuggestions<T extends TransactionForDetection>(
  transactions: T[]
): (T & { recurring_suggestion: boolean })[] {
  const recurringIds = detectRecurringTransactionIds(transactions);
  return transactions.map((t) => ({
    ...t,
    recurring_suggestion: recurringIds.has(t.id),
  }));
}
