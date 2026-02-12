/**
 * Text extraction from expense documents.
 * Supports PDF (embedded text), DOCX, and images (OCR).
 */

import path from "path";
import { pathToFileURL } from "url";
import mammoth from "mammoth";
import { createWorker } from "tesseract.js";
import { PDFParse } from "pdf-parse";

const MIME_PDF = "application/pdf";
const MIME_DOCX =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const MIME_JPEG = "image/jpeg";
const MIME_PNG = "image/png";

export type ExtractionStatus = "pending" | "completed" | "failed";

/**
 * Extract text from file content based on MIME type.
 * Returns empty string on error; best-effort extraction.
 */
export async function extractText(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  const type = mimeType?.toLowerCase().trim() || "";

  try {
    if (type === MIME_PDF) {
      return await extractFromPdf(buffer);
    }
    if (type === MIME_DOCX) {
      return await extractFromDocx(buffer);
    }
    if (type === MIME_JPEG || type === MIME_PNG) {
      return await extractFromImage(buffer);
    }

    return "";
  } catch (err) {
    console.error("[extract] Error:", err);
    return "";
  }
}

async function extractFromPdf(buffer: Buffer): Promise<string> {
  // Set worker to absolute path so Next.js server bundle can load it (pdfjs-dist fake worker uses import(workerSrc))
  const workerPath = path.join(
    process.cwd(),
    "node_modules",
    "pdfjs-dist",
    "legacy",
    "build",
    "pdf.worker.mjs"
  );
  const workerSrc = pathToFileURL(workerPath).href;
  PDFParse.setWorker(workerSrc);
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return (result?.text ?? "").trim();
  } finally {
    await parser.destroy();
  }
}

async function extractFromDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return (result?.value ?? "").trim();
}

async function extractFromImage(buffer: Buffer): Promise<string> {
  const worker = await createWorker("eng");
  try {
    const result = await worker.recognize(buffer);
    return (result?.data?.text ?? "").trim();
  } finally {
    await worker.terminate();
  }
}
