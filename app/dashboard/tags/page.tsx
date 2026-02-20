import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/app/components/AppHeader";
import { getTagsForUser } from "@/app/actions/tags";
import { AddTagForm } from "./AddTagForm";
import { TagList } from "./TagList";

export default async function TagsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: tags, error } = await getTagsForUser();
  if (error) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <AppHeader user={user} activePage="tags" />
        <main className="mx-auto max-w-4xl px-4 py-8">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <AppHeader user={user} activePage="tags" />

      <main className="mx-auto max-w-4xl px-4 py-6">
        <div className="mb-4">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            ← Dashboard
          </Link>
        </div>

        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
          Manage tags
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Create tags to group transactions (e.g. Business, Travel). Assign them
          when reviewing uploads or when editing a transaction.
        </p>

        <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <AddTagForm />
          <TagList tags={tags ?? []} />
        </div>
      </main>
    </div>
  );
}
