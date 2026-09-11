export type CaptionItem = {
  text: string;
  offset: number; // ms
  duration: number; // ms
};

const VIDEO_ID_RE = /^[a-zA-Z0-9_-]{11}$/;

/**
 * Extracts a YouTube video ID from any common URL shape.
 * Supports: watch?v=, youtu.be/, /shorts/, /embed/, /live/, /v/
 * Returns null if no valid 11-char ID found.
 */
export function extractVideoId(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  if (VIDEO_ID_RE.test(raw)) return raw;

  let url: URL;
  try {
    // Allow pasting without protocol
    const normalized = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    url = new URL(normalized);
  } catch {
    return null;
  }

  const host = url.hostname.toLowerCase().replace(/^www\./, "").replace(/^m\./, "");

  // youtu.be/<id>
  if (host === "youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0];
    return id && VIDEO_ID_RE.test(id) ? id : null;
  }

  // youtube.com, youtube-nocookie.com, music.youtube.com etc.
  if (host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
    // /watch?v=<id>
    const v = url.searchParams.get("v");
    if (v && VIDEO_ID_RE.test(v)) return v;

    const parts = url.pathname.split("/").filter(Boolean);
    // /shorts/<id>, /embed/<id>, /live/<id>, /v/<id>
    if (parts.length >= 2 && ["shorts", "embed", "live", "v"].includes(parts[0])) {
      const id = parts[1];
      return VIDEO_ID_RE.test(id) ? id : null;
    }
  }

  // Fallback: scan for any 11-char token in the string
  const match = raw.match(/[a-zA-Z0-9_-]{11}/);
  return match ? match[0] : null;
}

export function canonicalWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export function thumbnailFor(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

export function formatTimestamp(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** Join captions into readable paragraphs (break roughly every ~600 chars at sentence end). */
export function captionsToParagraphs(captions: CaptionItem[]): string[] {
  const words: string[] = [];
  const clean = captions
    .map((c) => c.text.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+([,.!?;:])/g, "$1");

  if (!clean) return [];

  const sentences = clean.match(/[^.!?]+[.!?]+["”']?\s*|[^.!?]+$/g) ?? [clean];
  const paragraphs: string[] = [];
  let current = "";

  for (const s of sentences) {
    const next = (current ? current + " " : "") + s.trim();
    if (next.length > 600 && current) {
      paragraphs.push(current.trim());
      current = s.trim();
    } else {
      current = next;
    }
  }
  if (current.trim()) paragraphs.push(current.trim());
  return paragraphs.length ? paragraphs : [clean];
}
