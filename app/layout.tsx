import type { Metadata } from "next";
import Link from "next/link";
import { Youtube } from "lucide-react";
import "./globals.css";
import { getSessionUser } from "@/lib/auth/server";
import SignOutButton from "@/components/SignOutButton";

export const metadata: Metadata = {
  title: "Mnukuzi — YouTube transcript workspace",
  description:
    "Save YouTube transcripts into organized folders. Paste any link, get readable text with timestamps.",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();

  return (
    <html lang="en">
      <body className="min-h-screen">
        <div className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          <nav className="flex items-center gap-3 border-b border-zinc-200 py-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-900 text-white">
                <Youtube className="h-4 w-4" />
              </span>
              <span className="text-sm font-bold tracking-tight">Mnukuzi</span>
            </Link>
            <div className="ml-auto flex items-center gap-2">
              {user ? (
                <>
                  <span className="hidden max-w-48 truncate text-xs text-zinc-500 sm:block">
                    {user.name ?? user.email}
                  </span>
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
                    className="rounded-xl bg-zinc-900 px-3 py-2 text-xs font-semibold text-white hover:bg-zinc-700"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </nav>
          {children}
        </div>
      </body>
    </html>
  );
}
