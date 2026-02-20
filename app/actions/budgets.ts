"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { BudgetWithCategory } from "@/lib/types/budget";

/** First and last day of month (YYYY-MM-DD) for a given month/year */
function monthRange(month: number, year: number): { from: string; to: string } {
  const from = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const to = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { from, to };
}

/**
 * Fetch budgets for a given month/year with category name (join categories).
 * Used by dashboard and manage-budgets page.
 */
export async function getBudgetsForMonth(
  userId: string,
  month: number,
  year: number
): Promise<BudgetWithCategory[]> {
  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("budgets")
    .select(
      "id, user_id, category_id, month, year, amount, created_at, categories(name)"
    )
    .eq("user_id", userId)
    .eq("month", month)
    .eq("year", year)
    .order("created_at", { ascending: true });

  if (error) return [];
  type BudgetRow = {
    id: string;
    user_id: string;
    category_id: string;
    month: number;
    year: number;
    amount: number;
    created_at: string;
    categories: { name: string } | null;
  };
  const list = (rows as unknown) as BudgetRow[] | null;
  return (list ?? []).map((r) => ({
    id: r.id,
    user_id: r.user_id,
    category_id: r.category_id,
    month: r.month,
    year: r.year,
    amount: Number(r.amount),
    created_at: r.created_at,
    category_name: r.categories?.name ?? "Other",
  }));
}

/**
 * Fetch all budgets for the user with category name, optionally filtered by month/year.
 * Used by Manage Budgets page.
 */
export async function getBudgets(
  userId: string,
  filters?: { month?: number; year?: number }
): Promise<BudgetWithCategory[]> {
  const supabase = await createClient();
  let query = supabase
    .from("budgets")
    .select(
      "id, user_id, category_id, month, year, amount, created_at, categories(name)"
    )
    .eq("user_id", userId)
    .order("year", { ascending: false })
    .order("month", { ascending: false })
    .order("created_at", { ascending: true });

  if (filters?.month != null) query = query.eq("month", filters.month);
  if (filters?.year != null) query = query.eq("year", filters.year);

  const { data: rows, error } = await query;
  if (error) return [];
  type BudgetRow = {
    id: string;
    user_id: string;
    category_id: string;
    month: number;
    year: number;
    amount: number;
    created_at: string;
    categories: { name: string } | null;
  };
  const list = (rows as unknown) as BudgetRow[] | null;
  return (list ?? []).map((r) => ({
    id: r.id,
    user_id: r.user_id,
    category_id: r.category_id,
    month: r.month,
    year: r.year,
    amount: Number(r.amount),
    created_at: r.created_at,
    category_name: r.categories?.name ?? "Other",
  }));
}

/**
 * Total spent per category (by name) for a given month/year.
 * Maps confirmed_category -> sum(amount). Used to compute "spent" per budget.
 */
export async function getSpentByCategoryForMonth(
  userId: string,
  month: number,
  year: number
): Promise<Record<string, number>> {
  const supabase = await createClient();
  const { from, to } = monthRange(month, year);
  const { data: rows, error } = await supabase
    .from("transactions")
    .select("confirmed_category, amount")
    .eq("user_id", userId)
    .gte("date", from)
    .lte("date", to);

  if (error) return {};
  const map: Record<string, number> = {};
  for (const r of rows ?? []) {
    const cat = r.confirmed_category ?? "Other";
    map[cat] = (map[cat] ?? 0) + Number(r.amount);
  }
  return map;
}

/** Form-based create: reads category_id, month, year, amount from FormData. */
export async function createBudgetFromForm(formData: FormData) {
  const category_id = formData.get("category_id") as string | null;
  const month = formData.get("month");
  const year = formData.get("year");
  const amount = formData.get("amount");
  if (!category_id?.trim()) return { error: "Select a category" };
  return createBudget(
    category_id.trim(),
    Number(month) || new Date().getMonth() + 1,
    Number(year) || new Date().getFullYear(),
    Number(amount) || 0
  );
}

/** Create a budget for the current user. Enforces unique (user, category, month, year) at DB. */
export async function createBudget(
  category_id: string,
  month: number,
  year: number,
  amount: number
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const m = Math.floor(Number(month));
  const y = Math.floor(Number(year));
  if (m < 1 || m > 12 || y < 2000 || y > 2100) {
    return { error: "Invalid month or year" };
  }
  const amt = Number(amount);
  if (amt < 0 || !Number.isFinite(amt)) return { error: "Invalid amount" };

  const { error } = await supabase.from("budgets").insert({
    user_id: user.id,
    category_id,
    month: m,
    year: y,
    amount: amt,
  });

  if (error) {
    if (error.code === "23505") return { error: "A budget for this category and month already exists." };
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/budgets");
  return { success: true };
}

/** Update budget amount (and optionally month, year, category_id). */
export async function updateBudget(
  id: string,
  data: { amount?: number; month?: number; year?: number; category_id?: string }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const payload: Record<string, unknown> = {};
  if (data.amount != null) {
    const amt = Number(data.amount);
    if (amt < 0 || !Number.isFinite(amt)) return { error: "Invalid amount" };
    payload.amount = amt;
  }
  if (data.month != null) {
    const m = Math.floor(Number(data.month));
    if (m < 1 || m > 12) return { error: "Invalid month" };
    payload.month = m;
  }
  if (data.year != null) {
    const y = Math.floor(Number(data.year));
    if (y < 2000 || y > 2100) return { error: "Invalid year" };
    payload.year = y;
  }
  if (data.category_id != null) payload.category_id = data.category_id;

  if (Object.keys(payload).length === 0) return { error: "No fields to update" };

  const { error } = await supabase
    .from("budgets")
    .update(payload)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/budgets");
  return { success: true };
}

/** Delete a budget by id for the current user. */
export async function deleteBudget(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("budgets")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/budgets");
  return { success: true };
}
