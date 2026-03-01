import { describe, expect, it } from "vitest";
import { runLecoffre } from "./test-helpers.ts";

describe("CLI", () => {
  it("shows help with --help flag", async () => {
    const result = await runLecoffre(["--help"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toMatchInlineSnapshot(`
      "USAGE
        lecoffre <command> [options]

      COMMANDS
        list  List projects and their environments
        load  Load variables into the current shell environment"
    `);
  });

  it("shows help when no command is given", async () => {
    const result = await runLecoffre([]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toMatchInlineSnapshot(`
      "USAGE
        lecoffre <command> [options]

      COMMANDS
        list  List projects and their environments
        load  Load variables into the current shell environment"
    `);
  });

  it("shows command help with --help flag", async () => {
    const result = await runLecoffre(["list", "--help"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toMatchInlineSnapshot(`
      "USAGE
        lecoffre list <project> [options]

      ARGUMENTS
        project  Project name (optional)"
    `);
  });

  it("shows command help with -h flag", async () => {
    const result = await runLecoffre(["list", "-h"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toMatchInlineSnapshot(`
      "USAGE
        lecoffre list <project> [options]

      ARGUMENTS
        project  Project name (optional)"
    `);
  });

  it("shows error and help for unknown command", async () => {
    const result = await runLecoffre(["unknown"]);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toMatchInlineSnapshot(`
      "Unknown command "unknown" for "lecoffre"

      USAGE
        lecoffre <command> [options]

      COMMANDS
        list  List projects and their environments
        load  Load variables into the current shell environment"
    `);
  });
});
