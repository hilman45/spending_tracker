"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type Tag = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
};

export async function getTagsForUser(): Promise<{ data: Tag[] | null; error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: "Not authenticated" };
  }
  const { data, error } = await supabase
    .from("tags")
    .select("id, user_id, name, created_at")
    .eq("user_id", user.id)
    .order("name");
  if (error) return { data: null, error: error.message };
  return { data: data as Tag[], error: null };
}

export async function createTag(name: string): Promise<{ data: Tag | null; error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: "Not authenticated" };
  }
  const trimmed = String(name).trim().slice(0, 100);
  if (!trimmed) return { data: null, error: "Tag name is required" };
  const { data, error } = await supabase
    .from("tags")
    .insert({ user_id: user.id, name: trimmed })
    .select("id, user_id, name, created_at")
    .single();
  if (error) return { data: null, error: error.message };
  revalidatePath("/transactions");
  revalidatePath("/dashboard/tags");
  return { data: data as Tag, error: null };
}

export async function updateTag(
  id: string,
  name: string
): Promise<{ data: Tag | null; error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: "Not authenticated" };
  }
  const trimmed = String(name).trim().slice(0, 100);
  if (!trimmed) return { data: null, error: "Tag name is required" };
  const { data, error } = await supabase
    .from("tags")
    .update({ name: trimmed })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id, user_id, name, created_at")
    .single();
  if (error) return { data: null, error: error.message };
  revalidatePath("/transactions");
  revalidatePath("/dashboard/tags");
  return { data: data as Tag, error: null };
}

export async function deleteTag(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }
  const { error } = await supabase.from("tags").delete().eq("id", id).eq("user_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/transactions");
  revalidatePath("/dashboard/tags");
  return { error: null };
}

export async function getTagsForTransaction(
  transactionId: string
): Promise<{ data: Tag[]; error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { data: [], error: "Not authenticated" };
  }
  const { data: links } = await supabase
    .from("transaction_tags")
    .select("tag_id")
    .eq("transaction_id", transactionId);
  if (!links?.length) return { data: [], error: null };
  const tagIds = links.map((l) => l.tag_id);
  const { data: tagRows } = await supabase
    .from("tags")
    .select("id, user_id, name, created_at")
    .eq("user_id", user.id)
    .in("id", tagIds);
  return { data: (tagRows ?? []) as Tag[], error: null };
}

export async function addTagToTransaction(
  transactionId: string,
  tagId: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }
  const { error } = await supabase
    .from("transaction_tags")
    .insert({ transaction_id: transactionId, tag_id: tagId });
  if (error) return { error: error.message };
  revalidatePath("/transactions");
  return { error: null };
}

export async function removeTagFromTransaction(
  transactionId: string,
  tagId: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }
  const { error } = await supabase
    .from("transaction_tags")
    .delete()
    .eq("transaction_id", transactionId)
    .eq("tag_id", tagId);
  if (error) return { error: error.message };
  revalidatePath("/transactions");
  return { error: null };
}

export async function setTransactionTags(
  transactionId: string,
  tagIds: string[]
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }
  const { data: existing } = await supabase
    .from("transaction_tags")
    .select("tag_id")
    .eq("transaction_id", transactionId);
  const current = new Set((existing ?? []).map((r) => r.tag_id));
  const target = new Set(tagIds);
  const toAdd = tagIds.filter((id) => !current.has(id));
  const toRemove = (existing ?? []).map((r) => r.tag_id).filter((id) => !target.has(id));
  for (const tagId of toRemove) {
    await supabase
      .from("transaction_tags")
      .delete()
      .eq("transaction_id", transactionId)
      .eq("tag_id", tagId);
  }
  for (const tagId of toAdd) {
    await supabase.from("transaction_tags").insert({ transaction_id: transactionId, tag_id: tagId });
  }
  revalidatePath("/transactions");
  return { error: null };
}
