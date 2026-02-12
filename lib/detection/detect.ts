/**
 * Transaction detection from extracted text.
 * V1: regex + line-based heuristics; no AI.
 */

export type CandidateTransaction = {
  date: string; // YYYY-MM-DD
  amount: number;
  currency: string;
  description: string;
};

const DEFAULT_CURRENCY = "MYR";

// Amount: require currency (RM, MYR, $, USD) before the number so we don't match reference/account numbers
const AMOUNT_REGEX =
  /(?:RM|MYR|USD|\$)\s*([-]?\d{1,}(?:,\d{3})*(?:\.\d{2})?)/gi;

// Max digits (integer part) we treat as money; longer = likely reference/ID
const MAX_AMOUNT_DIGITS = 12;
const MAX_AMOUNT_VALUE = 99_999_999.99;

// Dates: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, DD Mon YYYY
const DATE_REGEX =
  /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})|(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})|(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{2,4})/gi;

const MONTH_NAMES: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

function todayISO(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function parseAmount(raw: string): number {
  const cleaned = raw.replace(/,/g, "").trim();
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
}

function inferCurrency(line: string): string {
  const u = line.toUpperCase();
  if (u.includes("USD") || u.includes("$")) return "USD";
  if (u.includes("RM") || u.includes("MYR")) return "MYR";
  return DEFAULT_CURRENCY;
}

function parseDateMatch(match: RegExpMatchArray): string | null {
  // DD/MM/YYYY or DD-MM-YYYY
  if (match[1] !== undefined) {
    const d = parseInt(match[1], 10);
    const m = parseInt(match[2], 10) - 1;
    let y = parseInt(match[3], 10);
    if (y < 100) y += 2000;
    const date = new Date(y, m, d);
    if (!Number.isNaN(date.getTime())) return date.toISOString().slice(0, 10);
  }
  // YYYY-MM-DD
  if (match[4] !== undefined) {
    const y = parseInt(match[4], 10);
    const m = parseInt(match[5], 10) - 1;
    const d = parseInt(match[6], 10);
    const date = new Date(y, m, d);
    if (!Number.isNaN(date.getTime())) return date.toISOString().slice(0, 10);
  }
  // DD Mon YYYY
  if (match[7] !== undefined) {
    const d = parseInt(match[7], 10);
    const mon = (match[8] || "").slice(0, 3).toLowerCase();
    const m = MONTH_NAMES[mon] ?? 0;
    let y = parseInt(match[9], 10);
    if (y < 100) y += 2000;
    const date = new Date(y, m, d);
    if (!Number.isNaN(date.getTime())) return date.toISOString().slice(0, 10);
  }
  return null;
}

/**
 * Detect candidate transactions from extracted text.
 * Returns array of candidates; may be empty. Uses safe defaults for missing/invalid fields.
 */
export function detectTransactions(text: string): CandidateTransaction[] {
  if (!text || typeof text !== "string") return [];

  const trimmed = text.trim();
  if (!trimmed.length) return [];

  const candidates: CandidateTransaction[] = [];
  const lines = trimmed.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  // Find all date mentions in the full text (for context)
  const dateMatches = [...trimmed.matchAll(new RegExp(DATE_REGEX.source, "gi"))];
  const datesFound = dateMatches
    .map((m) => parseDateMatch(m))
    .filter((d): d is string => d !== null);

  for (const line of lines) {
    const amountMatches = [...line.matchAll(new RegExp(AMOUNT_REGEX.source, "gi"))];
    for (const am of amountMatches) {
      const amountStr = (am[1] ?? "").trim();
      if (!amountStr) continue;
      const digitCount = amountStr.replace(/[^0-9]/g, "").length;
      if (digitCount > MAX_AMOUNT_DIGITS) continue;
      const amount = parseAmount(amountStr);
      if (amount < 0 || amount > MAX_AMOUNT_VALUE) continue;
      const currency = inferCurrency(line);
      const date = datesFound[0] ?? todayISO();
      const description = line
        .replace(new RegExp(AMOUNT_REGEX.source, "gi"), "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 500) || "Transaction";

      candidates.push({
        date,
        amount: Math.abs(amount),
        currency,
        description: description || "Transaction",
      });
    }
  }

  // If no amount-like lines found, return one default candidate so user can fill in
  if (candidates.length === 0) {
    candidates.push({
      date: todayISO(),
      amount: 0,
      currency: DEFAULT_CURRENCY,
      description: "Transaction",
    });
  }

  return candidates;
}
