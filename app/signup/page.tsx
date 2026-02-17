import Link from "next/link";
import { SignUpForm } from "./SignUpForm";
import { Logo } from "@/app/components/Logo";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 dark:bg-zinc-950">
      <div className="w-full max-w-sm space-y-8 rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
          <Logo showText={true} size="md" />
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Create your account
          </p>
        </div>

        <SignUpForm />

        <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-primary hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
