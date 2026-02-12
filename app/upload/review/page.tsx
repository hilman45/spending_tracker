import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { detectTransactions } from "@/app/actions/detect";
import { ReviewForm } from "./ReviewForm";

type Props = { searchParams: Promise<{ fileId?: string }> };

function suggestCategory(
  description: string,
  categories: { name: string; keywords: string[] }[]
): string | null {
  const normalized = (description || "").toLowerCase();
  for (const cat of categories) {
    const hasMatch = (cat.keywords || []).some((kw) =>
      normalized.includes(String(kw).toLowerCase())
    );
    if (hasMatch) return cat.name;
  }
  return null;
}

export default async function ReviewPage({ searchParams }: Props) {
  const { fileId } = await searchParams;
  if (!fileId) {
    redirect("/upload");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: categoryRows } = await supabase
    .from("categories")
    .select("name, keywords")
    .order("name");
  const categories = (categoryRows ?? []).map((r) => ({
    name: r.name,
    keywords: (r.keywords ?? []) as string[],
  }));

  const result = await detectTransactions(fileId);

  if ("error" in result) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
              Spending Tracker
            </h1>
            <Link
              href="/upload"
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              Back to Upload
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-4xl px-4 py-8">
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-900/20">
            <p className="text-red-700 dark:text-red-400">{result.error}</p>
            <Link
              href="/upload"
              className="mt-3 inline-block text-sm font-medium text-red-600 dark:text-red-300"
            >
              Back to Upload
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            Review transactions
          </h1>
          <nav className="flex items-center gap-4">
            <Link
              href="/upload"
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              Upload
            </Link>
            <Link
              href="/dashboard"
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              Dashboard
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Document
          </p>
          <h2 className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {result.fileName}
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Review the detected transactions, fix any mistakes, then save.
          </p>
          <ReviewForm
            fileId={result.fileId}
            initialTransactions={result.transactions.map((t) => ({
              ...t,
              suggested_category: suggestCategory(t.description, categories),
            }))}
            categories={categories.map((c) => c.name)}
          />
        </div>
      </main>
    </div>
  );
}
