"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateTransaction, deleteTransaction } from "@/app/actions/transactions";

const CATEGORY_OPTIONS = [
  "Other",
  "Transport",
  "Subscriptions",
  "Shopping",
  "Food & Dining",
  "Utilities",
];

export type TransactionRow = {
  id: string;
  date: string;
  amount: number;
  currency: string;
  description: string;
  confirmed_category: string;
  file_id: string | null;
  file_name: string | null;
};

export function TransactionList({
  transactions,
}: {
  transactions: TransactionRow[];
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRow, setEditRow] = useState<Partial<TransactionRow>>({});
  const [error, setError] = useState<string | null>(null);

  function startEdit(t: TransactionRow) {
    setEditingId(t.id);
    setEditRow({
      date: t.date,
      amount: t.amount,
      currency: t.currency,
      description: t.description,
      confirmed_category: t.confirmed_category,
    });
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditRow({});
    setError(null);
  }

  async function handleUpdate(id: string) {
    setError(null);
    const result = await updateTransaction(id, {
      date: editRow.date,
      amount: editRow.amount,
      currency: editRow.currency,
      description: editRow.description,
      confirmed_category: editRow.confirmed_category,
    });
    if (result?.error) {
      setError(result.error);
      return;
    }
    setEditingId(null);
    setEditRow({});
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this transaction?")) return;
    setError(null);
    const result = await deleteTransaction(id);
    if (result?.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      {error && (
        <p className="border-b border-zinc-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-zinc-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-700">
              <th className="py-2 text-left font-medium text-zinc-700 dark:text-zinc-300">
                Date
              </th>
              <th className="py-2 text-left font-medium text-zinc-700 dark:text-zinc-300">
                Amount
              </th>
              <th className="py-2 text-left font-medium text-zinc-700 dark:text-zinc-300">
                Category
              </th>
              <th className="py-2 text-left font-medium text-zinc-700 dark:text-zinc-300">
                Description
              </th>
              <th className="py-2 text-left font-medium text-zinc-700 dark:text-zinc-300">
                Source
              </th>
              <th className="w-24 py-2 text-right font-medium text-zinc-700 dark:text-zinc-300">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr
                key={t.id}
                className="border-b border-zinc-100 dark:border-zinc-800"
              >
                {editingId === t.id ? (
                  <>
                    <td className="py-2">
                      <input
                        type="date"
                        value={editRow.date ?? ""}
                        onChange={(e) =>
                          setEditRow((prev) => ({ ...prev, date: e.target.value }))
                        }
                        className="rounded border border-zinc-200 bg-white px-2 py-1 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50"
                      />
                    </td>
                    <td className="py-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editRow.amount ?? ""}
                        onChange={(e) =>
                          setEditRow((prev) => ({
                            ...prev,
                            amount: e.target.value ? parseFloat(e.target.value) : 0,
                          }))
                        }
                        className="w-24 rounded border border-zinc-200 bg-white px-2 py-1 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50"
                      />
                    </td>
                    <td className="py-2">
                      <select
                        value={editRow.confirmed_category ?? ""}
                        onChange={(e) =>
                          setEditRow((prev) => ({
                            ...prev,
                            confirmed_category: e.target.value,
                          }))
                        }
                        className="rounded border border-zinc-200 bg-white px-2 py-1 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50"
                      >
                        {CATEGORY_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2">
                      <input
                        type="text"
                        value={editRow.description ?? ""}
                        onChange={(e) =>
                          setEditRow((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        className="min-w-[120px] rounded border border-zinc-200 bg-white px-2 py-1 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50"
                      />
                    </td>
                    <td className="py-2 text-zinc-500 dark:text-zinc-400">
                      {t.file_name ?? "—"}
                    </td>
                    <td className="py-2 text-right">
                      <button
                        type="button"
                        onClick={() => handleUpdate(t.id)}
                        className="mr-1 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                      >
                        Cancel
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="py-2 text-zinc-900 dark:text-zinc-50">
                      {t.date}
                    </td>
                    <td className="py-2 font-medium text-zinc-900 dark:text-zinc-50">
                      {t.amount.toFixed(2)} {t.currency}
                    </td>
                    <td className="py-2 text-zinc-700 dark:text-zinc-300">
                      {t.confirmed_category}
                    </td>
                    <td className="max-w-[200px] truncate py-2 text-zinc-600 dark:text-zinc-400">
                      {t.description || "—"}
                    </td>
                    <td className="max-w-[140px] truncate py-2 text-zinc-500 dark:text-zinc-400">
                      {t.file_name ?? "—"}
                    </td>
                    <td className="py-2 text-right">
                      <button
                        type="button"
                        onClick={() => startEdit(t)}
                        className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                      >
                        Edit
                      </button>
                      <span className="mx-1 text-zinc-300 dark:text-zinc-600">|</span>
                      <button
                        type="button"
                        onClick={() => handleDelete(t.id)}
                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Delete
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
