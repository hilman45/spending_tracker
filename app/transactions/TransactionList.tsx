"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateTransaction, deleteTransaction } from "@/app/actions/transactions";
import { confirmRecurring } from "@/app/actions/recurring";
import { setTransactionTags } from "@/app/actions/tags";
import { getSignedFileUrl } from "@/app/actions/files";

const CATEGORY_OPTIONS = [
  "Other",
  "Transport",
  "Subscriptions",
  "Shopping",
  "Food & Dining",
  "Utilities",
];

export type TagOption = { id: string; name: string };

export type TransactionRow = {
  id: string;
  date: string;
  amount: number;
  currency: string;
  description: string;
  confirmed_category: string;
  file_id: string | null;
  file_name: string | null;
  is_recurring?: boolean;
  recurring_pattern_id?: string | null;
  recurring_suggestion?: boolean;
  tags?: TagOption[];
};

export function TransactionList({
  transactions,
  allTags,
}: {
  transactions: TransactionRow[];
  allTags: TagOption[];
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRow, setEditRow] = useState<Partial<TransactionRow>>({});
  const [editTagIds, setEditTagIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [detailTransaction, setDetailTransaction] = useState<TransactionRow | null>(null);
  const [fileLinkError, setFileLinkError] = useState<string | null>(null);

  function startEdit(t: TransactionRow) {
    setEditingId(t.id);
    setEditRow({
      date: t.date,
      amount: t.amount,
      currency: t.currency,
      description: t.description,
      confirmed_category: t.confirmed_category,
    });
    setEditTagIds((t.tags ?? []).map((x) => x.id));
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditRow({});
    setEditTagIds([]);
    setError(null);
  }

  function toggleEditTag(tagId: string) {
    setEditTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
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
    await setTransactionTags(id, editTagIds);
    setEditingId(null);
    setEditRow({});
    setEditTagIds([]);
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

  async function handleConfirmRecurring(id: string) {
    setError(null);
    const result = await confirmRecurring(id);
    if (result?.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  async function handleViewOriginalFile(fileId: string) {
    setFileLinkError(null);
    const result = await getSignedFileUrl(fileId);
    if ("error" in result) {
      setFileLinkError(result.error);
      return;
    }
    window.open(result.url, "_blank", "noopener,noreferrer");
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
                Tags
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
                    <td className="py-2">
                      {allTags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {allTags.map((tag) => (
                            <button
                              key={tag.id}
                              type="button"
                              onClick={() => toggleEditTag(tag.id)}
                              className={`rounded px-1.5 py-0.5 text-xs ${
                                editTagIds.includes(tag.id)
                                  ? "bg-primary text-white"
                                  : "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300"
                              }`}
                            >
                              {tag.name}
                            </button>
                          ))}
                        </div>
                      )}
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
                      <span className="block truncate">{t.description || "—"}</span>
                      <div className="mt-0.5 flex flex-wrap gap-1">
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
                    </td>
                    <td className="py-2">
                      <div className="flex flex-wrap gap-1">
                        {(t.tags ?? []).map((tag) => (
                          <span
                            key={tag.id}
                            className="rounded bg-zinc-200 px-1.5 py-0.5 text-xs text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300"
                          >
                            {tag.name}
                          </span>
                        ))}
                        {(t.tags ?? []).length === 0 && (
                          <span className="text-zinc-400 dark:text-zinc-500">—</span>
                        )}
                      </div>
                    </td>
                    <td className="max-w-[140px] truncate py-2 text-zinc-500 dark:text-zinc-400">
                      {t.file_id ? (
                        <button
                          type="button"
                          onClick={() => handleViewOriginalFile(t.file_id!)}
                          className="text-primary hover:underline truncate max-w-full block"
                          title={t.file_name ?? "View file"}
                        >
                          {t.file_name ?? "View file"}
                        </button>
                      ) : (
                        <span className="text-zinc-400 dark:text-zinc-500">Manual entry</span>
                      )}
                    </td>
                    <td className="py-2 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setDetailTransaction(t);
                          setFileLinkError(null);
                        }}
                        className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                      >
                        View
                      </button>
                      <span className="mx-1 text-zinc-300 dark:text-zinc-600">|</span>
                      {!t.is_recurring && t.recurring_suggestion && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleConfirmRecurring(t.id)}
                            className="text-primary hover:underline"
                          >
                            Confirm recurring
                          </button>
                          <span className="mx-1 text-zinc-300 dark:text-zinc-600">|</span>
                        </>
                      )}
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

      {detailTransaction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => {
            setDetailTransaction(null);
            setFileLinkError(null);
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="transaction-detail-title"
        >
          <div
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="transaction-detail-title" className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Transaction details
            </h3>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-zinc-500 dark:text-zinc-400">Date</dt>
                <dd className="font-medium text-zinc-900 dark:text-zinc-50">{detailTransaction.date}</dd>
              </div>
              <div>
                <dt className="text-zinc-500 dark:text-zinc-400">Amount</dt>
                <dd className="font-medium text-zinc-900 dark:text-zinc-50">
                  {detailTransaction.amount.toFixed(2)} {detailTransaction.currency}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500 dark:text-zinc-400">Category</dt>
                <dd className="text-zinc-900 dark:text-zinc-50">{detailTransaction.confirmed_category}</dd>
              </div>
              <div>
                <dt className="text-zinc-500 dark:text-zinc-400">Description</dt>
                <dd className="text-zinc-900 dark:text-zinc-50">{detailTransaction.description || "—"}</dd>
              </div>
              <div>
                <dt className="text-zinc-500 dark:text-zinc-400">Tags</dt>
                <dd className="flex flex-wrap gap-1">
                  {(detailTransaction.tags ?? []).length > 0
                    ? (detailTransaction.tags ?? []).map((tag) => (
                        <span
                          key={tag.id}
                          className="rounded bg-zinc-200 px-1.5 py-0.5 text-xs dark:bg-zinc-700"
                        >
                          {tag.name}
                        </span>
                      ))
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500 dark:text-zinc-400">Source</dt>
                <dd>
                  {detailTransaction.file_id ? (
                    <div>
                      <button
                        type="button"
                        onClick={() => handleViewOriginalFile(detailTransaction.file_id!)}
                        className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:opacity-90"
                      >
                        View Original File
                      </button>
                      {detailTransaction.file_name && (
                        <p className="mt-1 text-zinc-500 dark:text-zinc-400">{detailTransaction.file_name}</p>
                      )}
                    </div>
                  ) : (
                    <span className="text-zinc-500 dark:text-zinc-400">Manual entry</span>
                  )}
                  {fileLinkError && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fileLinkError}</p>
                  )}
                </dd>
              </div>
            </dl>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setDetailTransaction(null);
                  setFileLinkError(null);
                }}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
