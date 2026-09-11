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

const FETCH_TIMEOUT_MS = 12000;

// Public embedded API key used by YouTube's own clients. Not a secret.
const INNERTUBE_KEY = "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8";

function withTimeout(): AbortSignal {
  return AbortSignal.timeout(FETCH_TIMEOUT_MS);
}

function stripTags(s: string): string {
  return s
    .replace(/<[^>]*>/g, "")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function vttTimestampToMs(t: string): number {
  const parts = t.trim().split(":");
  let h = 0;
  let m = 0;
  let s = 0;
  if (parts.length === 3) {
    h = Number(parts[0]);
    m = Number(parts[1]);
    s = Number(parts[2].replace(",", "."));
  } else if (parts.length === 2) {
    m = Number(parts[0]);
    s = Number(parts[1].replace(",", "."));
  }
  return Math.round((h * 3600 + m * 60 + s) * 1000);
}

function parseVtt(vtt: string): CaptionItem[] {
  const out: CaptionItem[] = [];
  const blocks = vtt.replace(/\r/g, "").split("\n\n");
  for (const block of blocks) {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length || lines[0] === "WEBVTT") continue;
    // Cue header may be lines[0] or lines[1] (when a cue id precedes it).
    const headIdx = lines.findIndex((l) => l.includes("-->"));
    if (headIdx === -1) continue;
    const [startRaw, endRaw] = lines[headIdx].split("-->").map((s) => s.trim());
    const start = vttTimestampToMs(startRaw.split(" ")[0]);
    const end = vttTimestampToMs((endRaw ?? "").split(" ")[0]);
    const text = lines
      .slice(headIdx + 1)
      .map(stripTags)
      .filter(Boolean)
      .join(" ");
    if (text) out.push({ text, offset: start, duration: Math.max(0, end - start) });
  }
  return out;
}

function parseSrv3(xml: string): CaptionItem[] {
  const out: CaptionItem[] = [];
  // Variant A: <text start="12.34" dur="5.67"> (seconds, float)
  const textRe = /<text start="([\d.]+)" dur="([\d.]+)"[^>]*>([\s\S]*?)<\/text>/g;
  let m: RegExpExecArray | null;
  while ((m = textRe.exec(xml)) !== null) {
    const text = stripTags(m[3]);
    if (text) {
      out.push({
        text,
        offset: Math.round(Number(m[1]) * 1000),
        duration: Math.round(Number(m[2]) * 1000),
      });
    }
  }
  if (out.length) return out;
  // Variant B: <p t="1360" d="1680"> (milliseconds, int)
  const pRe = /<p t="(\d+)" d="(\d+)"[^>]*>([\s\S]*?)<\/p>/g;
  while ((m = pRe.exec(xml)) !== null) {
    const text = stripTags(m[3]);
    if (text) {
      out.push({ text, offset: Number(m[1]), duration: Number(m[2]) });
    }
  }
  return out;
}

/**
 * Fallback caption fetch via YouTube's InnerTube Player API.
 * Unlike watch-page HTML scraping, this endpoint generally still returns
 * caption tracks from cloud/datacenter IPs (e.g. Vercel) where the
 * `youtube-transcript` scraper gets a bot-check page with no tracks.
 */
async function fetchCaptionsInnerTube(videoId: string): Promise<CaptionItem[]> {
  const playerRes = await fetch(
    `https://www.youtube.com/youtubei/v1/player?key=${INNERTUBE_KEY}`,
    {
      method: "POST",
      signal: withTimeout(),
      headers: {
        "Content-Type": "application/json",
        "User-Agent":
          "com.google.android.youtube/20.10.38 (Linux; U; Android 13; en_US)",
        "X-Youtube-Client-Name": "3",
        "X-Youtube-Client-Version": "20.10.38",
      },
      body: JSON.stringify({
        context: {
          client: {
            clientName: "ANDROID",
            clientVersion: "20.10.38",
            androidSdkVersion: 33,
            hl: "en",
            gl: "US",
          },
        },
        videoId,
      }),
    }
  );
  if (!playerRes.ok) throw new Error(`player API http=${playerRes.status}`);

  const player = (await playerRes.json()) as {
    playabilityStatus?: { status?: string; reason?: string };
    captions?: {
      playerCaptionsTracklistRenderer?: {
        captionTracks?: {
          baseUrl: string;
          languageCode?: string;
          kind?: string;
        }[];
      };
    };
  };
  const tracks =
    player.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
  if (!tracks.length) {
    const ps = player.playabilityStatus;
    throw new Error(
      `no-tracks play=${ps?.status ?? "?"} reason=${(ps?.reason ?? "").slice(0, 60)}`
    );
  }

  const ranked = [...tracks].sort((a, b) => score(a) - score(b));
  function score(t: { languageCode?: string; kind?: string }): number {
    let s = 10;
    if ((t.languageCode ?? "").startsWith("en")) s -= 5;
    if (!t.kind || t.kind !== "asr") s -= 2; // prefer manual over auto
    return s;
  }

  let lastErr: unknown = null;
  for (const track of ranked.slice(0, 3)) {
    try {
      // One download per track: try VTT first, then srv3 XML on the same
      // body (the server often ignores `fmt` and returns srv3 regardless).
      const res = await fetch(`${track.baseUrl}&fmt=vtt`, {
        signal: withTimeout(),
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
      });
      if (res.ok) {
        const body = await res.text();
        const parsed = parseVtt(body);
        if (parsed.length) return parsed;
        const xmlParsed = parseSrv3(body);
        if (xmlParsed.length) return xmlParsed;
      }
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("all caption tracks failed");
}

/**
 * Last-resort caption fetch via public Piped API mirrors.
 * Different network egress than YouTube direct, so it can succeed where
 * both the scraper and InnerTube are IP-blocked. Instances are flaky, so
 * several are tried in order with short timeouts.
 */
const PIPED_INSTANCES = [
  "https://pipedapi.adminforge.de",
  "https://pipedapi.kavin.rocks",
  "https://pipedapi.reallyaweso.me",
  "https://api.piped.private.coffee",
];

async function fetchCaptionsPiped(videoId: string): Promise<CaptionItem[]> {
  let lastErr: unknown = null;
  for (const base of PIPED_INSTANCES) {
    try {
      const res = await fetch(`${base}/streams/${videoId}`, {
        signal: withTimeout(),
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
      });
      if (!res.ok) {
        lastErr = new Error(`${new URL(base).hostname} http=${res.status}`);
        continue;
      }
      const data = (await res.json()) as {
        subtitles?: { url: string; code?: string; autoGenerated?: boolean }[];
      };
      const subs = (data.subtitles ?? []).filter((s) => s.url);
      if (!subs.length) {
        lastErr = new Error(`${new URL(base).hostname} no-subs`);
        continue;
      }
      const ranked = [...subs].sort((a, b) => {
        const score = (s: { code?: string; autoGenerated?: boolean }) =>
          ((s.code ?? "").startsWith("en") ? 0 : 5) + (s.autoGenerated ? 2 : 0);
        return score(a) - score(b);
      });
      for (const sub of ranked.slice(0, 2)) {
        const subRes = await fetch(sub.url, {
          signal: withTimeout(),
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
        });
        if (!subRes.ok) continue;
        const body = await subRes.text();
        const parsed = parseVtt(body);
        if (parsed.length) return parsed;
        const xmlParsed = parseSrv3(body);
        if (xmlParsed.length) return xmlParsed;
      }
      lastErr = new Error(`${new URL(base).hostname} unparseable`);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("all piped instances failed");
}

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

/**
 * Managed transcript API (Supadata). Used FIRST when SUPADATA_API_KEY is
 * set — it runs on the provider's infrastructure, so it is unaffected by
 * YouTube's bot-walling of our server IPs. Skipped when unconfigured.
 * Docs: https://docs.supadata.ai — GET /v1/transcript?url=&lang=&mode=native
 */
async function fetchCaptionsSupadata(videoId: string): Promise<CaptionItem[]> {
  const key = process.env.SUPADATA_API_KEY?.trim();
  if (!key) throw new Error("no-key");
  const url = canonicalWatchUrl(videoId);

  const get = async (endpoint: string, timeoutMs: number) => {
    const res = await fetch(endpoint, {
      signal: AbortSignal.timeout(timeoutMs),
      headers: { "x-api-key": key, "Content-Type": "application/json" },
    });
    if (res.status === 401 || res.status === 403) throw new Error("bad-api-key");
    return res;
  };

  const toCaptions = (content: unknown): CaptionItem[] => {
    if (!Array.isArray(content)) return [];
    return content
      .map((c) => {
        const item = c as { text?: unknown; offset?: unknown; duration?: unknown };
        return {
          text: String(item.text ?? ""),
          offset: Number(item.offset ?? 0),
          duration: Number(item.duration ?? 0),
        };
      })
      .filter((c) => c.text);
  };

  const first = await get(
    `https://api.supadata.ai/v1/transcript?url=${encodeURIComponent(url)}&lang=en&mode=native`,
    25000
  );
  if (first.status === 200) {
    const done = toCaptions((await first.json())?.content);
    if (done.length) return done;
    throw new Error("empty-content");
  }
  if (first.status !== 202) throw new Error(`http=${first.status}`);
  // Async job — poll briefly.
  const jobId = (await first.json())?.jobId as string | undefined;
  if (!jobId) throw new Error("no-job-id");
  for (let i = 0; i < 6; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    const poll = await get(`https://api.supadata.ai/v1/transcript/${jobId}`, 15000);
    if (poll.status !== 200) continue;
    const body = await poll.json();
    if (body?.status === "failed" || body?.status === "error") {
      throw new Error(`job-${body.status}`);
    }
    const done = toCaptions(body?.content);
    if (done.length) return done;
    if (!body?.jobId) break; // completed without content
  }
  throw new Error("job-timeout");
}

/** Fetch captions server-side. Tries scraper, InnerTube, then Piped mirrors. */
export async function fetchCaptions(videoId: string): Promise<CaptionItem[]> {
  const diag: string[] = [];
  const timed = async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
    const start = Date.now();
    try {
      const result = await fn();
      const n = Array.isArray(result) ? result.length : 1;
      diag.push(`${name}=ok:${n}:${Date.now() - start}ms`);
      return result;
    } catch (e) {
      const reason =
        e instanceof Error ? e.message.slice(0, 80).replace(/\s+/g, " ") : String(e).slice(0, 80);
      diag.push(`${name}=FAIL:${reason}:${Date.now() - start}ms`);
      throw e;
    }
  };

  try {
    // Managed API first when configured — immune to IP bot-walls.
    return await timed("supadata", () => fetchCaptionsSupadata(videoId));
  } catch {
    // Absent key ("no-key") or provider failure — fall through to free methods.
  }

  try {
    const mapped = await timed("scraper", async () => {
      const raw = await YoutubeTranscript.fetchTranscript(videoId);
      return raw.map((c) => ({
        text: c.text ?? "",
        offset: Number(c.offset ?? 0),
        duration: Number(c.duration ?? 0),
      }));
    });
    if (mapped.length) return mapped;
    diag.push("scraper=empty");
  } catch {
    // fall through — routinely bot-blocked on cloud IPs
  }

  try {
    return await timed("innertube", () => fetchCaptionsInnerTube(videoId));
  } catch {
    // fall through to Piped mirrors
  }

  try {
    return await timed("piped", () => fetchCaptionsPiped(videoId));
  } catch {
    // no more strategies
  }

  console.warn(`[extract] all caption strategies failed for ${videoId}: ${diag.join(" | ")}`);
  throw new Error(`CAPTION_DIAG ${diag.join(" | ")}`);
}

/** Full pipeline: captions + details + joined text. Throws with friendly message on failure. */
export async function extractTranscript(videoId: string): Promise<ExtractResult> {
  let captions: CaptionItem[];
  try {
    captions = await fetchCaptions(videoId);
  } catch (err) {
    // fetchCaptions throws `CAPTION_DIAG ...` with per-strategy outcomes —
    // surface it so the live error says WHY, not just "no captions".
    const diag =
      err instanceof Error && err.message.startsWith("CAPTION_DIAG")
        ? ` [${err.message.replace("CAPTION_DIAG ", "")}]`
        : "";
    throw new Error(
      `No captions found for this video.${diag} The video may have captions disabled, be private/age-restricted, or YouTube may be rate-limiting the server — if a link works locally but not on the live site, wait a minute and try again.`
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
