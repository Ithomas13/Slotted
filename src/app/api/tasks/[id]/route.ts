import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const updateTaskSchema = z.object({
  name: z.string().min(1).optional(),
  importance: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  durationMins: z.number().int().min(1).optional(),
  timeWindows: z
    .array(z.object({ start: z.string(), end: z.string(), label: z.string().optional() }))
    .nullable()
    .optional(),
  repeatRule: z.enum(["NONE", "DAILY", "WEEKLY"]).optional(),
  completed: z.boolean().optional(),
  position: z.number().int().min(0).optional(),
});

async function requireTaskOwnership(taskId: string, userEmail: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { email: userEmail } });
  const task = await prisma.task.findUnique({ where: { id: taskId }, include: { note: true } });
  if (!task || task.note.userId !== user.id) return null;
  return { task, user };
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const ownership = await requireTaskOwnership(id, session.user.email);
  if (!ownership) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = updateTaskSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.issues }, { status: 400 });

  const { timeWindows, ...rest } = body.data;
  const updated = await prisma.task.update({
    where: { id },
    data: {
      ...rest,
      ...(timeWindows !== undefined && {
        timeWindows: timeWindows === null ? Prisma.JsonNull : timeWindows,
      }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const ownership = await requireTaskOwnership(id, session.user.email);
  if (!ownership) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.task.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
