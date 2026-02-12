"use client";

import { useRef, useState, useCallback } from "react";
import { uploadFiles } from "@/app/actions/upload";

const ACCEPT = ".pdf,.docx,.jpg,.jpeg,.png";
const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
];

function isValidFile(file: File): boolean {
  return ALLOWED_TYPES.includes(file.type);
}

type UploadState = {
  error?: string;
  uploaded?: { id: string; name: string }[];
  errors?: string[];
} | null;

export function UploadZone() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [state, setState] = useState<UploadState>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files).filter(isValidFile);
      setSelectedFiles((prev) => [...prev, ...files]);
    },
    []
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
        ? Array.from(e.target.files).filter(isValidFile)
        : [];
      setSelectedFiles((prev) => [...prev, ...files]);
      e.target.value = "";
    },
    []
  );

  const removeFile = useCallback((index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (selectedFiles.length === 0) return;

      setIsLoading(true);
      setState(null);

      const formData = new FormData();
      selectedFiles.forEach((file) => formData.append("files", file));

      const result = await uploadFiles(formData);

      if (result?.uploaded?.length) {
        setSelectedFiles([]);
      }
      setState(result ?? null);
      setIsLoading(false);
    },
    [selectedFiles]
  );

  return (
    <form onSubmit={handleSubmit} className="mt-6">
      {state?.error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {state.error}
        </div>
      )}
      {state?.uploaded && state.uploaded.length > 0 && (
        <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
          Uploaded: {state.uploaded.map((f) => f.name).join(", ")}
        </div>
      )}
      {state?.errors && state.errors.length > 0 && (
        <div className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
          {state.errors.join("; ")}
        </div>
      )}

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-12 text-center transition-colors ${
          isDragging
            ? "border-zinc-500 bg-zinc-100 dark:border-zinc-400 dark:bg-zinc-800"
            : "border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-600 dark:hover:border-zinc-500 dark:hover:bg-zinc-800/50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT}
          onChange={handleFileChange}
          className="hidden"
        />
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Drag and drop files here, or click to browse
        </p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          PDF, DOCX, JPG, PNG. Max 10MB per file.
        </p>
      </div>

      {selectedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Selected ({selectedFiles.length}):
          </p>
          <ul className="space-y-2">
            {selectedFiles.map((file, i) => (
              <li
                key={`${file.name}-${i}`}
                className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800/50"
              >
                <span className="truncate text-sm text-zinc-900 dark:text-zinc-50">
                  {file.name}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(i);
                  }}
                  className="ml-2 rounded px-2 py-0.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {isLoading
              ? "Uploading..."
              : `Upload ${selectedFiles.length} file${selectedFiles.length > 1 ? "s" : ""}`}
          </button>
        </div>
      )}
    </form>
  );
}
