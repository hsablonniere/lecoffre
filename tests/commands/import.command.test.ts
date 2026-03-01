import { describe, expect, it } from "vitest";
import { useStore } from "../test-helpers.ts";

describe("import command", () => {
  const { run, seed } = useStore();

  it("imports variables in replace mode", async () => {
    const result = await run(["import", "--project", "myapp"], {
      input: "FOO=bar\nNUM=42\n",
    });

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toMatchInlineSnapshot(`
      "+ FOO (added)
      + NUM (added)
      Imported 2 variables into myapp [default]"
    `);
  });

  it("replaces existing variables", async () => {
    await seed({ myapp: { default: { OLD: "value", KEEP: "same" } } });

    const result = await run(["import", "--project", "myapp"], {
      input: "KEEP=same\nNEW=added\n",
    });

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toMatchInlineSnapshot(`
      "+ NEW (added)
      - OLD (removed)
      Imported 2 variables into myapp [default]"
    `);
  });

  it("merges with existing variables", async () => {
    await seed({ myapp: { default: { EXISTING: "old", KEEP: "same" } } });

    const result = await run(["import", "--project", "myapp", "--merge"], {
      input: "EXISTING=new\nADDED=yes\n",
    });

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toMatchInlineSnapshot(`
      "+ ADDED (added)
      ~ EXISTING (updated)
      Imported 2 variables into myapp [default]"
    `);
  });

  it("uses specified environment", async () => {
    const result = await run(["import", "--project", "myapp", "--environment", "staging"], {
      input: "KEY=val\n",
    });

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toMatchInlineSnapshot(`
      "+ KEY (added)
      Imported 1 variable into myapp [staging]"
    `);
  });

  it("ignores comments and empty lines", async () => {
    const result = await run(["import", "--project", "myapp"], {
      input: "# this is a comment\n\nFOO=bar\n\n# another comment\nNUM=42\n",
    });

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toMatchInlineSnapshot(`
      "+ FOO (added)
      + NUM (added)
      Imported 2 variables into myapp [default]"
    `);
  });

  it("strips export prefix from variables", async () => {
    const result = await run(["import", "--project", "myapp"], {
      input: "export FOO=bar\nexport NUM=42\n",
    });

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toMatchInlineSnapshot(`
      "+ FOO (added)
      + NUM (added)
      Imported 2 variables into myapp [default]"
    `);
  });
});
