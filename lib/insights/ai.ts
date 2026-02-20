import type { InsightPayload, InsightResult } from "./types";

const SYSTEM_PROMPT = `You are a spending insights assistant. You receive aggregated spending data and must respond with a JSON object only, no other text.

Rules:
- Base your response strictly on the numbers provided. Do not invent data.
- Do not give investment, tax, or legal advice.
- Respond with valid JSON in this exact shape: { "summary": "one short paragraph", "highlights": ["bullet 1", "bullet 2", ...], "warnings": ["warning 1", ...] }
- summary: 2-4 sentences summarizing the month (total spent, top category, comparison to previous month if relevant). Use the currency and amounts from the data.
- highlights: 2-5 short bullet points (e.g. trends, notable categories, budget status if provided).
- warnings: only if something deserves attention (e.g. over budget, large increase). Use empty array [] if none.
- Use the same currency code (e.g. MYR) when mentioning amounts.`;

function buildUserMessage(payload: InsightPayload): string {
  return `Analyze this spending data and return the JSON object only:\n${JSON.stringify(payload, null, 2)}`;
}

/**
 * Parse LLM response into InsightResult. Returns fallback on invalid/missing JSON.
 */
function parseResponse(content: string | null | undefined): InsightResult {
  const fallback: InsightResult = {
    summary: "Insights could not be generated. Please try again.",
    highlights: [],
    warnings: [],
  };
  if (!content || typeof content !== "string") return fallback;
  const trimmed = content.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  const jsonStr = jsonMatch ? jsonMatch[0] : trimmed;
  try {
    const parsed = JSON.parse(jsonStr) as Record<string, unknown>;
    const summary = typeof parsed.summary === "string" ? parsed.summary : fallback.summary;
    const highlights = Array.isArray(parsed.highlights)
      ? parsed.highlights.filter((h): h is string => typeof h === "string")
      : [];
    const warnings = Array.isArray(parsed.warnings)
      ? parsed.warnings.filter((w): w is string => typeof w === "string")
      : [];
    return { summary, highlights, warnings };
  } catch {
    return fallback;
  }
}

/** Call OpenAI API with fetch (no SDK). */
async function callOpenAI(payload: InsightPayload, apiKey: string): Promise<string | null> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserMessage(payload) },
      ],
      response_format: { type: "json_object" },
      max_tokens: 1024,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI API error: ${res.status}`);
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content ?? null;
}

/** Single Gemini generateContent request. Key from env only (never hardcoded). */
async function geminiGenerate(
  apiKey: string,
  model: string,
  prompt: string,
  useJson = true
): Promise<{ ok: boolean; status: number; text: string | null; errBody?: string }> {
  // AI Studio keys work with key in query param; also send header for compatibility
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 1024,
        ...(useJson && { responseMimeType: "application/json" }),
      },
    }),
  });
  const errBody = !res.ok ? await res.text() : undefined;
  let text: string | null = null;
  if (res.ok) {
    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
  }
  return { ok: res.ok, status: res.status, text, errBody };
}

/** Models known to work with Google AI Studio keys (tried in order until one succeeds). */
const DEFAULT_GEMINI_MODELS: { model: string; jsonMode: boolean }[] = [
  { model: "gemini-2.0-flash", jsonMode: true },
  { model: "gemini-1.5-flash", jsonMode: true },
  { model: "gemini-1.5-flash-8b", jsonMode: true },
  { model: "gemini-1.5-pro", jsonMode: true },
  { model: "gemini-pro", jsonMode: false },
];

/** Call Google Gemini API with fetch (no SDK). Uses GEMINI_API_KEY from .env.local only. */
async function callGemini(payload: InsightPayload, apiKey: string): Promise<string | null> {
  const prompt = SYSTEM_PROMPT + "\n\n" + buildUserMessage(payload);
  const customModel = process.env.GEMINI_MODEL?.trim();
  const toTry = customModel
    ? [{ model: customModel, jsonMode: true }]
    : DEFAULT_GEMINI_MODELS;

  let lastErr: string | null = null;
  for (const { model, jsonMode } of toTry) {
    const result = await geminiGenerate(apiKey, model, prompt, jsonMode);
    if (result.ok) return result.text;
    lastErr = result.errBody ? result.errBody.slice(0, 400) : `HTTP ${result.status}`;
    if (result.status === 404) continue; // try next model
    throw new Error(`Gemini API (${result.status}): ${lastErr}`);
  }

  throw new Error(
    `Gemini returned 404 for every model. Last response: ${lastErr ?? "unknown"}. Try adding GEMINI_MODEL=gemini-2.0-flash to .env.local, or check https://ai.google.dev/gemini-api/docs/models`
  );
}

/**
 * Generate insights using whichever provider is configured (no extra npm packages).
 * Set OPENAI_API_KEY for OpenAI, or GEMINI_API_KEY for Google Gemini (free tier).
 */
export async function generateInsightFromPayload(
  payload: InsightPayload
): Promise<InsightResult> {
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  const openaiKey = process.env.OPENAI_API_KEY?.trim();

  if (!geminiKey && !openaiKey) {
    return {
      summary: "AI insights are disabled. To enable, set GEMINI_API_KEY or OPENAI_API_KEY in .env.local.",
      highlights: [],
      warnings: [],
    };
  }

  try {
    let content: string | null;
    if (geminiKey) {
      content = await callGemini(payload, geminiKey);
    } else if (openaiKey) {
      content = await callOpenAI(payload, openaiKey);
    } else {
      content = null;
    }
    return parseResponse(content);
  } catch (err) {
    console.error("AI insights error:", err);
    return {
      summary: "Insights could not be generated. Please check your API key and try again.",
      highlights: [],
      warnings: [],
    };
  }
}
