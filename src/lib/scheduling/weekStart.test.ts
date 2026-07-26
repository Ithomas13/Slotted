import { describe, expect, it } from "vitest";
import { parseWeekStart } from "./weekStart";

describe("parseWeekStart", () => {
  it("returns a Date for valid ISO input", () => {
    expect(parseWeekStart("2025-01-06T05:00:00.000Z")?.toISOString()).toBe(
      "2025-01-06T05:00:00.000Z"
    );
  });

  it("returns null for invalid input", () => {
    expect(parseWeekStart("not-a-date")).toBeNull();
    expect(parseWeekStart("")).toBeNull();
  });
});
