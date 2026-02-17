import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AppHeader } from "@/app/components/AppHeader";
import { UploadZone } from "./UploadZone";
import { FileList } from "./FileList";

export default async function UploadPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: files } = await supabase
    .from("files")
    .select("id, name, created_at, extraction_status, extracted_text")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <AppHeader user={user} activePage="upload" />

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="space-y-8">
          <div className="rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Upload expense documents
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              PDF, DOCX, JPG, or PNG. Max 10MB per file.
            </p>
            <UploadZone />
          </div>

          {files && files.length > 0 && (
            <FileList files={files} />
          )}
        </div>
      </main>
    </div>
  );
}
