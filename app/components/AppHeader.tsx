import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

type AppHeaderProps = {
  user?: { email?: string | null } | null;
  title?: string;
  activePage?: "dashboard" | "upload" | "transactions" | "budgets";
  /** When provided, show simplified nav (e.g. Review page with Back to Upload) */
  simpleNav?: React.ReactNode;
};

export function AppHeader({
  user,
  title,
  activePage,
  simpleNav,
}: AppHeaderProps) {
  const linkClass = (active: boolean) =>
    active
      ? "rounded-md bg-primary/10 px-3 py-2 text-sm font-medium text-primary dark:bg-primary/20"
      : "rounded-md px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50";

  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {title ? (
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            {title}
          </h1>
        ) : (
          <Logo href="/dashboard" size="md" />
        )}
        <nav className="flex items-center gap-4">
          {simpleNav ? (
            simpleNav
          ) : (
            <>
              <Link
                href="/dashboard"
                className={linkClass(activePage === "dashboard")}
              >
                Dashboard
              </Link>
              <Link
                href="/upload"
                className={linkClass(activePage === "upload")}
              >
                Upload
              </Link>
              <Link
                href="/transactions"
                className={linkClass(activePage === "transactions")}
              >
                Transactions
              </Link>
              <Link
                href="/dashboard/budgets"
                className={linkClass(activePage === "budgets")}
              >
                Budgets
              </Link>
            </>
          )}
          {!simpleNav && (
            <>
              {user?.email && (
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  {user.email}
                </span>
              )}
              <form action={signOut}>
                <button
                  type="submit"
                  className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Sign out
                </button>
              </form>
            </>
          )}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
