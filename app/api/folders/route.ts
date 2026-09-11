import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isDatabaseConfigured, missingDbMessage } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/server";

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: missingDbMessage() }, { status: 500 });
  }
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  try {
    const documents = await prisma.document.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { transcripts: true } } },
    });
    return NextResponse.json(documents);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Database error." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: missingDbMessage() }, { status: 500 });
  }
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { title?: string };
  const title = (body.title ?? "").trim().slice(0, 120);
  if (!title) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }
  const doc = await prisma.document.create({ data: { title, userId: user.id } });
  return NextResponse.json(doc, { status: 201 });
}
