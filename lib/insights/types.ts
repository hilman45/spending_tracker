/**
 * Structured payload sent to the AI service. Only aggregated numbers and category names.
 * No PII, no raw descriptions, no suggested categories or OCR data.
 */
export type InsightPayload = {
  month: string;
  total_spending: number;
  currency: string;
  category_breakdown: Record<string, number>;
  previous_month_total: number;
  budget_status?: Record<string, { budget: number; spent: number }>;
};

/**
 * AI service response. Summary + bullet highlights + optional warnings.
 */
export type InsightResult = {
  summary: string;
  highlights: string[];
  warnings: string[];
};
