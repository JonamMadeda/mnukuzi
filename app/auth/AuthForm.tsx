"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { Loader2, Youtube } from "lucide-react";
import type { AuthState } from "./sign-in/actions";

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-light disabled:opacity-50"
    >
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {pending ? pendingLabel : label}
    </button>
  );
}

export default function AuthForm({
  mode,
  action,
}: {
  mode: "sign-in" | "sign-up";
  action: (prev: AuthState, formData: FormData) => Promise<AuthState>;
}) {
  const [state, formAction] = useFormState(action, { error: null });
  const isSignUp = mode === "sign-up";

  return (
    <main className="flex min-h-[70vh] items-center justify-center pt-10">
      <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white">
            <Youtube className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              {isSignUp ? "Create your account" : "Welcome back"}
            </h1>
            <p className="text-sm text-zinc-500">
              {isSignUp
                ? "Each account keeps its own folders and documents."
                : "Sign in to access your folders."}
            </p>
          </div>
        </div>

        <form action={formAction} className="mt-6 space-y-3">
          {isSignUp && (
            <input
              name="name"
              placeholder="Name"
              autoComplete="name"
              maxLength={100}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm outline-none placeholder:text-zinc-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
            />
          )}
          <input
            name="email"
            type="email"
            placeholder="Email"
            autoComplete="email"
            required
            className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm outline-none placeholder:text-zinc-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
          />
          <input
            name="password"
            type="password"
            placeholder="Password (min 8 characters)"
            autoComplete={isSignUp ? "new-password" : "current-password"}
            minLength={8}
            required
            className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm outline-none placeholder:text-zinc-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
          />
          {state.error && (
            <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
              {state.error}
            </p>
          )}
          <SubmitButton
            label={isSignUp ? "Sign up" : "Sign in"}
            pendingLabel={isSignUp ? "Creating account…" : "Signing in…"}
          />
        </form>

        <p className="mt-4 text-center text-sm text-zinc-500">
          {isSignUp ? (
            <>
              Already have an account?{" "}
              <Link href="/auth/sign-in" className="font-semibold text-zinc-900 hover:underline">
                Sign in
              </Link>
            </>
          ) : (
            <>
              New here?{" "}
              <Link href="/auth/sign-up" className="font-semibold text-zinc-900 hover:underline">
                Create an account
              </Link>
            </>
          )}
        </p>
      </div>
    </main>
  );
}
