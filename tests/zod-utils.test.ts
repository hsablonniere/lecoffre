import { describe, expect, it } from "vitest";
import { z } from "zod";
import { getDefault, isBoolean, isRequired } from "../src/lib/zod-utils.ts";

describe("isBoolean", () => {
  it("returns true for z.boolean()", () => {
    expect(isBoolean(z.boolean())).toBe(true);
  });

  it("returns true for z.boolean().default(false)", () => {
    expect(isBoolean(z.boolean().default(false))).toBe(true);
  });

  it("returns true for z.boolean().optional()", () => {
    expect(isBoolean(z.boolean().optional())).toBe(true);
  });

  it("returns true for z.boolean().nullable()", () => {
    expect(isBoolean(z.boolean().nullable())).toBe(true);
  });

  it("returns false for z.string()", () => {
    expect(isBoolean(z.string())).toBe(false);
  });

  it("returns false for z.string().default('x')", () => {
    expect(isBoolean(z.string().default("x"))).toBe(false);
  });

  it("returns false for z.number()", () => {
    expect(isBoolean(z.number())).toBe(false);
  });
});

describe("isRequired", () => {
  it("returns true for z.string()", () => {
    expect(isRequired(z.string())).toBe(true);
  });

  it("returns false for z.string().optional()", () => {
    expect(isRequired(z.string().optional())).toBe(false);
  });

  it("returns false for z.string().nullable()", () => {
    expect(isRequired(z.string().nullable())).toBe(false);
  });

  it("returns false for z.string().default('x')", () => {
    expect(isRequired(z.string().default("x"))).toBe(false);
  });

  it("returns true for z.number()", () => {
    expect(isRequired(z.number())).toBe(true);
  });

  it("returns true for z.string().pipe(z.string())", () => {
    expect(isRequired(z.string().pipe(z.string()))).toBe(true);
  });
});

describe("getDefault", () => {
  it("returns the default value for z.string().default('hello')", () => {
    expect(getDefault(z.string().default("hello"))).toBe("hello");
  });

  it("returns the default value for z.boolean().default(false)", () => {
    expect(getDefault(z.boolean().default(false))).toBe(false);
  });

  it("returns the default value for z.number().default(0)", () => {
    expect(getDefault(z.number().default(0))).toBe(0);
  });

  it("returns undefined for z.string()", () => {
    expect(getDefault(z.string())).toBeUndefined();
  });

  it("returns undefined for z.string().optional()", () => {
    expect(getDefault(z.string().optional())).toBeUndefined();
  });

  it("returns the default value for z.string().nullable().default('x')", () => {
    expect(getDefault(z.string().nullable().default("x"))).toBe("x");
  });
});
