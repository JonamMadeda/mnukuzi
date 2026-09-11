"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileDown, FolderOpen, Loader2, ScrollText } from "lucide-react";
import AddVideoForm from "@/components/AddVideoForm";
import TranscriptCard, { type TranscriptDTO } from "@/components/TranscriptCard";
import TranscriptReaderModal from "@/components/TranscriptReaderModal";
import { ToastProvider, useToast } from "@/components/Toast";
import { addVideoToDocument, deleteTranscript } from "@/actions/transcripts";
import { exportDocumentPdf } from "@/lib/pdf";

function FolderView({
  folderId,
  title,
  createdAt,
  initialTranscripts,
}: {
  folderId: string;
  title: string;
  createdAt: string;
  initialTranscripts: TranscriptDTO[];
}) {
  const [transcripts, setTranscripts] = useState<TranscriptDTO[]>(initialTranscripts);
  const [selected, setSelected] = useState<TranscriptDTO | null>(null);
  const [exportingAll, setExportingAll] = useState(false);
  const { notify } = useToast();

  async function handleAdd(url: string) {
    const res = await addVideoToDocument(folderId, url);
    if (!res.ok) return { ok: false as const, error: res.error };
    const t = res.data;
    setTranscripts((prev) => [
      {
        id: t.id,
        videoId: t.videoId,
        videoUrl: t.videoUrl,
        title: t.title,
        thumbnail: t.thumbnail,
        text: t.text,
        captions: (t.captions as TranscriptDTO["captions"]) ?? null,
        createdAt: t.createdAt.toISOString(),
      },
      ...prev,
    ]);
    notify("Document saved to folder");
    return { ok: true as const };
  }

  async function handleDelete(id: string) {
    await deleteTranscript(folderId, id);
    setTranscripts((prev) => prev.filter((t) => t.id !== id));
  }

  async function handleExportAll() {
    if (exportingAll || transcripts.length === 0) return;
    setExportingAll(true);
    try {
      await exportDocumentPdf(title, transcripts);
      notify("Folder PDF downloaded");
    } catch {
      notify("PDF export failed", "error");
    } finally {
      setExportingAll(false);
    }
  }

  return (
    <main className="pt-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-sm font-medium text-zinc-600 shadow-sm hover:bg-zinc-50"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Folders
      </Link>

      <div className="mt-5 flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-zinc-900 text-white">
          <FolderOpen className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-bold tracking-tight">{title}</h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            Created {new Date(createdAt).toLocaleDateString()} · {transcripts.length}{" "}
            document{transcripts.length === 1 ? "" : "s"}
          </p>
        </div>
        {transcripts.length > 0 && (
          <button
            onClick={handleExportAll}
            disabled={exportingAll}
            title="Download the whole folder as one PDF"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 disabled:opacity-50"
          >
            {exportingAll ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4" />
            )}
            {exportingAll ? "Exporting…" : "Export PDF"}
          </button>
        )}
      </div>

      <div className="mt-6">
        <AddVideoForm onAdd={handleAdd} />
      </div>

      <div className="mt-6 space-y-3">
        {transcripts.length === 0 ? (
          <div className="flex flex-col items-center rounded-3xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100">
              <ScrollText className="h-6 w-6 text-zinc-500" />
            </div>
            <h2 className="mt-4 text-lg font-semibold">No documents yet</h2>
            <p className="mt-1 max-w-md text-sm text-zinc-500">
              Paste any YouTube URL above — standard watch links, shortened youtu.be
              links, or Shorts — each one becomes a document in this folder. Add as
              many as you like.
            </p>
          </div>
        ) : (
          transcripts.map((t) => (
            <TranscriptCard key={t.id} transcript={t} onOpen={setSelected} />
          ))
        )}
      </div>

      {selected && (
        <TranscriptReaderModal
          transcript={selected}
          onClose={() => setSelected(null)}
          onDelete={handleDelete}
        />
      )}
    </main>
  );
}

export default function FolderClient(props: {
  folderId: string;
  title: string;
  createdAt: string;
  initialTranscripts: TranscriptDTO[];
}) {
  return (
    <ToastProvider>
      <FolderView {...props} />
    </ToastProvider>
  );
}
