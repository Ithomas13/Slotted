import { describe, expect, it } from "vitest";
import { createTaskSchema, updateTaskSchema } from "./validation";

const baseTask = {
  name: "Read chapter",
  importance: "MEDIUM",
  durationMins: 45,
  repeatRule: "NONE",
} as const;

describe("task validation", () => {
  it("accepts valid time windows", () => {
    const result = createTaskSchema.safeParse({
      ...baseTask,
      timeWindows: [{ start: "08:30", end: "10:00", label: "morning" }],
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid time formats", () => {
    const result = createTaskSchema.safeParse({
      ...baseTask,
      timeWindows: [{ start: "8am", end: "10:00" }],
    });

    expect(result.success).toBe(false);
  });

  it("rejects time windows that do not move forward", () => {
    const result = createTaskSchema.safeParse({
      ...baseTask,
      timeWindows: [{ start: "18:00", end: "09:00" }],
    });

    expect(result.success).toBe(false);
  });

  it("allows nullable time windows on updates", () => {
    const result = updateTaskSchema.safeParse({ timeWindows: null });

    expect(result.success).toBe(true);
  });
});
