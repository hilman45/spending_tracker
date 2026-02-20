"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { deleteFile } from "@/app/actions/upload";
import { extractFile } from "@/app/actions/extract";

type FileItem = {
  id: string;
  name: string;
  created_at: string;
  extraction_status?: string | null;
  extracted_text?: string | null;
};

async function handleDelete(formData: FormData) {
  await deleteFile(formData);
}

function useExtractAction() {
  const router = useRouter();
  return async (formData: FormData) => {
    const result = await extractFile(formData);
    if (result?.success || result?.error) router.refresh();
  };
}

function ExtractButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded px-2 py-0.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
    >
      {pending ? "Extracting…" : "Extract"}
    </button>
  );
}

function DeleteButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded px-2 py-0.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 disabled:opacity-50"
    >
      {pending ? "…" : "Delete"}
    </button>
  );
}

function StatusBadge({ status }: { status?: string | null }) {
  if (!status || status === "pending") {
    return (
      <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
        Not extracted
      </span>
    );
  }
  if (status === "completed") {
    return (
      <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-xs text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
        Extracted
      </span>
    );
  }
  return (
    <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700 dark:bg-red-900/40 dark:text-red-400">
      Failed
    </span>
  );
}

export function FileList({ files }: { files: FileItem[] }) {
  const handleExtract = useExtractAction();
  if (!files?.length) return null;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Your files
      </h2>
      <ul className="mt-4 space-y-3">
        {files.map((f) => (
          <li
            key={f.id}
            className="rounded-lg border border-zinc-200 py-3 px-3 dark:border-zinc-700"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <span className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {f.name}
                </span>
                <StatusBadge status={f.extraction_status} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500">
                  {new Date(f.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                  })}
                </span>
                {f.extraction_status === "completed" && (
                  <Link
                    href={`/upload/review?fileId=${f.id}`}
                    className="rounded px-2 py-0.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    Review
                  </Link>
                )}
                <form action={handleExtract} className="inline">
                  <input type="hidden" name="fileId" value={f.id} />
                  <ExtractButton />
                </form>
                <form action={handleDelete} className="inline">
                  <input type="hidden" name="fileId" value={f.id} />
                  <DeleteButton />
                </form>
              </div>
            </div>
            {f.extraction_status === "completed" && f.extracted_text && (
              <p className="mt-2 max-h-20 overflow-y-auto rounded bg-zinc-50 px-2 py-1.5 text-xs text-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-400">
                {f.extracted_text.slice(0, 300)}
                {f.extracted_text.length > 300 ? "…" : ""}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
