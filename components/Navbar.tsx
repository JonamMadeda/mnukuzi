"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Youtube } from "lucide-react";
import SignOutButton from "@/components/SignOutButton";

export default function Navbar({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();
  const inConsole = pathname.startsWith("/console");

  return (
    <nav className="flex items-center gap-3 border-b border-zinc-200 py-3">
      <Link href="/" className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-white">
          <Youtube className="h-4 w-4" />
        </span>
        <span className="text-sm font-bold tracking-tight">Mnukuzi</span>
      </Link>
      <div className="ml-auto flex items-center gap-2">
        {signedIn ? (
          <>
            {!inConsole && (
              <Link
                href="/console"
                className="rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary-light"
              >
                Console
              </Link>
            )}
            <SignOutButton />
          </>
        ) : (
          <>
            <Link
              href="/auth/sign-in"
              className="rounded-xl px-3 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100"
            >
              Sign in
            </Link>
            <Link
              href="/auth/sign-up"
              className="rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary-light"
            >
              Sign up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
