import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const weekStartParam = searchParams.get("weekStart");
  if (!weekStartParam) return NextResponse.json({ error: "weekStart required" }, { status: 400 });

  const user = await prisma.user.findUniqueOrThrow({ where: { email: session.user.email } });

  const plan = await prisma.scheduledPlan.findUnique({
    where: { userId_weekStart: { userId: user.id, weekStart: new Date(weekStartParam) } },
    include: {
      slots: {
        include: { task: true },
        orderBy: { startTime: "asc" },
      },
    },
  });

  return NextResponse.json(plan);
}
