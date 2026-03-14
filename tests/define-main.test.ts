import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import type { AnyCommandDefinition } from "../src/lib/define-command.ts";
import { defineMain } from "../src/lib/define-main.ts";

describe("defineMain", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const greetHandler = vi.fn();
  const greetCommand: AnyCommandDefinition = {
    description: "Say hello",
    options: {
      name: {
        name: "name",
        schema: z.string(),
        description: "Name to greet",
      },
    },
    handler: greetHandler,
  };

  const simpleHandler = vi.fn();
  const simpleCommand: AnyCommandDefinition = {
    description: "Simple command",
    handler: simpleHandler,
  };

  function createMain() {
    return defineMain({
      name: "mycli",
      commands: {
        greet: greetCommand,
        simple: simpleCommand,
      },
    });
  }

  it("shows global help and exits 0 when no command is given", async () => {
    const main = createMain();

    const result = await main.run(["node", "mycli"]);

    expect(result.exitCode).toBe(0);
    expect(logSpy).toHaveBeenCalledOnce();
    expect(logSpy.mock.calls[0]![0]).toContain("mycli <command> [options]");
  });

  it("shows error and global help on stderr for unknown command, exits 1", async () => {
    const main = createMain();

    const result = await main.run(["node", "mycli", "unknown"]);

    expect(result.exitCode).toBe(1);
    expect(errorSpy).toHaveBeenCalledWith('Unknown command "unknown" for "mycli"\n');
    expect(errorSpy.mock.calls[1]![0]).toContain("mycli <command> [options]");
  });

  it("calls the handler for a valid command", async () => {
    simpleHandler.mockReset();
    const main = createMain();

    const result = await main.run(["node", "mycli", "simple"]);

    expect(result.exitCode).toBe(0);
    expect(simpleHandler).toHaveBeenCalledOnce();
  });

  it("shows command help and exits 0 with --help", async () => {
    const main = createMain();

    const result = await main.run(["node", "mycli", "greet", "--help"]);

    expect(result.exitCode).toBe(0);
    expect(logSpy).toHaveBeenCalledOnce();
    expect(logSpy.mock.calls[0]![0]).toContain("mycli greet");
  });

  it("shows validation errors and command help on stderr, exits 1", async () => {
    const requiredCommand: AnyCommandDefinition = {
      description: "Requires name",
      options: {
        name: {
          name: "name",
          schema: z.string({ error: "name is required" }),
          description: "Name",
        },
      },
      handler: vi.fn(),
    };

    const main = defineMain({ name: "mycli", commands: { req: requiredCommand } });

    const result = await main.run(["node", "mycli", "req"]);

    expect(result.exitCode).toBe(1);
    expect(errorSpy).toHaveBeenCalled();
    expect(errorSpy.mock.calls[0]![0]).toContain("ERRORS");
  });

  it("shows error.message on stderr and exits 1 when handler throws", async () => {
    const failingCommand: AnyCommandDefinition = {
      description: "Fails",
      handler: () => {
        throw new Error("something broke");
      },
    };

    const main = defineMain({ name: "mycli", commands: { fail: failingCommand } });

    const result = await main.run(["node", "mycli", "fail"]);

    expect(result.exitCode).toBe(1);
    expect(errorSpy).toHaveBeenCalledWith("something broke");
  });
});
