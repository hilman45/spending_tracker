"use client";

import { useState } from "react";
import { generateInsights } from "@/app/actions/insights";
import type { InsightResult } from "@/lib/insights/types";

type Props = {
  /** Month in YYYY-MM format (e.g. for current month) */
  month: string;
  /** Human-readable label (e.g. "February 2026") */
  monthLabel: string;
};

export function AIInsightsCard({ month, monthLabel }: Props) {
  const [result, setResult] = useState<InsightResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const res = await generateInsights(month);
      if (res.success) {
        setResult(res.data);
        setLastGenerated(new Date());
      } else {
        setError(res.error);
        setResult(null);
      }
    } catch {
      setError("Something went wrong.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          AI Insights — {monthLabel}
        </h3>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          Optional — enable in .env
        </span>
      </div>

      <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
        Insights are generated automatically and may not always be accurate.
      </p>

      <div className="mt-4">
        {!result && !loading && !error && (
          <button
            type="button"
            onClick={handleGenerate}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 dark:bg-primary dark:text-zinc-900 dark:hover:opacity-90"
          >
            Generate Insights
          </button>
        )}

        {loading && (
          <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            Generating…
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">
            {error}
            <button
              type="button"
              onClick={handleGenerate}
              className="ml-2 font-medium underline"
            >
              Try again
            </button>
          </div>
        )}

        {result && !loading && (
          <>
            {lastGenerated && (
              <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
                Last generated: {lastGenerated.toLocaleString()}
              </p>
            )}
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              {result.summary}
            </p>
            {result.highlights.length > 0 && (
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-zinc-700 dark:text-zinc-300">
                {result.highlights.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            )}
            {result.warnings.length > 0 && (
              <div className="mt-3 rounded-lg bg-amber-50 p-3 dark:bg-amber-950/30">
                <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
                  Warnings
                </p>
                <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-amber-800 dark:text-amber-200">
                  {result.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
            <button
              type="button"
              onClick={handleGenerate}
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Refresh insights
            </button>
          </>
        )}
      </div>
    </div>
  );
}
