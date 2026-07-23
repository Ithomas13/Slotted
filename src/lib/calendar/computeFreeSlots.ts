import type { CalendarEvent, FreeSlot } from "@/types/calendar";

const SLEEP_START_HOUR = 22;
const SLEEP_END_HOUR = 7;
const MIN_SLOT_MINS = 15;

interface Interval {
  start: Date;
  end: Date;
}

export interface BusyIntervalInput {
  start: Date | string;
  end: Date | string;
}

function durationMins(start: Date, end: Date): number {
  return (end.getTime() - start.getTime()) / 60000;
}

function toInterval(input: BusyIntervalInput): Interval | null {
  const start = input.start instanceof Date ? input.start : new Date(input.start);
  const end = input.end instanceof Date ? input.end : new Date(input.end);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return null;
  }

  return { start, end };
}

function addSleepBlocks(rangeStart: Date, rangeEnd: Date): Interval[] {
  const blocks: Interval[] = [];
  // Start one day before to capture the sleep block that extends into rangeStart morning
  const cursor = new Date(rangeStart);
  cursor.setDate(cursor.getDate() - 1);
  cursor.setHours(0, 0, 0, 0);

  while (cursor < rangeEnd) {
    const sleepStart = new Date(cursor);
    sleepStart.setHours(SLEEP_START_HOUR, 0, 0, 0);

    const sleepEnd = new Date(cursor);
    sleepEnd.setDate(sleepEnd.getDate() + 1);
    sleepEnd.setHours(SLEEP_END_HOUR, 0, 0, 0);

    blocks.push({ start: sleepStart, end: sleepEnd });
    cursor.setDate(cursor.getDate() + 1);
  }

  return blocks;
}

function parseDateLocal(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function eventsToIntervals(events: CalendarEvent[]): Interval[] {
  const intervals: Interval[] = [];

  for (const event of events) {
    if (event.allDay) {
      // Parse YYYY-MM-DD as local midnight to match how tests create Date objects
      intervals.push({ start: parseDateLocal(event.start), end: parseDateLocal(event.end) });
    } else {
      intervals.push({ start: new Date(event.start), end: new Date(event.end) });
    }
  }

  return intervals;
}

function mergeIntervals(intervals: Interval[]): Interval[] {
  if (intervals.length === 0) return [];
  const sorted = [...intervals].sort((a, b) => a.start.getTime() - b.start.getTime());
  const merged: Interval[] = [{ ...sorted[0] }];

  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1];
    if (sorted[i].start <= last.end) {
      last.end = new Date(Math.max(last.end.getTime(), sorted[i].end.getTime()));
    } else {
      merged.push({ ...sorted[i] });
    }
  }

  return merged;
}

export function computeFreeSlots(
  events: CalendarEvent[],
  rangeStart: Date,
  rangeEnd: Date
): FreeSlot[] {
  const eventIntervals = eventsToIntervals(events);
  const sleepBlocks = addSleepBlocks(rangeStart, rangeEnd);
  const allBlocked = mergeIntervals([...eventIntervals, ...sleepBlocks]);

  const clampedStart = new Date(rangeStart);
  const clampedEnd = new Date(rangeEnd);

  const freeSlots: FreeSlot[] = [];
  let cursor = clampedStart;

  for (const block of allBlocked) {
    if (block.start > clampedEnd) break;
    if (block.end <= cursor) continue;

    if (cursor < block.start) {
      const gapStart = new Date(Math.max(cursor.getTime(), clampedStart.getTime()));
      const gapEnd = new Date(Math.min(block.start.getTime(), clampedEnd.getTime()));
      const gapDurationMins = durationMins(gapStart, gapEnd);
      if (gapDurationMins >= MIN_SLOT_MINS) {
        freeSlots.push({ start: gapStart.toISOString(), end: gapEnd.toISOString(), durationMins: gapDurationMins });
      }
    }

    cursor = new Date(Math.max(cursor.getTime(), block.end.getTime()));
  }

  if (cursor < clampedEnd) {
    const gapDurationMins = durationMins(cursor, clampedEnd);
    if (gapDurationMins >= MIN_SLOT_MINS) {
      freeSlots.push({ start: cursor.toISOString(), end: clampedEnd.toISOString(), durationMins: gapDurationMins });
    }
  }

  return freeSlots;
}

export function subtractBusyIntervalsFromFreeSlots(
  freeSlots: FreeSlot[],
  busyIntervals: BusyIntervalInput[]
): FreeSlot[] {
  const busy = mergeIntervals(
    busyIntervals
      .map(toInterval)
      .filter((interval): interval is Interval => interval !== null)
  );

  if (busy.length === 0) return freeSlots;

  const available: FreeSlot[] = [];

  for (const slot of freeSlots) {
    const slotStart = new Date(slot.start);
    const slotEnd = new Date(slot.end);
    if (Number.isNaN(slotStart.getTime()) || Number.isNaN(slotEnd.getTime()) || slotEnd <= slotStart) {
      continue;
    }

    let cursor = slotStart;

    for (const block of busy) {
      if (block.end <= cursor) continue;
      if (block.start >= slotEnd) break;

      const gapEnd = new Date(Math.min(block.start.getTime(), slotEnd.getTime()));
      const gapDurationMins = durationMins(cursor, gapEnd);
      if (gapDurationMins >= MIN_SLOT_MINS) {
        available.push({
          start: cursor.toISOString(),
          end: gapEnd.toISOString(),
          durationMins: gapDurationMins,
        });
      }

      cursor = new Date(Math.max(cursor.getTime(), block.end.getTime()));
      if (cursor >= slotEnd) break;
    }

    if (cursor < slotEnd) {
      const gapDurationMins = durationMins(cursor, slotEnd);
      if (gapDurationMins >= MIN_SLOT_MINS) {
        available.push({
          start: cursor.toISOString(),
          end: slotEnd.toISOString(),
          durationMins: gapDurationMins,
        });
      }
    }
  }

  return available;
}
