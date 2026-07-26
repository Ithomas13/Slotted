import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateSchedule } from "@/lib/scheduling/scheduler";
import { parseWeekStart } from "@/lib/scheduling/weekStart";
import { z } from "zod";

const generateSchema = z.object({
  weekStart: z.string(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUniqueOrThrow({ where: { email: session.user.email } });

  const body = generateSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.issues }, { status: 400 });

  const weekStart = parseWeekStart(body.data.weekStart);
  if (!weekStart) return NextResponse.json({ error: "Invalid weekStart" }, { status: 400 });

  await generateSchedule(user.id, weekStart);

  const plan = await prisma.scheduledPlan.findUnique({
    where: { userId_weekStart: { userId: user.id, weekStart } },
    include: {
      slots: {
        include: { task: true },
        orderBy: { startTime: "asc" },
      },
    },
  });

  return NextResponse.json(plan, { status: 201 });
}
