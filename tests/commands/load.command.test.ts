import { describe, expect, it } from "vitest";
import { useStore } from "../test-helpers.ts";

describe("load command", () => {
  const { run, seed } = useStore();

  it("loads variables", async () => {
    await seed({
      myapp: {
        default: { FOO: "bar", NUM: "42" },
      },
    });

    const result = await run(["load", "--project", "myapp"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toMatchInlineSnapshot(`
      "export FOO='bar'
      export NUM='42'"
    `);
  });

  it("uses specified environment", async () => {
    await seed({
      myapp: {
        production: { SECRET: "prod-secret" },
      },
    });

    const result = await run(["load", "--project", "myapp", "--environment", "production"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toMatchInlineSnapshot(`"export SECRET='prod-secret'"`);
  });

  it("exits with error for unknown project", async () => {
    const result = await run(["load", "--project", "nonexistent"]);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toMatchInlineSnapshot(`"Project not found: nonexistent"`);
  });

  it("exits with error for unknown environment", async () => {
    await seed({ myapp: { dev: { A: "1" } } });

    const result = await run(["load", "--project", "myapp", "--environment", "production"]);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toMatchInlineSnapshot(`"Environment not found: production"`);
  });
});
