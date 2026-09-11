"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlignLeft,
  Check,
  Clock,
  Copy,
  ExternalLink,
  FileDown,
  Loader2,
  Trash2,
  X,
} from "lucide-react";
import { useToast } from "@/components/Toast";
import { formatTimestamp } from "@/lib/youtube";
import { exportTranscriptPdf } from "@/lib/pdf";
import type { TranscriptDTO } from "@/components/TranscriptCard";

/**
 * Dedicated reading modal for a single document (saved transcript).
 * Opens on top of the folder view so long lists below are never disturbed.
 */
export default function TranscriptReaderModal({
  transcript,
  onClose,
  onDelete,
}: {
  transcript: TranscriptDTO;
  onClose: () => void;
  onDelete: (id: string) => Promise<void>;
}) {
  const [mode, setMode] = useState<"text" | "timestamped">("text");
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { notify } = useToast();

  const paragraphs = useMemo(
    () => transcript.text.split(/\n\n+/).filter(Boolean),
    [transcript.text]
  );
  const captions = useMemo(
    () => (Array.isArray(transcript.captions) ? transcript.captions : []),
    [transcript.captions]
  );

  // Esc to close + lock background scroll while open.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  async function copyAll() {
    const payload =
      mode === "timestamped" && captions.length
        ? captions.map((c) => `[${formatTimestamp(c.offset)}] ${c.text}`).join("\n")
        : `${transcript.title}\n${transcript.videoUrl}\n\n${transcript.text}`;
    try {
      await navigator.clipboard.writeText(payload);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = payload;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    notify("Document copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleExportPdf() {
    if (exporting) return;
    setExporting(true);
    try {
      await exportTranscriptPdf(transcript, mode);
      notify("PDF downloaded");
    } catch {
      notify("PDF export failed", "error");
    } finally {
      setExporting(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Remove "${transcript.title}" from this folder?`)) return;
    setDeleting(true);
    try {
      await onDelete(transcript.id);
      notify("Document removed");
      onClose();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={transcript.title}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-zinc-100 p-4 sm:p-5">
          {transcript.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={transcript.thumbnail}
              alt=""
              className="h-14 w-24 shrink-0 rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-14 w-24 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-xs text-zinc-400">
              No image
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-semibold text-zinc-900">
              {transcript.title}
            </h2>
            <p className="mt-0.5 truncate text-xs text-zinc-500">{transcript.videoUrl}</p>
            <p className="mt-1 text-xs text-zinc-400">
              {captions.length ? `${captions.length} caption lines` : "Full text"} ·{" "}
              {new Date(transcript.createdAt).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={onClose}
            title="Close reader"
            className="shrink-0 rounded-xl border border-zinc-200 p-2 text-zinc-500 hover:bg-zinc-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-zinc-100 px-4 py-3 sm:px-5">
          <div className="inline-flex rounded-xl bg-zinc-100 p-1 text-xs font-semibold">
            <button
              onClick={() => setMode("text")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
                mode === "text" ? "bg-white text-zinc-900 shadow" : "text-zinc-500"
              }`}
            >
              <AlignLeft className="h-3.5 w-3.5" />
              Readable text
            </button>
            <button
              onClick={() => setMode("timestamped")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
                mode === "timestamped" ? "bg-white text-zinc-900 shadow" : "text-zinc-500"
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              Timestamped
            </button>
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <a
              href={transcript.videoUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Watch
            </a>
            <button
              onClick={copyAll}
              className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3 py-2 text-xs font-semibold text-white hover:bg-zinc-700"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied!" : "Copy All"}
            </button>
            <button
              onClick={handleExportPdf}
              disabled={exporting}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 disabled:opacity-50"
            >
              {exporting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FileDown className="h-3.5 w-3.5" />
              )}
              {exporting ? "Exporting…" : "PDF"}
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              title="Remove document"
              className="inline-flex items-center rounded-xl border border-zinc-200 px-2.5 py-2 text-zinc-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Reading pane */}
        <div className="overflow-y-auto px-4 py-5 sm:px-6">
          {mode === "text" ? (
            <div className="transcript-body space-y-4">
              {paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          ) : captions.length ? (
            <ol className="divide-y divide-zinc-100 rounded-xl border border-zinc-100">
              {captions.map((c, i) => (
                <li key={i} className="flex gap-3 px-3.5 py-2.5 text-[15px] leading-6">
                  <span className="w-12 shrink-0 select-none pt-1 font-mono text-xs font-semibold text-zinc-400">
                    {formatTimestamp(c.offset)}
                  </span>
                  <span className="text-zinc-800">{c.text}</span>
                </li>
              ))}
            </ol>
          ) : (
            <div className="transcript-body space-y-4">
              {paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
