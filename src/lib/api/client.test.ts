import { describe, expect, it } from "vitest";
import { assertOk, readJson } from "./client";

describe("API client helpers", () => {
  it("returns parsed JSON for successful responses", async () => {
    const res = new Response(JSON.stringify({ ok: true }), { status: 200 });

    await expect(readJson<{ ok: boolean }>(res, "fallback")).resolves.toEqual({ ok: true });
  });

  it("surfaces string API errors", async () => {
    const res = new Response(JSON.stringify({ error: "Invalid weekStart" }), { status: 400 });

    await expect(readJson(res, "Failed request")).rejects.toThrow("Invalid weekStart");
  });

  it("surfaces Zod issue messages", async () => {
    const res = new Response(
      JSON.stringify({ error: [{ message: "End time must be after start time" }] }),
      { status: 400 }
    );

    await expect(assertOk(res, "Failed request")).rejects.toThrow(
      "End time must be after start time"
    );
  });

  it("falls back when the error response is not JSON", async () => {
    const res = new Response("nope", { status: 500 });

    await expect(assertOk(res, "Failed request")).rejects.toThrow("Failed request");
  });
});
