import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isDatabaseConfigured, missingDbMessage } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/server";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: missingDbMessage() }, { status: 500 });
  }
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const doc = await prisma.document.findFirst({
    where: { id: params.id, userId: user.id },
    include: {
      transcripts: { orderBy: { createdAt: "desc" } },
      _count: { select: { transcripts: true } },
    },
  });
  if (!doc) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json(doc);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: missingDbMessage() }, { status: 500 });
  }
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  await prisma.document.deleteMany({ where: { id: params.id, userId: user.id } });
  return NextResponse.json({ ok: true });
}
