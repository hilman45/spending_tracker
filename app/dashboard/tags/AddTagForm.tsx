"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createTag } from "@/app/actions/tags";

export function AddTagForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Enter a tag name");
      return;
    }
    setSubmitting(true);
    const result = await createTag(trimmed);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setName("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2">
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          New tag
        </span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Business, Travel"
          maxLength={100}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50"
        />
      </label>
      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
      >
        {submitting ? "Adding…" : "Add tag"}
      </button>
      {error && (
        <p className="w-full text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </form>
  );
}
