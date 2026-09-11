import { prisma } from "@/lib/prisma";
import { isDatabaseConfigured } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/server";
import DbSetupGuide from "@/components/DbSetupGuide";
import PublicLanding from "@/components/PublicLanding";
import HomeClient from "./HomeClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  if (!isDatabaseConfigured()) {
    return <DbSetupGuide />;
  }

  const user = await getSessionUser();
  if (!user) {
    return <PublicLanding />;
  }

  try {
    // One-time transition: folders created before auth existed have no
    // owner — assign them to the first signed-in user so nothing is lost.
    await prisma.document.updateMany({
      where: { userId: null },
      data: { userId: user.id },
    });
  } catch {
    // Non-fatal; folder listing below will surface real DB errors.
  }

  let documents: {
    id: string;
    title: string;
    createdAt: Date;
    _count: { transcripts: number };
  }[];
  try {
    documents = await prisma.document.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { transcripts: true } } },
    });
  } catch (e) {
    return <DbSetupGuide detail={e instanceof Error ? e.message : String(e)} />;
  }

  const serialized = documents.map((d) => ({
    id: d.id,
    title: d.title,
    createdAt: d.createdAt.toISOString(),
    count: d._count.transcripts,
  }));

  return <HomeClient initialDocuments={serialized} />;
}
