import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isDatabaseConfigured, missingDbMessage } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/server";
import { extractTranscript } from "@/lib/extract";
import { extractVideoId } from "@/lib/youtube";

/**
 * POST /api/folders/:id/transcripts { url }
 * Server-side extraction — no client CORS. Fetches captions + details, saves row.
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const documentId = params.id;
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: missingDbMessage() }, { status: 500 });
  }
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { url?: string };
  const videoId = extractVideoId(body.url ?? "");

  if (!videoId) {
    return NextResponse.json(
      { error: "Could not detect a YouTube video ID from that URL." },
      { status: 400 }
    );
  }

  const doc = await prisma.document.findFirst({
    where: { id: documentId, userId: user.id },
  });
  if (!doc) return NextResponse.json({ error: "Folder not found." }, { status: 404 });

  const existing = await prisma.transcript.findUnique({
    where: { documentId_videoId: { documentId, videoId } },
  });
  if (existing) {
    return NextResponse.json(
      { error: "This video is already saved in this document.", transcript: existing },
      { status: 409 }
    );
  }

  try {
    const extracted = await extractTranscript(videoId);
    const saved = await prisma.transcript.create({
      data: {
        documentId,
        videoId: extracted.videoId,
        videoUrl: extracted.videoUrl,
        title: extracted.title.slice(0, 500),
        thumbnail: extracted.thumbnail,
        text: extracted.text,
        captions: extracted.captions,
      },
    });
    return NextResponse.json(saved, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch transcript." },
      { status: 422 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const transcriptId = searchParams.get("transcriptId");
  if (!transcriptId) {
    return NextResponse.json({ error: "transcriptId required." }, { status: 400 });
  }
  const owner = await prisma.document.findFirst({
    where: { id: params.id, userId: user.id },
    select: { id: true },
  });
  if (!owner) return NextResponse.json({ error: "Folder not found." }, { status: 404 });
  await prisma.transcript.deleteMany({
    where: { id: transcriptId, documentId: params.id },
  });
  return NextResponse.json({ ok: true });
}
