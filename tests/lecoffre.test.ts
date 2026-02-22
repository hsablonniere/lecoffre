import { describe, expect, it } from "vitest";
import { execaNode } from "execa";
import packageJson from "../package.json" with { type: "json" };

const { name } = packageJson;

describe("CLI", () => {
  it("shows help with --help flag", async () => {
    const result = await execaNode("bin/lecoffre.ts", ["--help"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain(`${name} <command> [options]`);
    expect(result.stdout).not.toContain("COMMANDS");
  });

  it("shows help when no command is given", async () => {
    const result = await execaNode("bin/lecoffre.ts", []);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain(`${name} <command> [options]`);
    expect(result.stdout).not.toContain("COMMANDS");
  });

  it("shows error and help for unknown command", async () => {
    const result = await execaNode("bin/lecoffre.ts", ["unknown"], { reject: false });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain(`Unknown command "unknown" for "${name}"`);
    expect(result.stderr).toContain(`${name} <command> [options]`);
    expect(result.stderr).not.toContain("COMMANDS");
  });
});
