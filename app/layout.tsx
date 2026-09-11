import type { Metadata } from "next";
import "./globals.css";
import { getSessionUser } from "@/lib/auth/server";
import Navbar from "@/components/Navbar";

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
          <Navbar signedIn={Boolean(user)} />
          {children}
        </div>
      </body>
    </html>
  );
}
