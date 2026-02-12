"use client";

import { useActionState } from "react";
import { signUp } from "@/app/actions/auth";

export function SignUpForm() {
  const [state, formAction] = useActionState(
    async (
      _prev: { error?: string; message?: string } | null,
      formData: FormData
    ) => {
      const result = await signUp(formData);
      return result ?? null;
    },
    null
  );

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {state.error}
        </div>
      )}
      {state?.message && (
        <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
          {state.message}
        </div>
      )}
      <label className="block">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Email
        </span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
          placeholder="you@example.com"
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Password
        </span>
        <input
          type="password"
          name="password"
          required
          autoComplete="new-password"
          minLength={6}
          className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
          placeholder="••••••••"
        />
        <span className="mt-1 text-xs text-zinc-500">Minimum 6 characters</span>
      </label>
      <button
        type="submit"
        className="w-full rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        Create account
      </button>
    </form>
  );
}
