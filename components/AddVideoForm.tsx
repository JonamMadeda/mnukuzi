"use client";

import { useState } from "react";
import { Loader2, Link2 } from "lucide-react";

export default function AddVideoForm({
  onAdd,
}: {
  onAdd: (url: string) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim() || loading) return;
    setLoading(true);
    setError(null);
    const res = await onAdd(url.trim());
    setLoading(false);
    if (res.ok) {
      setUrl("");
    } else {
      setError(res.error ?? "Something went wrong.");
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
      <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Link2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste any YouTube URL — watch, youtu.be, or Shorts…"
            inputMode="url"
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-3 pl-10 pr-3 text-sm outline-none placeholder:text-zinc-400 focus:border-brand-600 focus:bg-white focus:ring-2 focus:ring-brand-600/20"
          />
        </div>
        <button
          type="submit"
          disabled={!url.trim() || loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-light disabled:opacity-50"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Extracting…" : "Add document"}
        </button>
      </form>
      {loading && (
        <p className="mt-3 flex items-center gap-2 text-sm text-zinc-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Fetching captions & video details on the server…
        </p>
      )}
      {error && (
        <p className="mt-3 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
