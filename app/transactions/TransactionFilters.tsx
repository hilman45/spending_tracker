"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type TagOption = { id: string; name: string };
type FileOption = { id: string; name: string };

type Props = {
  dateFrom?: string;
  dateTo?: string;
  category?: string;
  categories: string[];
  tags: TagOption[];
  selectedTagIds: string[];
  search?: string;
  amountMin?: string;
  amountMax?: string;
  recurring?: string;
  currency?: string;
  fileId?: string;
  files: FileOption[];
  currencies: string[];
};

export function TransactionFilters({
  dateFrom,
  dateTo,
  category,
  categories,
  tags,
  selectedTagIds,
  search,
  amountMin,
  amountMax,
  recurring,
  currency,
  fileId,
  files,
  currencies,
}: Props) {
  const router = useRouter();
  const [tagIds, setTagIds] = useState<string[]>(selectedTagIds);
  const hasInitialFilters =
    !!dateFrom ||
    !!dateTo ||
    !!category ||
    selectedTagIds.length > 0 ||
    !!(search && search.trim()) ||
    (amountMin != null && amountMin !== "") ||
    (amountMax != null && amountMax !== "") ||
    !!recurring ||
    !!currency ||
    !!fileId;
  const [filtersOpen, setFiltersOpen] = useState(hasInitialFilters);
  const selectedTagIdsKey = selectedTagIds.join(",");
  useEffect(() => {
    queueMicrotask(() => setTagIds(selectedTagIds));
  }, [selectedTagIdsKey, selectedTagIds]);

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

  const applyFilters = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;
      const fd = new FormData(form);
      const params = new URLSearchParams();
      const dateFromVal = (fd.get("dateFrom") as string | null)?.trim();
      const dateToVal = (fd.get("dateTo") as string | null)?.trim();
      const categoryVal = (fd.get("category") as string | null)?.trim();
      const searchVal = (fd.get("search") as string | null)?.trim();
      const amountMinVal = (fd.get("amountMin") as string | null)?.trim();
      const amountMaxVal = (fd.get("amountMax") as string | null)?.trim();
      const recurringVal = (fd.get("recurring") as string | null)?.trim();
      const currencyVal = (fd.get("currency") as string | null)?.trim();
      const fileIdVal = (fd.get("fileId") as string | null)?.trim();
      if (dateFromVal) params.set("dateFrom", dateFromVal);
      if (dateToVal) params.set("dateTo", dateToVal);
      if (categoryVal) params.set("category", categoryVal);
      if (searchVal) params.set("search", searchVal);
      if (amountMinVal) params.set("amountMin", amountMinVal);
      if (amountMaxVal) params.set("amountMax", amountMaxVal);
      if (recurringVal) params.set("recurring", recurringVal);
      if (currencyVal) params.set("currency", currencyVal);
      if (fileIdVal) params.set("fileId", fileIdVal);
      tagIds.forEach((id) => params.append("tag", id));
      router.push(`/transactions?${params.toString()}`);
    },
    [router, tagIds]
  );

  const toggleTag = (id: string) => {
    setTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const activeChips: { label: string; key: string }[] = [];
  if (search?.trim()) activeChips.push({ label: `Search: "${search.trim()}"`, key: "search" });
  if (dateFrom) activeChips.push({ label: `From ${dateFrom}`, key: "dateFrom" });
  if (dateTo) activeChips.push({ label: `To ${dateTo}`, key: "dateTo" });
  if (category) activeChips.push({ label: category, key: "category" });
  tagIds.forEach((id) => {
    const t = tags.find((x) => x.id === id);
    if (t) activeChips.push({ label: t.name, key: `tag-${id}` });
  });
  if (amountMin != null && amountMin !== "") activeChips.push({ label: `Min ${amountMin}`, key: "amountMin" });
  if (amountMax != null && amountMax !== "") activeChips.push({ label: `Max ${amountMax}`, key: "amountMax" });
  if (recurring === "yes") activeChips.push({ label: "Recurring", key: "recurring" });
  if (recurring === "no") activeChips.push({ label: "Not recurring", key: "recurring" });
  if (currency) activeChips.push({ label: currency, key: "currency" });
  if (fileId === "none" || fileId === "manual") activeChips.push({ label: "Manual entry", key: "fileId" });
  else if (fileId) {
    const f = files.find((x) => x.id === fileId);
    if (f) activeChips.push({ label: f.name, key: "fileId" });
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <form onSubmit={applyFilters} className="p-4">
        <div className="mb-4">
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
            Search
          </label>
          <div className="flex gap-2">
            <input
              type="search"
              name="search"
              defaultValue={search}
              placeholder="Description, amount, currency, or source file name…"
              className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder:text-zinc-500"
            />
            <button
              type="submit"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
            >
              Search
            </button>
          </div>
        </div>

        <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4">
          <button
            type="button"
            onClick={() => setFiltersOpen((o) => !o)}
            className="flex w-full items-center justify-between text-left text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            <span>Filters</span>
            <span className="text-zinc-400 dark:text-zinc-500">
              {filtersOpen ? "▼" : "▶"}
            </span>
          </button>
          {filtersOpen && (
            <div className="mt-4 flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  From date
                </span>
                <input
                  type="date"
                  name="dateFrom"
                  defaultValue={dateFrom}
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  To date
                </span>
                <input
                  type="date"
                  name="dateTo"
                  defaultValue={dateTo}
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Category
                </span>
                <select
                  name="category"
                  defaultValue={category ?? ""}
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50"
                >
                  <option value="">All</option>
                  {categories.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>
              {tags.length > 0 && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    Tags
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => toggleTag(t.id)}
                        className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                          tagIds.includes(t.id)
                            ? "bg-primary text-white"
                            : "bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
                        }`}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Amount min
                </span>
                <input
                  type="number"
                  step="0.01"
                  name="amountMin"
                  defaultValue={amountMin}
                  placeholder="0"
                  className="w-24 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Amount max
                </span>
                <input
                  type="number"
                  step="0.01"
                  name="amountMax"
                  defaultValue={amountMax}
                  placeholder="—"
                  className="w-24 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Recurring
                </span>
                <select
                  name="recurring"
                  defaultValue={recurring ?? ""}
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50"
                >
                  <option value="">Any</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </label>
              {currencies.length > 0 && (
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    Currency
                  </span>
                  <select
                    name="currency"
                    defaultValue={currency ?? ""}
                    className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50"
                  >
                    <option value="">All</option>
                    {currencies.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Source file
                </span>
                <select
                  name="fileId"
                  defaultValue={fileId ?? ""}
                  className="min-w-[140px] rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50"
                >
                  <option value="">All</option>
                  <option value="none">Manual entry only</option>
                  {files.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex w-full items-center gap-2 border-t border-zinc-200 pt-3 dark:border-zinc-700">
                <button
                  type="submit"
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
                >
                  Apply filters
                </button>
                {hasFilters && (
                  <Link
                    href="/transactions"
                    className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    Clear all
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>

        {activeChips.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-zinc-200 pt-3 dark:border-zinc-700">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Active:
            </span>
            {activeChips.map((c) => (
              <span
                key={c.key}
                className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary dark:bg-primary/20"
              >
                {c.label}
              </span>
            ))}
          </div>
        )}
      </form>
    </div>
  );
}
