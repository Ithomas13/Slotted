import { describe, it, expect, beforeEach } from "vitest";
import { encrypt, decrypt } from "./crypto";

const TEST_KEY = "a".repeat(64);

describe("crypto", () => {
  beforeEach(() => {
    process.env.ENCRYPTION_KEY = TEST_KEY;
  });

  it("round-trips a short string", () => {
    const plaintext = "hello world";
    const ciphertext = encrypt(plaintext);
    expect(decrypt(ciphertext)).toBe(plaintext);
  });

  it("round-trips a long token string", () => {
    const plaintext = "ya29." + "x".repeat(200);
    expect(decrypt(encrypt(plaintext))).toBe(plaintext);
  });

  it("produces different ciphertext each call (random IV)", () => {
    const plaintext = "same input";
    const c1 = encrypt(plaintext);
    const c2 = encrypt(plaintext);
    expect(c1).not.toBe(c2);
  });

  it("decrypt throws on tampered ciphertext", () => {
    const ciphertext = encrypt("secret");
    const parts = ciphertext.split(":");
    parts[2] = Buffer.from("tampered").toString("hex");
    expect(() => decrypt(parts.join(":"))).toThrow();
  });

  it("decrypt throws with wrong key", () => {
    const ciphertext = encrypt("secret");
    process.env.ENCRYPTION_KEY = "b".repeat(64);
    expect(() => decrypt(ciphertext)).toThrow();
  });
});
