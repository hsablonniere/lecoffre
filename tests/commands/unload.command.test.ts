import { describe, expect, it } from "vitest";
import { useStore } from "../test-helpers.ts";

describe("unload command", () => {
  const { run, seed } = useStore();

  it("unloads variables", async () => {
    await seed({
      myapp: {
        default: { FOO: "bar", NUM: "42" },
      },
    });

    const result = await run(["unload", "--project", "myapp"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toMatchInlineSnapshot(`
      "unset FOO
      unset NUM"
    `);
  });

  it("exits with error for unknown project", async () => {
    const result = await run(["unload", "--project", "nonexistent"]);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toMatchInlineSnapshot(`"Project not found: nonexistent"`);
  });

  it("exits with error for unknown environment", async () => {
    await seed({ myapp: { dev: { A: "1" } } });

    const result = await run(["unload", "--project", "myapp", "--environment", "production"]);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toMatchInlineSnapshot(`"Environment not found: production"`);
  });
});
