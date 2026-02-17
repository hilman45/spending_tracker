import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AppHeader } from "@/app/components/AppHeader";
import { DashboardFilters } from "./DashboardFilters";
import { DashboardCharts } from "./DashboardCharts";
import { getBudgetsForMonth, getSpentByCategoryForMonth } from "@/app/actions/budgets";
import { attachRecurringSuggestions } from "@/lib/recurring/detect";

type Props = {
  searchParams: Promise<{ dateFrom?: string; dateTo?: string; category?: string }>;
};

export default async function DashboardPage({ searchParams }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { dateFrom, dateTo, category } = await searchParams;

  let query = supabase
    .from("transactions")
    .select("id, date, amount, currency, description, confirmed_category, is_recurring, recurring_pattern_id")
    .eq("user_id", user.id);

  if (dateFrom) query = query.gte("date", dateFrom);
  if (dateTo) query = query.lte("date", dateTo);
  if (category) query = query.eq("confirmed_category", category);

  const { data: txRows } = await query.order("date", { ascending: false });

  const transactions = (txRows ?? []).map((r) => ({
    id: r.id,
    date: r.date,
    amount: Number(r.amount),
    currency: r.currency ?? "MYR",
    description: r.description ?? "",
    confirmed_category: r.confirmed_category ?? "Other",
    is_recurring: r.is_recurring ?? false,
    recurring_pattern_id: r.recurring_pattern_id ?? null,
  }));

  // Recurring detection runs dynamically (no DB write); attach suggestion flag per transaction
  const transactionsWithRecurring = attachRecurringSuggestions(transactions);

  const total = transactions.reduce((sum, r) => sum + r.amount, 0);

  const byCategory: { category: string; total: number }[] = [];
  const categorySums = new Map<string, number>();
  for (const t of transactions) {
    const cat = t.confirmed_category;
    categorySums.set(cat, (categorySums.get(cat) ?? 0) + t.amount);
  }
  categorySums.forEach((total, category) => {
    byCategory.push({ category, total });
  });
  byCategory.sort((a, b) => b.total - a.total);

  const monthSums = new Map<string, number>();
  for (const t of transactions) {
    const month = String(t.date).slice(0, 7);
    monthSums.set(month, (monthSums.get(month) ?? 0) + t.amount);
  }
  const byMonth: { month: string; total: number }[] = Array.from(monthSums.entries())
    .map(([month, total]) => ({ month, total }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const recent = transactionsWithRecurring.slice(0, 5);

  const { data: categoryRows } = await supabase
    .from("categories")
    .select("name")
    .order("name");
  const categories = (categoryRows ?? []).map((r) => r.name);

  // Budget tracking: current month by default
  const now = new Date();
  const budgetMonth = now.getMonth() + 1;
  const budgetYear = now.getFullYear();
  const [budgets, spentByCategory] = await Promise.all([
    getBudgetsForMonth(user.id, budgetMonth, budgetYear),
    getSpentByCategoryForMonth(user.id, budgetMonth, budgetYear),
  ]);
  const budgetRows = budgets.map((b) => {
    const spent = spentByCategory[b.category_name] ?? 0;
    const remaining = b.amount - spent;
    const percentUsed = b.amount > 0 ? (spent / b.amount) * 100 : 0;
    const isOverBudget = spent > b.amount;
    return {
      ...b,
      spent,
      remaining,
      percentUsed,
      isOverBudget,
    };
  });
  const monthLabel = new Date(budgetYear, budgetMonth - 1).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <AppHeader user={user} activePage="dashboard" />

      <main className="mx-auto max-w-7xl px-4 py-6">
        <DashboardFilters
          dateFrom={dateFrom}
          dateTo={dateTo}
          category={category}
          categories={categories}
        />

        <div className="mt-6 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
              Dashboard
            </h2>
            <p className="mt-1 text-3xl font-bold text-primary">
              {total.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              MYR
            </p>
            {((dateFrom ?? dateTo ?? category) && transactions.length > 0) && (
              <span className="mt-1 block text-sm text-zinc-500 dark:text-zinc-500">
                (filtered)
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/transactions"
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
              View all transactions
            </Link>
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Upload files
            </Link>
            <a
              href={`/api/export?${new URLSearchParams({
                ...(dateFrom && { dateFrom }),
                ...(dateTo && { dateTo }),
                ...(category && { category }),
              }).toString()}`}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
              download
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export CSV
            </a>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Monthly budgets — {monthLabel}
            </h3>
            <Link
              href="/dashboard/budgets"
              className="text-sm font-medium text-primary hover:underline"
            >
              Manage budgets
            </Link>
          </div>
          {budgetRows.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
              No budgets set for this month.{" "}
              <Link href="/dashboard/budgets" className="text-primary hover:underline">
                Add one
              </Link>
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[400px] text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-700">
                    <th className="pb-2 text-left font-medium text-zinc-600 dark:text-zinc-400">
                      Category
                    </th>
                    <th className="pb-2 text-right font-medium text-zinc-600 dark:text-zinc-400">
                      Budget
                    </th>
                    <th className="pb-2 text-right font-medium text-zinc-600 dark:text-zinc-400">
                      Spent
                    </th>
                    <th className="pb-2 text-right font-medium text-zinc-600 dark:text-zinc-400">
                      Remaining
                    </th>
                    <th className="pb-2 text-right font-medium text-zinc-600 dark:text-zinc-400">
                      % used
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {budgetRows.map((row) => (
                    <tr
                      key={row.id}
                      className={
                        row.isOverBudget
                          ? "bg-red-50 dark:bg-red-950/30"
                          : undefined
                      }
                    >
                      <td className="py-2 font-medium text-zinc-900 dark:text-zinc-50">
                        {row.category_name}
                      </td>
                      <td className="py-2 text-right text-zinc-700 dark:text-zinc-300">
                        {row.amount.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        MYR
                      </td>
                      <td className="py-2 text-right text-zinc-700 dark:text-zinc-300">
                        {row.spent.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        MYR
                      </td>
                      <td className="py-2 text-right">
                        <span
                          className={
                            row.remaining < 0
                              ? "font-medium text-red-600 dark:text-red-400"
                              : "text-zinc-700 dark:text-zinc-300"
                          }
                        >
                          {row.remaining.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{" "}
                          MYR
                        </span>
                      </td>
                      <td className="py-2 text-right">
                        {row.isOverBudget ? (
                          <span className="font-medium text-red-600 dark:text-red-400">
                            {row.percentUsed.toFixed(0)}% (over budget)
                          </span>
                        ) : (
                          <span className="text-zinc-700 dark:text-zinc-300">
                            {row.percentUsed.toFixed(0)}%
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {(byCategory.length > 0 || byMonth.length > 0) && (
          <DashboardCharts byCategory={byCategory} byMonth={byMonth} />
        )}

        {recent.length > 0 && (
          <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="mb-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Recent transactions
            </h3>
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {recent.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-zinc-500 dark:text-zinc-400 font-mono">
                      {t.date}
                    </span>
                    <span className="text-zinc-300 dark:text-zinc-700">·</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-50">
                      {t.description || "Untitled"}
                    </span>
                    <span className="hidden text-xs text-zinc-400 sm:inline-block">
                      ({t.confirmed_category})
                    </span>
                    {t.is_recurring && (
                      <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary dark:bg-primary/20">
                        Recurring
                      </span>
                    )}
                    {!t.is_recurring && t.recurring_suggestion && (
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                        Recurring Suggestion
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-zinc-900 dark:text-zinc-50 whitespace-nowrap">
                    {t.amount.toFixed(2)} {t.currency}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
