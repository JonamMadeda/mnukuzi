"use client";

import { useMemo } from "react";
import { BookOpen } from "lucide-react";

export type TranscriptDTO = {
  id: string;
  videoId: string;
  videoUrl: string;
  title: string;
  thumbnail: string | null;
  text: string;
  captions: { text: string; offset: number; duration: number }[] | null;
  createdAt: string;
};

/**
 * Compact document row inside a folder.
 * Clicking opens the dedicated reader modal — the list itself never expands,
 * so folders with many documents stay scannable.
 */
export default function TranscriptCard({
  transcript,
  onOpen,
}: {
  transcript: TranscriptDTO;
  onOpen: (transcript: TranscriptDTO) => void;
}) {
  const captions = useMemo(
    () => (Array.isArray(transcript.captions) ? transcript.captions : []),
    [transcript.captions]
  );

  return (
    <button
      onClick={() => onOpen(transcript)}
      className="group flex w-full items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-4 text-left shadow-sm transition hover:shadow-md"
    >
      {transcript.thumbnail ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={transcript.thumbnail}
          alt=""
          className="h-16 w-28 shrink-0 rounded-lg object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex h-16 w-28 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-xs text-zinc-400">
          No image
        </div>
      )}
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-[15px] font-semibold text-zinc-900">
          {transcript.title}
        </h3>
        <p className="mt-0.5 truncate text-xs text-zinc-500">{transcript.videoUrl}</p>
        <p className="mt-1 text-xs text-zinc-400">
          {captions.length ? `${captions.length} caption lines` : "Full text"} ·{" "}
          {new Date(transcript.createdAt).toLocaleDateString()}
        </p>
      </div>
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-zinc-100 px-3 py-2 text-xs font-semibold text-zinc-600 transition group-hover:bg-primary group-hover:text-white">
        <BookOpen className="h-3.5 w-3.5" />
        Read
      </span>
    </button>
  );
}
