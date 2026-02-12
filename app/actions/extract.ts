"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { extractText } from "@/lib/extraction/extract";

export async function extractFile(formData: FormData) {
  const fileId = formData.get("fileId") as string;
  if (!fileId) return { error: "File ID required" };

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data: file, error: fetchError } = await supabase
    .from("files")
    .select("id, storage_path, mime_type, user_id")
    .eq("id", fileId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !file) {
    return { error: "File not found" };
  }

  const { data: blob, error: downloadError } = await supabase.storage
    .from("expense-files")
    .download(file.storage_path);

  if (downloadError || !blob) {
    return { error: downloadError?.message ?? "Failed to download file" };
  }

  const buffer = Buffer.from(await blob.arrayBuffer());
  const mimeType = file.mime_type ?? "";

  const text = await extractText(buffer, mimeType);
  const status = text !== "" ? "completed" : "failed";

  const { error: updateError } = await supabase
    .from("files")
    .update({
      extracted_text: text || null,
      extraction_status: status,
    })
    .eq("id", fileId)
    .eq("user_id", user.id);

  if (updateError) {
    return { error: updateError.message };
  }

  revalidatePath("/upload");

  return {
    success: true,
    status,
    preview: text.slice(0, 200) + (text.length > 200 ? "…" : ""),
  };
}
