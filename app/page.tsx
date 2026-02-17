import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/app/components/Logo";
import {
  AutoExtractIcon,
  VisualInsightsIcon,
  SecurePrivateIcon,
} from "@/app/components/FeatureIcons";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Logo href="/" size="md" />
          <nav className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
            >
              Sign up
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-12">
        <section className="flex flex-col items-center text-center">
          <div className="mb-6">
            <Logo showText={false} size="lg" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
            Track every penny,{" "}
            <span className="text-primary">effortlessly.</span>
          </h1>
          <p className="mt-4 max-w-xl text-base text-zinc-600 dark:text-zinc-400">
            Upload receipts and documents, auto-extract transactions, categorize
            spending, and visualize where your money goes.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:opacity-90"
            >
              Get started
              <span aria-hidden>→</span>
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-zinc-300 px-6 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Sign in
            </Link>
          </div>
        </section>

        <section className="mt-24 grid gap-6 sm:grid-cols-3">
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <AutoExtractIcon className="h-10 w-10 text-primary" />
            <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Auto-extract
            </h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Upload PDFs, images, or docs and let AI pull out your transactions.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <VisualInsightsIcon className="h-10 w-10 text-primary" />
            <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Visual insights
            </h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Charts and filters to understand your spending patterns at a
              glance.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <SecurePrivateIcon className="h-10 w-10 text-primary" />
            <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Secure & private
            </h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Your financial data stays yours. Export anytime to CSV or Sheets.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
