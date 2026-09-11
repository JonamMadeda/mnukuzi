"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isDatabaseConfigured, missingDbMessage } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/server";
import { extractTranscript } from "@/lib/extract";
import { extractVideoId } from "@/lib/youtube";

function requireDb() {
  if (!isDatabaseConfigured()) {
    return missingDbMessage();
  }
  return null;
}

async function requireUser() {
  const user = await getSessionUser();
  if (!user) return { error: "Please sign in to manage folders." as const, user: null };
  return { error: null, user };
}

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string };

/** Server Action: create a folder owned by the signed-in user. */
export async function createDocument(title: string) {
  const dbError = requireDb();
  if (dbError) return { ok: false as const, error: dbError };
  const { error, user } = await requireUser();
  if (error || !user) return { ok: false as const, error };
  const clean = title.trim().slice(0, 120);
  if (!clean) return { ok: false as const, error: "Title is required." };
  const doc = await prisma.document.create({ data: { title: clean, userId: user.id } });
  revalidatePath("/console");
  return { ok: true as const, data: doc };
}

/** Server Action: delete own folder (cascades transcripts). */
export async function deleteDocument(id: string) {
  const dbError = requireDb();
  if (dbError) return { ok: false as const, error: dbError };
  const { error, user } = await requireUser();
  if (error || !user) return { ok: false as const, error };
  await prisma.document.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/console");
  return { ok: true as const, data: null };
}

/**
 * Server Action: paste any YouTube URL -> extract ID, fetch captions +
 * details server-side (no CORS), save linked to documentId.
 * Idempotent: returns existing row if video already saved in this doc.
 */
export async function addVideoToDocument(documentId: string, url: string) {
  const dbError = requireDb();
  if (dbError) return { ok: false as const, error: dbError };
  const { error, user } = await requireUser();
  if (error || !user) return { ok: false as const, error };
  const videoId = extractVideoId(url);
  if (!videoId) {
    return {
      ok: false as const,
      error: "Could not detect a YouTube video ID. Paste a watch, youtu.be, or Shorts URL.",
    };
  }

  const doc = await prisma.document.findFirst({
    where: { id: documentId, userId: user.id },
  });
  if (!doc) return { ok: false as const, error: "Folder not found." };

  const existing = await prisma.transcript.findUnique({
    where: { documentId_videoId: { documentId, videoId } },
  });
  if (existing) {
    return { ok: false as const, error: "This video is already saved in this document." };
  }

  let extracted;
  try {
    extracted = await extractTranscript(videoId);
  } catch (e) {
    return {
      ok: false as const,
      error: e instanceof Error ? e.message : "Failed to fetch transcript.",
    };
  }

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

  revalidatePath(`/folder/${documentId}`);
  return { ok: true as const, data: saved };
}

/** Server Action: delete a single document from own folder. */
export async function deleteTranscript(documentId: string, transcriptId: string) {
  const dbError = requireDb();
  if (dbError) return { ok: false as const, error: dbError };
  const { error, user } = await requireUser();
  if (error || !user) return { ok: false as const, error };
  const doc = await prisma.document.findFirst({
    where: { id: documentId, userId: user.id },
  });
  if (!doc) return { ok: false as const, error: "Folder not found." };
  await prisma.transcript.deleteMany({ where: { id: transcriptId, documentId } });
  revalidatePath(`/folder/${documentId}`);
  return { ok: true as const, data: null };
}
