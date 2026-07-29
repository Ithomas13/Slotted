import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createTaskSchema } from "@/lib/tasks/validation";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: noteId } = await params;
  const user = await prisma.user.findUniqueOrThrow({ where: { email: session.user.email } });
  const note = await prisma.note.findUnique({ where: { id: noteId } });
  if (!note || note.userId !== user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const tasks = await prisma.task.findMany({
    where: { noteId },
    orderBy: { position: "asc" },
  });

  return NextResponse.json(tasks);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: noteId } = await params;
  const user = await prisma.user.findUniqueOrThrow({ where: { email: session.user.email } });
  const note = await prisma.note.findUnique({ where: { id: noteId } });
  if (!note || note.userId !== user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = createTaskSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.issues }, { status: 400 });

  const maxPosition = await prisma.task.aggregate({
    where: { noteId },
    _max: { position: true },
  });

  const task = await prisma.task.create({
    data: {
      noteId,
      name: body.data.name,
      importance: body.data.importance,
      durationMins: body.data.durationMins,
      timeWindows: body.data.timeWindows ?? [],
      repeatRule: body.data.repeatRule ?? "NONE",
      position: (maxPosition._max.position ?? -1) + 1,
    },
  });

  return NextResponse.json(task, { status: 201 });
}
