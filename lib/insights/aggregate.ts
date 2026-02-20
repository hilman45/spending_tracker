"use server";

import { createClient } from "@/lib/supabase/server";
import { getBudgetsForMonth, getSpentByCategoryForMonth } from "@/app/actions/budgets";
import type { InsightPayload } from "./types";

/**
 * First and last day of month (YYYY-MM-DD) for "YYYY-MM".
 */
function monthRange(monthStr: string): { from: string; to: string } {
  const [y, m] = monthStr.split("-").map(Number);
  if (!y || !m || m < 1 || m > 12) {
    throw new Error("Invalid month format; use YYYY-MM");
  }
  const from = `${y}-${String(m).padStart(2, "0")}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const to = `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { from, to };
}

/**
 * Previous month string (YYYY-MM).
 */
function previousMonth(monthStr: string): string {
  const [y, m] = monthStr.split("-").map(Number);
  if (m === 1) return `${y - 1}-12`;
  return `${y}-${String(m - 1).padStart(2, "0")}`;
}

/**
 * Build the structured payload for the AI from confirmed transactions and budgets.
 * Uses only confirmed_category and stored amounts; no suggested categories or OCR.
 */
export async function aggregateInsightData(
  userId: string,
  month: string,
  baseCurrency: string
): Promise<InsightPayload> {
  const supabase = await createClient();
  const { from, to } = monthRange(month);
  const prev = previousMonth(month);
  const { from: prevFrom, to: prevTo } = monthRange(prev);

  // Confirmed transactions for selected month and previous month
  const { data: currentRows } = await supabase
    .from("transactions")
    .select("amount, confirmed_category")
    .eq("user_id", userId)
    .gte("date", from)
    .lte("date", to);

  const { data: prevRows } = await supabase
    .from("transactions")
    .select("amount, confirmed_category")
    .eq("user_id", userId)
    .gte("date", prevFrom)
    .lte("date", prevTo);

  const categoryBreakdown: Record<string, number> = {};
  let totalSpending = 0;
  for (const r of currentRows ?? []) {
    const amt = Number(r.amount);
    const cat = r.confirmed_category ?? "Other";
    categoryBreakdown[cat] = (categoryBreakdown[cat] ?? 0) + amt;
    totalSpending += amt;
  }

  let previousMonthTotal = 0;
  for (const r of prevRows ?? []) {
    previousMonthTotal += Number(r.amount);
  }

  // Budget status for the selected month (month/year from "YYYY-MM")
  const [y, m] = month.split("-").map(Number);
  const budgets = await getBudgetsForMonth(userId, m, y);
  const spentByCategory = await getSpentByCategoryForMonth(userId, m, y);

  const budget_status: Record<string, { budget: number; spent: number }> = {};
  for (const b of budgets) {
    const spent = spentByCategory[b.category_name] ?? 0;
    budget_status[b.category_name] = { budget: b.amount, spent };
  }

  const payload: InsightPayload = {
    month,
    total_spending: totalSpending,
    currency: baseCurrency,
    category_breakdown: categoryBreakdown,
    previous_month_total: previousMonthTotal,
  };
  if (Object.keys(budget_status).length > 0) {
    payload.budget_status = budget_status;
  }
  return payload;
}
