import Link from "next/link";
import { FolderOpen, Youtube, FileDown, Copy } from "lucide-react";

export default function PublicLanding() {
  return (
    <main className="pt-10">
      <header className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-900 text-white">
          <Youtube className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mnukuzi</h1>
          <p className="text-sm text-zinc-500">
            Folders for your YouTube research — each folder holds many documents.
          </p>
        </div>
      </header>

      <div className="mx-auto mt-10 max-w-2xl rounded-3xl border border-zinc-200 bg-white p-6 text-center shadow-sm sm:p-10">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100">
          <FolderOpen className="h-6 w-6 text-zinc-600" />
        </div>
        <h2 className="mt-4 text-xl font-bold tracking-tight">
          Save YouTube transcripts, your way
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
          Create folders, paste any YouTube link, and get readable, timestamped
          documents you can copy or export as PDF. Each account keeps its own
          private library.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <Link
            href="/auth/sign-up"
            className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700"
          >
            Create free account
          </Link>
          <Link
            href="/auth/sign-in"
            className="inline-flex items-center justify-center rounded-xl border border-zinc-200 px-5 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
          >
            Sign in
          </Link>
        </div>
        <div className="mt-6 flex items-center justify-center gap-5 text-xs text-zinc-400">
          <span className="inline-flex items-center gap-1">
            <Copy className="h-3.5 w-3.5" /> Copy captions
          </span>
          <span className="inline-flex items-center gap-1">
            <FileDown className="h-3.5 w-3.5" /> Export PDF
          </span>
        </div>
      </div>
    </main>
  );
}
