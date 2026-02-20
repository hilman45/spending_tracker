"use server";

import { createClient } from "@/lib/supabase/server";
import { aggregateInsightData } from "@/lib/insights/aggregate";
import { generateInsightFromPayload } from "@/lib/insights/ai";
import type { InsightResult } from "@/lib/insights/types";

const DEFAULT_CURRENCY = "MYR";

/**
 * Generate AI insights for a given month (YYYY-MM).
 * Runs aggregation then Gemini/OpenAI; no DB writes.
 */
export async function generateInsights(month: string): Promise<
  | { success: true; data: InsightResult }
  | { success: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const trimmed = month.trim();
  if (!/^\d{4}-\d{2}$/.test(trimmed)) {
    return { success: false, error: "Invalid month; use YYYY-MM" };
  }

  try {
    const payload = await aggregateInsightData(user.id, trimmed, DEFAULT_CURRENCY);
    const result = await generateInsightFromPayload(payload);
    return { success: true, data: result };
  } catch (err) {
    console.error("generateInsights error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to generate insights",
    };
  }
}
