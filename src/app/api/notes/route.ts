import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createNoteSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  color: z.string().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUniqueOrThrow({ where: { email: session.user.email } });

  const notes = await prisma.note.findMany({
    where: { userId: user.id },
    include: { tasks: { orderBy: { position: "asc" } } },
    orderBy: { position: "asc" },
  });

  return NextResponse.json(notes);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUniqueOrThrow({ where: { email: session.user.email } });

  const body = createNoteSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.issues }, { status: 400 });

  const maxPosition = await prisma.note.aggregate({
    where: { userId: user.id },
    _max: { position: true },
  });

  const note = await prisma.note.create({
    data: {
      userId: user.id,
      title: body.data.title,
      description: body.data.description,
      color: body.data.color,
      position: (maxPosition._max.position ?? -1) + 1,
    },
    include: { tasks: true },
  });

  return NextResponse.json(note, { status: 201 });
}
