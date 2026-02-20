"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateTag, deleteTag } from "@/app/actions/tags";
import type { Tag } from "@/app/actions/tags";

export function TagList({ tags }: { tags: Tag[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [error, setError] = useState<string | null>(null);

  function startEdit(t: Tag) {
    setEditingId(t.id);
    setEditName(t.name);
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setError(null);
  }

  async function handleSave(id: string) {
    setError(null);
    const trimmed = editName.trim();
    if (!trimmed) {
      setError("Tag name cannot be empty");
      return;
    }
    const result = await updateTag(id, trimmed);
    if (result.error) {
      setError(result.error);
      return;
    }
    setEditingId(null);
    setEditName("");
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this tag? It will be removed from all transactions.")) return;
    setError(null);
    const result = await deleteTag(id);
    if (result.error) {
      setError(result.error);
      return;
    }
    setEditingId(null);
    router.refresh();
  }

  if (tags.length === 0) {
    return (
      <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
        No tags yet. Create one above to use on transactions.
      </p>
    );
  }

  return (
    <div className="mt-4 overflow-x-auto">
      {error && (
        <p className="mb-3 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      <table className="w-full min-w-[300px] text-sm">
        <thead>
          <tr className="border-b border-zinc-200 dark:border-zinc-700">
            <th className="pb-2 text-left font-medium text-zinc-600 dark:text-zinc-400">
              Tag name
            </th>
            <th className="pb-2 text-right font-medium text-zinc-600 dark:text-zinc-400">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {tags.map((t) => (
            <tr key={t.id}>
              <td className="py-2">
                {editingId === t.id ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    maxLength={100}
                    className="w-full max-w-[200px] rounded border border-zinc-200 bg-white px-2 py-1 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50"
                    autoFocus
                  />
                ) : (
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">
                    {t.name}
                  </span>
                )}
              </td>
              <td className="py-2 text-right">
                {editingId === t.id ? (
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleSave(t.id)}
                      className="rounded bg-primary px-2 py-1 text-xs font-medium text-white hover:opacity-90"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="rounded border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-700 dark:border-zinc-600 dark:text-zinc-300"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(t)}
                      className="text-primary text-xs font-medium hover:underline"
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(t.id)}
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
