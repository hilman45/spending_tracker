import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AppHeader } from "@/app/components/AppHeader";
import { TransactionList } from "./TransactionList";
import { TransactionFilters } from "./TransactionFilters";
import { attachRecurringSuggestions } from "@/lib/recurring/detect";

type Props = {
  searchParams: Promise<{
    dateFrom?: string;
    dateTo?: string;
    category?: string;
    tag?: string | string[];
    search?: string;
    amountMin?: string;
    amountMax?: string;
    recurring?: string;
    currency?: string;
    fileId?: string;
  }>;
};

export default async function TransactionsPage({ searchParams }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const {
    dateFrom,
    dateTo,
    category,
    tag,
    search,
    amountMin,
    amountMax,
    recurring,
    currency,
    fileId,
  } = await searchParams;
  const tagIds = tag
    ? Array.isArray(tag)
      ? tag.filter(Boolean)
      : [tag].filter(Boolean)
    : [];

  let transactionIdsFilter: string[] | null = null;
  if (tagIds.length > 0) {
    const { data: linkRows } = await supabase
      .from("transaction_tags")
      .select("transaction_id")
      .in("tag_id", tagIds);
    transactionIdsFilter = [...new Set((linkRows ?? []).map((r) => r.transaction_id))];
    if (transactionIdsFilter.length === 0) {
      transactionIdsFilter = [""];
    }
  }

  let query = supabase
    .from("transactions")
    .select("id, date, amount, currency, description, confirmed_category, file_id, created_at, is_recurring, recurring_pattern_id, files(name)")
    .eq("user_id", user.id);

  if (dateFrom) query = query.gte("date", dateFrom);
  if (dateTo) query = query.lte("date", dateTo);
  if (category) query = query.eq("confirmed_category", category);
  if (transactionIdsFilter) query = query.in("id", transactionIdsFilter);

  if (search && search.trim()) {
    const term = search.trim().replace(/,/g, " ");
    const conditions: string[] = [
      `description.ilike.%${term}%`,
      `currency.eq.${term}`,
    ];
    const amountNum = parseFloat(search.trim());
    if (Number.isFinite(amountNum)) conditions.push(`amount.eq.${amountNum}`);
    const { data: matchingFiles } = await supabase
      .from("files")
      .select("id")
      .eq("user_id", user.id)
      .ilike("name", `%${term}%`);
    const matchingFileIds = (matchingFiles ?? []).map((f) => f.id);
    if (matchingFileIds.length > 0) {
      conditions.push(`file_id.in.(${matchingFileIds.join(",")})`);
    }
    query = query.or(conditions.join(","));
  }
  if (amountMin != null && amountMin !== "") {
    const n = parseFloat(amountMin);
    if (Number.isFinite(n)) query = query.gte("amount", n);
  }
  if (amountMax != null && amountMax !== "") {
    const n = parseFloat(amountMax);
    if (Number.isFinite(n)) query = query.lte("amount", n);
  }
  if (recurring === "yes") query = query.eq("is_recurring", true);
  if (recurring === "no") query = query.eq("is_recurring", false);
  if (currency && currency.trim()) query = query.eq("currency", currency.trim());
  if (fileId === "none" || fileId === "manual") query = query.is("file_id", null);
  else if (fileId && fileId.trim()) query = query.eq("file_id", fileId.trim());

  const { data: rows } = await query.order("date", { ascending: false });

  const { data: categoryRows } = await supabase
    .from("categories")
    .select("name")
    .order("name");
  const categories = (categoryRows ?? []).map((r) => r.name);

  const { data: tagRows } = await supabase
    .from("tags")
    .select("id, name")
    .eq("user_id", user.id)
    .order("name");
  const tags = (tagRows ?? []) as { id: string; name: string }[];

  const { data: fileRows } = await supabase
    .from("files")
    .select("id, name")
    .eq("user_id", user.id)
    .order("name", { ascending: true });
  const files = (fileRows ?? []) as { id: string; name: string }[];

  const { data: currencyRows } = await supabase
    .from("transactions")
    .select("currency")
    .eq("user_id", user.id);
  const currencies = [
    ...new Set(
      (currencyRows ?? []).map((r) => (r.currency || "MYR").trim()).filter(Boolean)
    ),
  ].sort();
  if (!currencies.includes("MYR")) currencies.unshift("MYR");

  const transactionIds = (rows ?? []).map((r) => r.id);
  const tagsByTransactionId: Record<string, { id: string; name: string }[]> = {};
  if (transactionIds.length > 0) {
    const { data: linkRows } = await supabase
      .from("transaction_tags")
      .select("transaction_id, tag_id")
      .in("transaction_id", transactionIds);
    const tagIdsFromLinks = [...new Set((linkRows ?? []).map((r) => r.tag_id))];
    let tagMap: Record<string, { id: string; name: string }> = {};
    if (tagIdsFromLinks.length > 0) {
      const { data: tagRows } = await supabase
        .from("tags")
        .select("id, name")
        .in("id", tagIdsFromLinks);
      tagMap = Object.fromEntries((tagRows ?? []).map((t) => [t.id, { id: t.id, name: t.name }]));
    }
    for (const l of linkRows ?? []) {
      const tag = tagMap[l.tag_id];
      if (tag) {
        if (!tagsByTransactionId[l.transaction_id]) tagsByTransactionId[l.transaction_id] = [];
        tagsByTransactionId[l.transaction_id].push(tag);
      }
    }
  }

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
      tags: tagsByTransactionId[r.id] ?? [],
    };
  });

  // Recurring detection runs dynamically; attach recurring_suggestion per transaction
  const transactions = attachRecurringSuggestions(transactionsRaw);

  const total = transactions.reduce((sum, t) => sum + t.amount, 0);
  const hasFilters =
    !!dateFrom ||
    !!dateTo ||
    !!category ||
    tagIds.length > 0 ||
    !!(search && search.trim()) ||
    (amountMin != null && amountMin !== "") ||
    (amountMax != null && amountMax !== "") ||
    !!recurring ||
    !!currency ||
    !!fileId;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <AppHeader user={user} activePage="transactions" />

      <main className="mx-auto max-w-4xl px-4 py-8">
        <TransactionFilters
          dateFrom={dateFrom}
          dateTo={dateTo}
          category={category}
          categories={categories}
          tags={tags}
          selectedTagIds={tagIds}
          search={search}
          amountMin={amountMin}
          amountMax={amountMax}
          recurring={recurring}
          currency={currency}
          fileId={fileId}
          files={files}
          currencies={currencies}
        />
        <div className="mb-6 mt-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {hasFilters ? "Filtered transactions" : "All transactions"}
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
          <TransactionList transactions={transactions} allTags={tags} />
        )}
      </main>
    </div>
  );
}
