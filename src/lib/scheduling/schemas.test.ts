import { describe, it, expect } from "vitest";
import { aiOutputSchema } from "./schemas";

describe("aiOutputSchema", () => {
  it("accepts valid AI output", () => {
    const input = {
      scheduled: [
        { taskId: "task1", slotStart: "2025-01-06T09:00:00.000Z", slotEnd: "2025-01-06T10:00:00.000Z" },
      ],
      skipped: [],
    };
    const result = aiOutputSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("accepts output with skipped tasks", () => {
    const input = {
      scheduled: [],
      skipped: [
        { taskId: "task2", reason: "No available slot", suggestion: "Consider earlier in the week" },
      ],
    };
    const result = aiOutputSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("rejects missing scheduled array", () => {
    const result = aiOutputSchema.safeParse({ skipped: [] });
    expect(result.success).toBe(false);
  });

  it("rejects missing skipped array", () => {
    const result = aiOutputSchema.safeParse({ scheduled: [] });
    expect(result.success).toBe(false);
  });

  it("rejects scheduled item missing taskId", () => {
    const input = {
      scheduled: [{ slotStart: "2025-01-06T09:00:00.000Z", slotEnd: "2025-01-06T10:00:00.000Z" }],
      skipped: [],
    };
    const result = aiOutputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects skipped item missing reason", () => {
    const input = {
      scheduled: [],
      skipped: [{ taskId: "t1", suggestion: "Try again" }],
    };
    const result = aiOutputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects non-string taskId", () => {
    const input = {
      scheduled: [{ taskId: 123, slotStart: "2025-01-06T09:00:00.000Z", slotEnd: "2025-01-06T10:00:00.000Z" }],
      skipped: [],
    };
    const result = aiOutputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects scheduled items with non-ISO dates", () => {
    const input = {
      scheduled: [{ taskId: "task1", slotStart: "Monday at nine", slotEnd: "later" }],
      skipped: [],
    };
    const result = aiOutputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects scheduled items that end before they start", () => {
    const input = {
      scheduled: [
        { taskId: "task1", slotStart: "2025-01-06T10:00:00.000Z", slotEnd: "2025-01-06T09:00:00.000Z" },
      ],
      skipped: [],
    };
    const result = aiOutputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects skipped items with blank reasons", () => {
    const input = {
      scheduled: [],
      skipped: [{ taskId: "task1", reason: "", suggestion: "Try tomorrow" }],
    };
    const result = aiOutputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects duplicate scheduled task ids", () => {
    const input = {
      scheduled: [
        { taskId: "task1", slotStart: "2025-01-06T09:00:00.000Z", slotEnd: "2025-01-06T10:00:00.000Z" },
        { taskId: "task1", slotStart: "2025-01-06T11:00:00.000Z", slotEnd: "2025-01-06T12:00:00.000Z" },
      ],
      skipped: [],
    };

    const result = aiOutputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects tasks that are both scheduled and skipped", () => {
    const input = {
      scheduled: [
        { taskId: "task1", slotStart: "2025-01-06T09:00:00.000Z", slotEnd: "2025-01-06T10:00:00.000Z" },
      ],
      skipped: [{ taskId: "task1", reason: "No room", suggestion: "Move later" }],
    };

    const result = aiOutputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("parses JSON string via parseAIOutput helper", async () => {
    const { parseAIOutput } = await import("./schemas");
    const json = JSON.stringify({
      scheduled: [{ taskId: "t1", slotStart: "2025-01-06T09:00:00.000Z", slotEnd: "2025-01-06T10:00:00.000Z" }],
      skipped: [],
    });
    const result = parseAIOutput(json);
    expect(result.scheduled).toHaveLength(1);
  });

  it("throws on malformed JSON", async () => {
    const { parseAIOutput } = await import("./schemas");
    expect(() => parseAIOutput("{invalid json}")).toThrow();
  });
});
