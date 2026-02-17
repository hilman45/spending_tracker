"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/** Normalize description for pattern storage (same logic as detection). */
function normalizeDescription(description: string | null | undefined): string {
  if (description == null) return "";
  return String(description).trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Confirm a transaction as recurring. Creates a recurring_pattern row and sets
 * transaction.is_recurring = true and transaction.recurring_pattern_id.
 * Only persists when user explicitly confirms; detection never auto-saves.
 */
export async function confirmRecurring(transactionId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: tx, error: fetchError } = await supabase
    .from("transactions")
    .select("id, description, amount")
    .eq("id", transactionId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !tx) return { error: "Transaction not found" };

  const normalizedDescription = normalizeDescription(tx.description);
  const amountCenter = Number(tx.amount) || 0;

  const { data: pattern, error: insertError } = await supabase
    .from("recurring_patterns")
    .insert({
      user_id: user.id,
      normalized_description: normalizedDescription || null,
      amount_center: amountCenter,
      interval_type: "monthly",
    })
    .select("id")
    .single();

  if (insertError || !pattern) return { error: insertError?.message ?? "Failed to create pattern" };

  const { error: updateError } = await supabase
    .from("transactions")
    .update({
      is_recurring: true,
      recurring_pattern_id: pattern.id,
    })
    .eq("id", transactionId)
    .eq("user_id", user.id);

  if (updateError) return { error: updateError.message };

  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  return { success: true };
}
