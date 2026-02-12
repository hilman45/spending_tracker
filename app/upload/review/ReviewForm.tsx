"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveTransactions } from "@/app/actions/transactions";
import type { DetectedTransaction } from "@/app/actions/detect";

const DEFAULT_CATEGORY = "Other";

type InitialTransaction = DetectedTransaction & {
  suggested_category?: string | null;
};
type Row = DetectedTransaction & { confirmed_category: string };

export function ReviewForm({
  fileId,
  initialTransactions,
  categories: categoryOptions,
}: {
  fileId: string;
  initialTransactions: InitialTransaction[];
  categories: string[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>(
    initialTransactions.map((t) => ({
      ...t,
      confirmed_category: t.suggested_category || DEFAULT_CATEGORY,
    }))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateRow(i: number, field: keyof Row, value: string | number) {
    setRows((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const transactions = rows.map((r) => ({
      date: r.date,
      amount: Number(r.amount) || 0,
      currency: r.currency || "MYR",
      description: r.description || "",
      confirmed_category: r.confirmed_category || DEFAULT_CATEGORY,
    }));
    const result = await saveTransactions(fileId, transactions);
    setSaving(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    router.push("/transactions");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6">
      <div className="mb-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
        <p className="font-medium text-zinc-900 dark:text-zinc-50">
          What you’re reviewing
        </p>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          We found <strong>{rows.length}</strong> transaction{rows.length !== 1 ? "s" : ""} in your
          document. Check each row below: fix the date, amount, or description if
          something looks wrong, then pick a category. When everything looks good,
          click <strong>Confirm and save</strong>.
        </p>
      </div>

      {error && (
        <p className="mb-4 rounded bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-900/40 dark:text-red-400">
          {error}
        </p>
      )}

      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Detected transactions
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-700">
              <th className="py-2 text-left font-medium text-zinc-700 dark:text-zinc-300">
                Date
              </th>
              <th className="py-2 text-left font-medium text-zinc-700 dark:text-zinc-300">
                Amount
              </th>
              <th className="py-2 text-left font-medium text-zinc-700 dark:text-zinc-300">
                Currency
              </th>
              <th className="py-2 text-left font-medium text-zinc-700 dark:text-zinc-300">
                Description
              </th>
              <th className="py-2 text-left font-medium text-zinc-700 dark:text-zinc-300">
                Category
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={i}
                className="border-b border-zinc-100 dark:border-zinc-800"
              >
                <td className="py-2">
                  <input
                    type="date"
                    value={row.date}
                    onChange={(e) => updateRow(i, "date", e.target.value)}
                    className="w-full rounded border border-zinc-200 bg-white px-2 py-1 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50"
                    required
                  />
                </td>
                <td className="py-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={row.amount}
                    onChange={(e) =>
                      updateRow(
                        i,
                        "amount",
                        e.target.value === "" ? 0 : parseFloat(e.target.value) || 0
                      )
                    }
                    className="w-full rounded border border-zinc-200 bg-white px-2 py-1 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50"
                    required
                  />
                </td>
                <td className="py-2">
                  <input
                    type="text"
                    value={row.currency}
                    onChange={(e) => updateRow(i, "currency", e.target.value)}
                    className="w-20 rounded border border-zinc-200 bg-white px-2 py-1 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50"
                    maxLength={10}
                  />
                </td>
                <td className="py-2">
                  <input
                    type="text"
                    value={row.description}
                    onChange={(e) => updateRow(i, "description", e.target.value)}
                    className="w-full min-w-[120px] rounded border border-zinc-200 bg-white px-2 py-1 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50"
                    placeholder="What was this for?"
                  />
                </td>
                <td className="py-2">
                  <select
                    value={row.confirmed_category}
                    onChange={(e) =>
                      updateRow(i, "confirmed_category", e.target.value)
                    }
                    className="w-full min-w-[100px] rounded border border-zinc-200 bg-white px-2 py-1 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50"
                    required
                  >
                    {(categoryOptions.length ? categoryOptions : [DEFAULT_CATEGORY]).map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-zinc-200 pt-6 dark:border-zinc-700">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {saving ? "Saving…" : "Confirm and save"}
        </button>
        <a
          href="/upload"
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Cancel
        </a>
        {saving && (
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            Saving your transactions…
          </span>
        )}
      </div>
    </form>
  );
}
