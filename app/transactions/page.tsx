import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AppHeader } from "@/app/components/AppHeader";
import { TransactionList } from "./TransactionList";
import { TransactionFilters } from "./TransactionFilters";
import { attachRecurringSuggestions } from "@/lib/recurring/detect";

type Props = {
  searchParams: Promise<{ dateFrom?: string; dateTo?: string; category?: string }>;
};

export default async function TransactionsPage({ searchParams }: Props) {
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
    .select("id, date, amount, currency, description, confirmed_category, file_id, created_at, is_recurring, recurring_pattern_id, files(name)")
    .eq("user_id", user.id);

  if (dateFrom) query = query.gte("date", dateFrom);
  if (dateTo) query = query.lte("date", dateTo);
  if (category) query = query.eq("confirmed_category", category);

  const { data: rows } = await query.order("date", { ascending: false });

  const { data: categoryRows } = await supabase
    .from("categories")
    .select("name")
    .order("name");
  const categories = (categoryRows ?? []).map((r) => r.name);

  const transactionsRaw = (rows ?? []).map((r) => {
    const files = r.files as { name: string }[] | { name: string } | null | undefined;
    const fileObj = Array.isArray(files) ? files[0] : files;
    return {
      id: r.id,
      date: r.date,
      amount: Number(r.amount),
      currency: r.currency ?? "MYR",
      description: r.description ?? "",
      confirmed_category: r.confirmed_category ?? "Other",
      file_id: r.file_id ?? null,
      file_name: fileObj?.name ?? null,
      is_recurring: r.is_recurring ?? false,
      recurring_pattern_id: r.recurring_pattern_id ?? null,
    };
  });

  // Recurring detection runs dynamically; attach recurring_suggestion per transaction
  const transactions = attachRecurringSuggestions(transactionsRaw);

  const total = transactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <AppHeader user={user} activePage="transactions" />

      <main className="mx-auto max-w-4xl px-4 py-8">
        <TransactionFilters
          dateFrom={dateFrom}
          dateTo={dateTo}
          category={category}
          categories={categories}
        />
        <div className="mb-6 mt-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {dateFrom || dateTo || category ? "Filtered transactions" : "All transactions"}
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Total: <strong>{total.toFixed(2)} MYR</strong>
          </p>
        </div>

        {transactions.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-zinc-600 dark:text-zinc-400">
              No transactions yet. Upload a document, extract text, then review and save.
            </p>
            <Link
              href="/upload"
              className="mt-4 inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Go to Upload
            </Link>
          </div>
        ) : (
          <TransactionList transactions={transactions} />
        )}
      </main>
    </div>
  );
}
