import type { Task } from "@/types/index";

export const SCHEDULING_SYSTEM_PROMPT = `You are an AI scheduling assistant. Your job is to schedule tasks into free time slots on a weekly calendar.

Rules:
1. Schedule tasks in priority order: CRITICAL first, then HIGH, MEDIUM, LOW.
2. Respect task timeWindows if present (e.g. only schedule "dog walk" between 08:00–20:00).
3. Do NOT split a task across multiple slots — each task must fit entirely in one free slot.
4. If a task does not fit in any available slot, add it to the skipped list.
5. Output ONLY valid JSON matching the schema below — no explanation, no markdown.

Output schema:
{
  "scheduled": [
    { "taskId": "string", "slotStart": "ISO8601 datetime", "slotEnd": "ISO8601 datetime" }
  ],
  "skipped": [
    { "taskId": "string", "reason": "string", "suggestion": "string" }
  ]
}`;

export function buildTaskContext(tasks: Task[]): string {
  return JSON.stringify(
    tasks.map((t) => ({
      id: t.id,
      name: t.name,
      importance: t.importance,
      durationMins: t.durationMins,
      timeWindows: t.timeWindows ?? [],
      repeatRule: t.repeatRule,
    }))
  );
}
