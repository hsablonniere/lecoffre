import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { defineCommand } from "../src/lib/define-command.ts";
import { defineArgument } from "../src/lib/define-argument.ts";
import { defineOption } from "../src/lib/define-option.ts";

describe("defineArgument", () => {
  it("returns the argument definition unchanged", () => {
    const definition = {
      schema: z.string(),
      description: "A file path",
      placeholder: "file",
    };

    expect(defineArgument(definition)).toBe(definition);
  });
});

describe("defineOption", () => {
  it("returns the option definition unchanged", () => {
    const definition = {
      name: "verbose",
      schema: z.boolean().default(false),
      description: "Enable verbose output",
      aliases: ["v"] as Array<string>,
    };

    expect(defineOption(definition)).toBe(definition);
  });
});

describe("defineCommand", () => {
  it("returns the command definition unchanged", () => {
    const handler = () => {};
    const definition = {
      description: "A test command",
      handler,
    };

    const result = defineCommand(definition);

    expect(result).toBe(definition);
  });

  it("works with a command that has no options or args", () => {
    const definition = defineCommand({
      description: "Bare command",
      handler: () => {},
    });

    expect(definition.description).toBe("Bare command");
    expect(definition.options).toBeUndefined();
    expect(definition.args).toBeUndefined();
  });

  it("works with a command that has only args", () => {
    const definition = defineCommand({
      description: "Args only",
      args: [
        defineArgument({ schema: z.string(), description: "Name", placeholder: "name" }),
      ] as const,
      handler: () => {},
    });

    expect(definition.args).toHaveLength(1);
    expect(definition.options).toBeUndefined();
  });

  it("works with a command that has only options", () => {
    const definition = defineCommand({
      description: "Options only",
      options: {
        verbose: defineOption({
          name: "verbose",
          schema: z.boolean().default(false),
          description: "Verbose",
        }),
      },
      handler: () => {},
    });

    expect(definition.options).toBeDefined();
    expect(definition.args).toBeUndefined();
  });

  it("works with a command that has both args and options", () => {
    const definition = defineCommand({
      description: "Full command",
      args: [
        defineArgument({
          schema: z.string().default("world"),
          description: "Name",
          placeholder: "name",
        }),
      ] as const,
      options: {
        loud: defineOption({
          name: "loud",
          schema: z.boolean().default(false),
          description: "Be loud",
        }),
      },
      handler: () => {},
    });

    expect(definition.args).toHaveLength(1);
    expect(definition.options).toBeDefined();
  });

  it("handler receives typed parameters", () => {
    const handler = vi.fn();

    const definition = defineCommand({
      description: "Typed handler",
      args: [
        defineArgument({
          schema: z.string().default("world"),
          description: "Name",
          placeholder: "name",
        }),
      ] as const,
      options: {
        loud: defineOption({
          name: "loud",
          schema: z.boolean().default(false),
          description: "Be loud",
        }),
      },
      handler,
    });

    definition.handler({ loud: true }, "Alice");

    expect(handler).toHaveBeenCalledWith({ loud: true }, "Alice");
  });
});
