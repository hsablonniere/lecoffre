import { describe, expect, it } from "vitest";
import { execaNode } from "execa";

describe("lecoffre CLI", () => {
  it("prints hello message and exits with code 0", async () => {
    const result = await execaNode("bin/lecoffre.ts");

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe("Hello from lecoffre v0.0.1 - Work in progress.");
  });
});
