import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getValidAccessToken } from "@/lib/auth/refreshToken";
import { fetchCalendarEvents } from "@/lib/calendar/fetchEvents";
import { computeFreeSlots } from "@/lib/calendar/computeFreeSlots";
import { addDays, startOfDay } from "date-fns";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUniqueOrThrow({ where: { email: session.user.email } });
  const accessToken = await getValidAccessToken(user.id);

  const weekStart = startOfDay(new Date());
  const weekEnd = addDays(weekStart, 7);

  const events = await fetchCalendarEvents(accessToken, weekStart, weekEnd);
  const freeSlots = computeFreeSlots(events, weekStart, weekEnd);

  return NextResponse.json({ events, freeSlots });
}
