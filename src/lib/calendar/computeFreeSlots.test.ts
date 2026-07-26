import { describe, it, expect } from "vitest";
import { computeFreeSlots, subtractBusyIntervalsFromFreeSlots } from "./computeFreeSlots";
import type { CalendarEvent } from "@/types/calendar";

const day = (d: number, h: number, m = 0) =>
  new Date(2025, 0, d, h, m, 0, 0).toISOString();

describe("computeFreeSlots", () => {
  it("returns free slots when no events exist", () => {
    const slots = computeFreeSlots([], new Date(2025, 0, 6), new Date(2025, 0, 13));
    expect(slots.length).toBeGreaterThan(0);
    slots.forEach((s) => {
      expect(new Date(s.start).getHours()).toBeGreaterThanOrEqual(7);
    });
  });

  it("excludes sleep time (22:00–07:00)", () => {
    const slots = computeFreeSlots([], new Date(2025, 0, 6), new Date(2025, 0, 7));
    slots.forEach((s) => {
      const startHour = new Date(s.start).getHours();
      const endHour = new Date(s.end).getHours();
      expect(startHour).toBeGreaterThanOrEqual(7);
      expect(endHour).toBeLessThanOrEqual(22);
    });
  });

  it("filters gaps shorter than 15 minutes", () => {
    const events: CalendarEvent[] = [
      { id: "1", summary: "A", start: day(6, 9), end: day(6, 9, 50), allDay: false },
      { id: "2", summary: "B", start: day(6, 10), end: day(6, 11), allDay: false },
    ];
    const slots = computeFreeSlots(events, new Date(2025, 0, 6), new Date(2025, 0, 7));
    slots.forEach((s) => {
      expect(s.durationMins).toBeGreaterThanOrEqual(15);
    });
  });

  it("merges overlapping events", () => {
    const events: CalendarEvent[] = [
      { id: "1", summary: "A", start: day(6, 9), end: day(6, 11), allDay: false },
      { id: "2", summary: "B", start: day(6, 10), end: day(6, 12), allDay: false },
    ];
    const slots = computeFreeSlots(events, new Date(2025, 0, 6), new Date(2025, 0, 7));
    slots.forEach((s) => {
      const start = new Date(s.start);
      const end = new Date(s.end);
      expect(start >= new Date(day(6, 12)) || end <= new Date(day(6, 9))).toBe(true);
    });
  });

  it("handles all-day events by blocking entire day's waking hours", () => {
    const events: CalendarEvent[] = [
      { id: "1", summary: "Holiday", start: "2025-01-06", end: "2025-01-07", allDay: true },
    ];
    const slots = computeFreeSlots(events, new Date(2025, 0, 6), new Date(2025, 0, 7));
    const jan6Slots = slots.filter((s) => new Date(s.start).getDate() === 6);
    expect(jan6Slots).toHaveLength(0);
  });

  it("handles events that span midnight", () => {
    const events: CalendarEvent[] = [
      { id: "1", summary: "Late", start: day(6, 21), end: day(7, 8), allDay: false },
    ];
    const slots = computeFreeSlots(events, new Date(2025, 0, 6), new Date(2025, 0, 8));
    slots.forEach((s) => {
      const start = new Date(s.start);
      const end = new Date(s.end);
      expect(
        end <= new Date(day(6, 21)) || start >= new Date(day(7, 8))
      ).toBe(true);
    });
  });

  it("returns slots with correct durationMins", () => {
    const slots = computeFreeSlots([], new Date(2025, 0, 6), new Date(2025, 0, 7));
    slots.forEach((s) => {
      const computed = (new Date(s.end).getTime() - new Date(s.start).getTime()) / 60000;
      expect(s.durationMins).toBeCloseTo(computed, 0);
    });
  });

  it("returns no slots for invalid or inverted ranges", () => {
    expect(computeFreeSlots([], new Date("bad-date"), new Date(2025, 0, 7))).toEqual([]);
    expect(computeFreeSlots([], new Date(2025, 0, 7), new Date(2025, 0, 6))).toEqual([]);
  });

  it("ignores invalid calendar events", () => {
    const events: CalendarEvent[] = [
      { id: "1", summary: "Bad", start: "not a date", end: day(6, 10), allDay: false },
      { id: "2", summary: "Backwards", start: day(6, 12), end: day(6, 11), allDay: false },
      { id: "3", summary: "Meeting", start: day(6, 9), end: day(6, 10), allDay: false },
    ];

    const slots = computeFreeSlots(events, new Date(2025, 0, 6), new Date(2025, 0, 7));

    slots.forEach((s) => {
      expect(new Date(s.end) <= new Date(day(6, 9)) || new Date(s.start) >= new Date(day(6, 10))).toBe(true);
    });
  });

  it("subtracts preserved manual slots from free slots", () => {
    const slots = subtractBusyIntervalsFromFreeSlots(
      [{ start: day(6, 9), end: day(6, 12), durationMins: 180 }],
      [{ start: day(6, 10), end: day(6, 11) }]
    );

    expect(slots).toEqual([
      { start: day(6, 9), end: day(6, 10), durationMins: 60 },
      { start: day(6, 11), end: day(6, 12), durationMins: 60 },
    ]);
  });

  it("filters fragments shorter than 15 minutes when subtracting busy slots", () => {
    const slots = subtractBusyIntervalsFromFreeSlots(
      [{ start: day(6, 9), end: day(6, 10), durationMins: 60 }],
      [{ start: day(6, 9, 10), end: day(6, 9, 45) }]
    );

    expect(slots).toEqual([
      { start: day(6, 9, 45), end: day(6, 10), durationMins: 15 },
    ]);
  });

  it("ignores busy intervals outside the free slot range", () => {
    const freeSlot = { start: day(6, 9), end: day(6, 10), durationMins: 60 };
    const slots = subtractBusyIntervalsFromFreeSlots(
      [freeSlot],
      [{ start: day(6, 12), end: day(6, 13) }]
    );

    expect(slots).toEqual([freeSlot]);
  });
});
