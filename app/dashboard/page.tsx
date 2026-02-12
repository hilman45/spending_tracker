import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import { DashboardFilters } from "./DashboardFilters";
import { DashboardCharts } from "./DashboardCharts";

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
    .select("id, date, amount, currency, description, confirmed_category")
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
  }));

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

  const recent = transactions.slice(0, 5);

  const { data: categoryRows } = await supabase
    .from("categories")
    .select("name")
    .order("name");
  const categories = (categoryRows ?? []).map((r) => r.name);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            Spending Tracker
          </h1>
          <nav className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-zinc-900 dark:text-zinc-50"
            >
              Dashboard
            </Link>
            <Link
              href="/upload"
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              Upload
            </Link>
            <Link
              href="/transactions"
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              Transactions
            </Link>
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              {user.email}
            </span>
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Sign out
              </button>
            </form>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <DashboardFilters
          dateFrom={dateFrom}
          dateTo={dateTo}
          category={category}
          categories={categories}
        />
        <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Dashboard
          </h2>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Total spending: <strong>{total.toFixed(2)} MYR</strong>
            {((dateFrom ?? dateTo ?? category) && transactions.length > 0) && (
              <span className="ml-1 text-zinc-500 dark:text-zinc-500">
                (filtered)
              </span>
            )}
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <Link
              href="/transactions"
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              View all transactions
            </Link>
            <Link
              href="/upload"
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Upload files
            </Link>
            <a
              href={`/api/export?${new URLSearchParams({
                ...(dateFrom && { dateFrom }),
                ...(dateTo && { dateTo }),
                ...(category && { category }),
              }).toString()}`}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
              download
            >
              Export to CSV
            </a>
          </div>

          {(byCategory.length > 0 || byMonth.length > 0) && (
            <DashboardCharts byCategory={byCategory} byMonth={byMonth} />
          )}

          {recent.length > 0 && (
            <div className="mt-8">
              <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Recent transactions
              </h3>
              <ul className="mt-2 space-y-1">
                {recent.map((t) => (
                  <li
                    key={t.id}
                    className="flex justify-between text-sm text-zinc-600 dark:text-zinc-400"
                  >
                    <span>
                      {t.date} · {t.description || "—"}
                    </span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-50">
                      {t.amount.toFixed(2)} {t.currency}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
