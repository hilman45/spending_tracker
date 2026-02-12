"use server";

import { createClient } from "@/lib/supabase/server";
import { detectTransactions as detectFromText } from "@/lib/detection/detect";

export type DetectedTransaction = {
  date: string;
  amount: number;
  currency: string;
  description: string;
};

export async function detectTransactions(fileId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data: file, error: fetchError } = await supabase
    .from("files")
    .select("id, name, extracted_text, extraction_status, user_id")
    .eq("id", fileId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !file) {
    return { error: "File not found" };
  }

  if (file.extraction_status !== "completed" || !file.extracted_text?.trim()) {
    return { error: "Extract text first before detecting transactions" };
  }

  const transactions = detectFromText(file.extracted_text);

  return {
    fileId: file.id,
    fileName: file.name,
    transactions,
  };
}
