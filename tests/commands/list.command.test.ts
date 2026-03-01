import { describe, expect, it } from "vitest";
import { useStore } from "../test-helpers.ts";

describe("list command", () => {
  const { run, seed } = useStore();

  it("shows empty message when no projects exist", async () => {
    const result = await run(["list"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toMatchInlineSnapshot(`"No projects found."`);
  });

  it("lists all projects with environments and variable counts", async () => {
    await seed({
      app1: {
        dev: { API_KEY: "secret", PORT: "3000" },
        staging: { API_KEY: "staging-key" },
      },
      app2: {
        production: { DB_URL: "postgres://localhost" },
      },
    });

    const result = await run(["list"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toMatchInlineSnapshot(`
      "app1
        dev (2 variables)
        staging (1 variable)
      app2
        production (1 variable)"
    `);
  });

  it("lists environments for a specific project", async () => {
    await seed({
      myproject: {
        dev: { A: "1", B: "2" },
        staging: { C: "3" },
      },
    });

    const result = await run(["list", "myproject"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toMatchInlineSnapshot(`
      "dev (2 variables)
      staging (1 variable)"
    `);
  });

  it("exits with error for unknown project", async () => {
    const result = await run(["list", "nonexistent"]);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toMatchInlineSnapshot(`"Project not found: nonexistent"`);
  });
});
