import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AppHeader } from "@/app/components/AppHeader";
import { getBudgets } from "@/app/actions/budgets";
import { AddBudgetForm } from "./AddBudgetForm";
import { BudgetList } from "./BudgetList";

type Props = {
  searchParams: Promise<{ month?: string; year?: string }>;
};

export default async function ManageBudgetsPage({ searchParams }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { month, year } = await searchParams;
  const filters =
    month != null && year != null
      ? { month: Number(month), year: Number(year) }
      : undefined;

  const [budgets, categoryRows] = await Promise.all([
    getBudgets(user.id, filters),
    supabase.from("categories").select("id, name").order("name"),
  ]);

  const categories = (categoryRows.data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
  }));

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <AppHeader user={user} activePage="budgets" />

      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-4 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            ← Dashboard
          </Link>
        </div>

        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
          Manage budgets
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Set a monthly budget per category. The dashboard shows spending vs
          budget for the current month.
        </p>

        <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Add budget
          </h3>
          <AddBudgetForm categories={categories} />
        </div>

        <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Your budgets
          </h3>
          {budgets.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
              No budgets yet. Add one above.
            </p>
          ) : (
            <BudgetList budgets={budgets} />
          )}
        </div>
      </main>
    </div>
  );
}
