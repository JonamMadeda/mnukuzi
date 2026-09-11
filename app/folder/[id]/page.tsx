import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isDatabaseConfigured } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/server";
import DbSetupGuide from "@/components/DbSetupGuide";
import FolderClient from "./FolderClient";

export const dynamic = "force-dynamic";

export default async function DocumentPage({ params }: { params: { id: string } }) {
  if (!isDatabaseConfigured()) {
    return <DbSetupGuide />;
  }

  const user = await getSessionUser();
  if (!user) redirect("/auth/sign-in");

  let doc;
  try {
    doc = await prisma.document.findFirst({
      where: { id: params.id, userId: user.id },
      include: { transcripts: { orderBy: { createdAt: "desc" } } },
    });
  } catch (e) {
    return <DbSetupGuide detail={e instanceof Error ? e.message : String(e)} />;
  }
  if (!doc) notFound();

  return (
    <FolderClient
      folderId={doc.id}
      title={doc.title}
      createdAt={doc.createdAt.toISOString()}
      initialTranscripts={doc.transcripts.map((t) => ({
        id: t.id,
        videoId: t.videoId,
        videoUrl: t.videoUrl,
        title: t.title,
        thumbnail: t.thumbnail,
        text: t.text,
        captions: (t.captions as { text: string; offset: number; duration: number }[] | null) ?? null,
        createdAt: t.createdAt.toISOString(),
      }))}
    />
  );
}
