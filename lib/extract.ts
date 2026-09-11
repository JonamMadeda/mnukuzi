import { YoutubeTranscript } from "youtube-transcript";
import {
  canonicalWatchUrl,
  captionsToParagraphs,
  thumbnailFor,
  type CaptionItem,
} from "@/lib/youtube";

export type VideoDetails = {
  title: string;
  thumbnail: string;
  author?: string;
};

export type ExtractResult = {
  videoId: string;
  videoUrl: string;
  title: string;
  thumbnail: string;
  text: string;
  captions: CaptionItem[];
  paragraphs: string[];
};

/**
 * Fetch title/thumbnail server-side WITHOUT a YouTube API key,
 * using the public oEmbed endpoint. No CORS issues (server-to-server).
 */
export async function fetchVideoDetails(videoId: string): Promise<VideoDetails> {
  const watchUrl = canonicalWatchUrl(videoId);
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`,
      { next: { revalidate: 86400 } }
    );
    if (res.ok) {
      const data = (await res.json()) as {
        title?: string;
        author_name?: string;
        thumbnail_url?: string;
      };
      if (data.title) {
        return {
          title: data.title,
          thumbnail: data.thumbnail_url ?? thumbnailFor(videoId),
          author: data.author_name,
        };
      }
    }
  } catch {
    // fall through to defaults
  }
  return { title: `YouTube video ${videoId}`, thumbnail: thumbnailFor(videoId) };
}

/** Fetch captions server-side via youtube-transcript (no browser CORS). */
export async function fetchCaptions(videoId: string): Promise<CaptionItem[]> {
  const raw = await YoutubeTranscript.fetchTranscript(videoId);
  return raw.map((c) => ({
    text: c.text ?? "",
    offset: Number(c.offset ?? 0),
    duration: Number(c.duration ?? 0),
  }));
}

/** Full pipeline: captions + details + joined text. Throws with friendly message on failure. */
export async function extractTranscript(videoId: string): Promise<ExtractResult> {
  let captions: CaptionItem[];
  try {
    captions = await fetchCaptions(videoId);
  } catch (err) {
    throw new Error(
      "No captions found for this video. The video may have captions disabled, be private/age-restricted, or be a valid ID with no transcript track."
    );
  }
  if (!captions.length) {
    throw new Error("No captions found for this video (empty transcript).");
  }

  const details = await fetchVideoDetails(videoId);
  const paragraphs = captionsToParagraphs(captions);
  const text = paragraphs.join("\n\n");

  return {
    videoId,
    videoUrl: canonicalWatchUrl(videoId),
    title: details.title,
    thumbnail: details.thumbnail,
    text,
    captions,
    paragraphs,
  };
}
