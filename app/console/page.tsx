import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isDatabaseConfigured } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/server";
import DbSetupGuide from "@/components/DbSetupGuide";
import HomeClient from "./HomeClient";

export const dynamic = "force-dynamic";

export default async function ConsolePage() {
  if (!isDatabaseConfigured()) {
    return <DbSetupGuide />;
  }

  // Defense in depth — middleware already requires auth for /console.
  const user = await getSessionUser();
  if (!user) {
    redirect("/auth/sign-in");
  }

  let documents: {
    id: string;
    title: string;
    createdAt: Date;
    updatedAt: Date;
    transcripts: { thumbnail: string | null }[];
    _count: { transcripts: number };
  }[];
  try {
    documents = await prisma.document.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        transcripts: {
          select: { thumbnail: true },
          orderBy: { createdAt: "desc" },
          take: 4,
        },
        _count: { select: { transcripts: true } },
      },
    });
  } catch (e) {
    return <DbSetupGuide detail={e instanceof Error ? e.message : String(e)} />;
  }

  const serialized = documents.map((d) => ({
    id: d.id,
    title: d.title,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
    thumbs: d.transcripts.map((t) => t.thumbnail).filter((t): t is string => Boolean(t)),
    count: d._count.transcripts,
  }));

  return <HomeClient initialDocuments={serialized} />;
}
