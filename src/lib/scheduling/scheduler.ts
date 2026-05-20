import { prisma } from "@/lib/prisma";
import { getValidAccessToken } from "@/lib/auth/refreshToken";
import { fetchCalendarEvents } from "@/lib/calendar/fetchEvents";
import { computeFreeSlots } from "@/lib/calendar/computeFreeSlots";
import { callSchedulingAI } from "./callAI";
import { startOfDay, addDays } from "date-fns";
import type { Task } from "@/types/index";

export async function generateSchedule(userId: string, weekStart: Date): Promise<void> {
  const weekEnd = addDays(weekStart, 7);

  const accessToken = await getValidAccessToken(userId);
  const calEvents = await fetchCalendarEvents(accessToken, weekStart, weekEnd);
  const freeSlots = computeFreeSlots(calEvents, weekStart, weekEnd);

  const notes = await prisma.note.findMany({
    where: { userId },
    include: { tasks: { where: { completed: false } } },
  });

  const tasks: Task[] = notes.flatMap((n) =>
    n.tasks.map((t) => ({
      id: t.id,
      noteId: t.noteId,
      name: t.name,
      importance: t.importance as Task["importance"],
      durationMins: t.durationMins,
      timeWindows: t.timeWindows as Task["timeWindows"],
      repeatRule: t.repeatRule as Task["repeatRule"],
      completed: t.completed,
      position: t.position,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    }))
  );

  if (tasks.length === 0) {
    await prisma.scheduledPlan.upsert({
      where: { userId_weekStart: { userId, weekStart } },
      update: { generatedAt: new Date(), slots: { deleteMany: {} } },
      create: { userId, weekStart },
    });
    return;
  }

  const existingPlan = await prisma.scheduledPlan.findUnique({
    where: { userId_weekStart: { userId, weekStart } },
    include: { slots: { where: { manuallyMoved: true } } },
  });

  const manuallyMovedTaskIds = new Set(
    existingPlan?.slots.map((s) => s.taskId) ?? []
  );

  const tasksToSchedule = tasks.filter((t) => !manuallyMovedTaskIds.has(t.id));
  const aiOutput = await callSchedulingAI(tasksToSchedule, freeSlots);

  await prisma.$transaction(async (tx) => {
    const plan = await tx.scheduledPlan.upsert({
      where: { userId_weekStart: { userId, weekStart } },
      update: { generatedAt: new Date() },
      create: { userId, weekStart },
    });

    await tx.scheduledSlot.deleteMany({
      where: { planId: plan.id, manuallyMoved: false },
    });

    for (const item of aiOutput.scheduled) {
      await tx.scheduledSlot.create({
        data: {
          planId: plan.id,
          taskId: item.taskId,
          startTime: new Date(item.slotStart),
          endTime: new Date(item.slotEnd),
        },
      });
    }

    for (const skipped of aiOutput.skipped) {
      await tx.scheduledSlot.create({
        data: {
          planId: plan.id,
          taskId: skipped.taskId,
          startTime: weekStart,
          endTime: weekStart,
          skipped: true,
          skipReason: `${skipped.reason} — ${skipped.suggestion}`,
        },
      });
    }
  });
}
