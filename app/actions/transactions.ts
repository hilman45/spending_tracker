"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type TransactionToSave = {
  date: string;
  amount: number;
  currency: string;
  description: string;
  confirmed_category: string;
};

/** Optional tag IDs to attach to every inserted transaction (e.g. from review batch). */
export type SaveTransactionsOptions = { tagIds?: string[] };

const DEFAULT_CATEGORY = "Other";

export async function saveTransactions(
  fileId: string,
  transactions: TransactionToSave[],
  options?: SaveTransactionsOptions
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  if (!transactions?.length) {
    return { error: "No transactions to save" };
  }

  const rows = transactions.map((t) => ({
    user_id: user.id,
    file_id: fileId,
    date: t.date,
    amount: Number(t.amount) || 0,
    currency: (t.currency || "MYR").trim().toUpperCase().slice(0, 10) || "MYR",
    description: (t.description || "").trim().slice(0, 1000) || null,
    suggested_category: null,
    confirmed_category:
      (t.confirmed_category || DEFAULT_CATEGORY).trim().slice(0, 100) ||
      DEFAULT_CATEGORY,
  }));

  const { data: inserted, error } = await supabase
    .from("transactions")
    .insert(rows)
    .select("id");

  if (error) {
    return { error: error.message };
  }

  const tagIds = options?.tagIds?.filter(Boolean) ?? [];
  if (tagIds.length > 0 && inserted?.length) {
    const linkRows: { transaction_id: string; tag_id: string }[] = [];
    for (const row of inserted) {
      for (const tagId of tagIds) {
        linkRows.push({ transaction_id: row.id, tag_id: tagId });
      }
    }
    await supabase.from("transaction_tags").insert(linkRows);
  }

  revalidatePath("/upload");
  revalidatePath("/dashboard");
  revalidatePath("/transactions");

  return { success: true, count: rows.length };
}

export type TransactionUpdate = {
  date?: string;
  amount?: number;
  currency?: string;
  description?: string;
  confirmed_category?: string;
};

export async function updateTransaction(id: string, data: TransactionUpdate) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const payload: Record<string, unknown> = {};
  if (data.date != null) payload.date = data.date;
  if (data.amount != null) payload.amount = Number(data.amount) || 0;
  if (data.currency != null)
    payload.currency = String(data.currency).trim().toUpperCase().slice(0, 10) || "MYR";
  if (data.description != null) payload.description = String(data.description).trim().slice(0, 1000) || null;
  if (data.confirmed_category != null)
    payload.confirmed_category = String(data.confirmed_category).trim().slice(0, 100) || "Other";

  if (Object.keys(payload).length === 0) {
    return { error: "No fields to update" };
  }

  const { error } = await supabase
    .from("transactions")
    .update(payload)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteTransaction(id: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  return { success: true };
}
