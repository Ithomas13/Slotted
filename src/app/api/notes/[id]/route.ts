import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateNoteSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  position: z.number().int().min(0).optional(),
});

async function requireNoteOwnership(noteId: string, userEmail: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { email: userEmail } });
  const note = await prisma.note.findUnique({ where: { id: noteId } });
  if (!note || note.userId !== user.id) return null;
  return { note, user };
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const ownership = await requireNoteOwnership(id, session.user.email);
  if (!ownership) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = updateNoteSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.issues }, { status: 400 });

  const updated = await prisma.note.update({
    where: { id },
    data: body.data,
    include: { tasks: { orderBy: { position: "asc" } } },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const ownership = await requireNoteOwnership(id, session.user.email);
  if (!ownership) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.note.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
