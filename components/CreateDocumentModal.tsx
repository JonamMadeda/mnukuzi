"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";

export default function CreateDocumentModal({
  onCreate,
  openRequest = 0,
}: {
  onCreate: (title: string) => Promise<void>;
  /** Increment to open the modal from outside (e.g. empty-state CTA). */
  openRequest?: number;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (openRequest > 0) setOpen(true);
  }, [openRequest]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || saving) return;
    setSaving(true);
    try {
      await onCreate(title.trim());
      setTitle("");
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-light"
      >
        <Plus className="h-4 w-4" />
        Create New Folder
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4"
          onClick={() => !saving && setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold">New folder</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Give your collection a name, e.g. “React Course Notes”. You can add
              many documents inside it.
            </p>
            <form onSubmit={submit} className="mt-4 space-y-4">
              <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Folder title"
                maxLength={120}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm outline-none placeholder:text-zinc-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!title.trim() || saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-light disabled:opacity-50"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
