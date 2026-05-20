import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSlotSchema = z.object({
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  manuallyMoved: z.boolean().optional(),
});

async function requireSlotOwnership(slotId: string, userEmail: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { email: userEmail } });
  const slot = await prisma.scheduledSlot.findUnique({
    where: { id: slotId },
    include: { plan: true },
  });
  if (!slot || slot.plan.userId !== user.id) return null;
  return { slot, user };
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const ownership = await requireSlotOwnership(id, session.user.email);
  if (!ownership) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = updateSlotSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.issues }, { status: 400 });

  const updated = await prisma.scheduledSlot.update({
    where: { id },
    data: {
      ...(body.data.startTime && { startTime: new Date(body.data.startTime) }),
      ...(body.data.endTime && { endTime: new Date(body.data.endTime) }),
      ...(body.data.manuallyMoved !== undefined && { manuallyMoved: body.data.manuallyMoved }),
    },
    include: { task: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const ownership = await requireSlotOwnership(id, session.user.email);
  if (!ownership) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.scheduledSlot.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
