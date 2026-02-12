"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function uploadFiles(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const files = formData.getAll("files") as File[];
  if (!files.length) {
    return { error: "No files selected" };
  }

  const uploaded: { id: string; name: string }[] = [];
  const errors: string[] = [];

  for (const file of files) {
    if (file.size > MAX_SIZE) {
      errors.push(`${file.name}: File too large (max 10MB)`);
      continue;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      errors.push(`${file.name}: Invalid type. Use PDF, DOCX, JPG, or PNG`);
      continue;
    }

    const fileId = crypto.randomUUID();
    const ext = file.name.split(".").pop() || "";
    const safeName = `${fileId}.${ext}`;
    const storagePath = `${user.id}/${fileId}/${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from("expense-files")
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      errors.push(`${file.name}: ${uploadError.message}`);
      continue;
    }

    const { data: inserted, error: dbError } = await supabase
      .from("files")
      .insert({
        user_id: user.id,
        name: file.name,
        storage_path: storagePath,
        mime_type: file.type,
      })
      .select("id, name")
      .single();

    if (dbError) {
      errors.push(`${file.name}: Failed to save record`);
      await supabase.storage.from("expense-files").remove([storagePath]);
      continue;
    }

    if (inserted) uploaded.push(inserted);
  }

  revalidatePath("/upload");
  revalidatePath("/dashboard");

  if (errors.length > 0 && uploaded.length === 0) {
    return { error: errors.join("; ") };
  }

  return {
    uploaded,
    errors: errors.length > 0 ? errors : undefined,
  };
}

export async function deleteFile(formData: FormData) {
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
    .select("id, storage_path, user_id")
    .eq("id", fileId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !file) {
    return { error: "File not found" };
  }

  const { error: storageError } = await supabase.storage
    .from("expense-files")
    .remove([file.storage_path]);

  if (storageError) {
    return { error: storageError.message };
  }

  const { error: dbError } = await supabase
    .from("files")
    .delete()
    .eq("id", fileId)
    .eq("user_id", user.id);

  if (dbError) {
    return { error: dbError.message };
  }

  revalidatePath("/upload");
  revalidatePath("/dashboard");

  return { success: true };
}
