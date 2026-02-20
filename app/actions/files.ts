"use server";

import { createClient } from "@/lib/supabase/server";

const BUCKET = "expense-files";
const SIGNED_URL_EXPIRES_SEC = 60;

/**
 * Returns a short-lived signed URL for viewing/downloading a file.
 * Verifies the file belongs to the current user (via files.user_id).
 */
export async function getSignedFileUrl(
  fileId: string
): Promise<{ url: string; fileName: string } | { error: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data: file, error: fetchError } = await supabase
    .from("files")
    .select("id, storage_path, name, user_id")
    .eq("id", fileId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !file) {
    return { error: "File not found" };
  }

  const { data: signed, error: signError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(file.storage_path, SIGNED_URL_EXPIRES_SEC);

  if (signError || !signed?.signedUrl) {
    return { error: signError?.message ?? "Failed to create link" };
  }

  return {
    url: signed.signedUrl,
    fileName: file.name ?? "file",
  };
}
