import { describe, expect, it } from "vitest";
import { resolveSlotUpdate, updateSlotSchema } from "./slotUpdate";

const current = {
  startTime: new Date("2025-01-06T09:00:00.000Z"),
  endTime: new Date("2025-01-06T10:00:00.000Z"),
};

describe("slot update validation", () => {
  it("accepts ISO datetimes with offsets", () => {
    const result = updateSlotSchema.safeParse({
      startTime: "2025-01-06T11:00:00.000Z",
      endTime: "2025-01-06T12:00:00.000Z",
      manuallyMoved: true,
    });

    expect(result.success).toBe(true);
  });

  it("rejects non-ISO datetimes", () => {
    const result = updateSlotSchema.safeParse({ startTime: "tomorrow at noon" });

    expect(result.success).toBe(false);
  });

  it("rejects updates that invert the slot", () => {
    const update = resolveSlotUpdate(
      { startTime: "2025-01-06T11:00:00.000Z" },
      current
    );

    expect(update).toBeNull();
  });

  it("allows metadata-only updates without changing times", () => {
    const update = resolveSlotUpdate({ manuallyMoved: false }, current);

    expect(update).toEqual({ manuallyMoved: false });
  });
});
