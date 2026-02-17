"use client";

import { useState } from "react";
import { updateBudget, deleteBudget } from "@/app/actions/budgets";
import type { BudgetWithCategory } from "@/lib/types/budget";

type BudgetRow = BudgetWithCategory;

export function BudgetList({ budgets }: { budgets: BudgetRow[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSave(id: string) {
    setError(null);
    const amt = Number(editAmount);
    if (!Number.isFinite(amt) || amt < 0) {
      setError("Enter a valid amount");
      return;
    }
    const result = await updateBudget(id, { amount: amt });
    if (result.error) {
      setError(result.error);
      return;
    }
    setEditingId(null);
    setEditAmount("");
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this budget?")) return;
    setError(null);
    await deleteBudget(id);
  }

  return (
    <div className="mt-4 overflow-x-auto">
      {error && (
        <p className="mb-3 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      <table className="w-full min-w-[400px] text-sm">
        <thead>
          <tr className="border-b border-zinc-200 dark:border-zinc-700">
            <th className="pb-2 text-left font-medium text-zinc-600 dark:text-zinc-400">
              Category
            </th>
            <th className="pb-2 text-right font-medium text-zinc-600 dark:text-zinc-400">
              Month / Year
            </th>
            <th className="pb-2 text-right font-medium text-zinc-600 dark:text-zinc-400">
              Amount (MYR)
            </th>
            <th className="pb-2 text-right font-medium text-zinc-600 dark:text-zinc-400">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {budgets.map((b) => (
            <tr key={b.id}>
              <td className="py-2 font-medium text-zinc-900 dark:text-zinc-50">
                {b.category_name}
              </td>
              <td className="py-2 text-right text-zinc-700 dark:text-zinc-300">
                {new Date(b.year, b.month - 1).toLocaleString("default", {
                  month: "short",
                  year: "numeric",
                })}
              </td>
              <td className="py-2 text-right">
                {editingId === b.id ? (
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="w-24 rounded border border-zinc-200 bg-white px-2 py-1 text-right text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50"
                    autoFocus
                  />
                ) : (
                  <span className="text-zinc-700 dark:text-zinc-300">
                    {b.amount.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                )}
              </td>
              <td className="py-2 text-right">
                {editingId === b.id ? (
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleSave(b.id)}
                      className="rounded bg-primary px-2 py-1 text-xs font-medium text-white hover:opacity-90"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        setEditAmount("");
                        setError(null);
                      }}
                      className="rounded border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-700 dark:border-zinc-600 dark:text-zinc-300"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(b.id);
                        setEditAmount(String(b.amount));
                        setError(null);
                      }}
                      className="text-primary text-xs font-medium hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(b.id)}
                      className="text-red-600 text-xs font-medium hover:underline dark:text-red-400"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
