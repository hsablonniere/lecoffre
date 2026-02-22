import { describe, expect, it } from "vitest";
import { z } from "zod";
import { CommandValidationError, parseCommand } from "../src/lib/parse-command.ts";
import type { AnyCommandDefinition } from "../src/lib/define-command.ts";

describe("parseCommand", () => {
  describe("options", () => {
    it("parses a string option with a value", () => {
      const command: AnyCommandDefinition = {
        description: "test",
        options: {
          name: {
            name: "name",
            schema: z.string(),
            description: "Name",
          },
        },
        handler: () => {},
      };

      const result = parseCommand(["--name", "Alice"], command);

      expect(result.options.name).toBe("Alice");
    });

    it("applies default when string option is absent", () => {
      const command: AnyCommandDefinition = {
        description: "test",
        options: {
          name: {
            name: "name",
            schema: z.string().default("world"),
            description: "Name",
          },
        },
        handler: () => {},
      };

      const result = parseCommand([], command);

      expect(result.options.name).toBe("world");
    });

    it("throws a CommandValidationError when required string option is absent", () => {
      const command: AnyCommandDefinition = {
        description: "test",
        options: {
          name: {
            name: "name",
            schema: z.string(),
            description: "Name",
          },
        },
        handler: () => {},
      };

      expect(() => parseCommand([], command)).toThrow(CommandValidationError);
      expect(() => parseCommand([], command)).toThrow(
        'option "--name": Invalid input: expected string, received undefined',
      );
    });

    it("passes empty string to schema when option value is empty", () => {
      const command: AnyCommandDefinition = {
        description: "test",
        options: {
          name: {
            name: "name",
            schema: z.string(),
            description: "Name",
          },
        },
        handler: () => {},
      };

      const result = parseCommand(["--name", ""], command);

      expect(result.options.name).toBe("");
    });

    it("sets boolean option to true when present", () => {
      const command: AnyCommandDefinition = {
        description: "test",
        options: {
          verbose: {
            name: "verbose",
            schema: z.boolean().default(false),
            description: "Verbose",
          },
        },
        handler: () => {},
      };

      const result = parseCommand(["--verbose"], command);

      expect(result.options.verbose).toBe(true);
    });

    it("uses default false when boolean option is absent", () => {
      const command: AnyCommandDefinition = {
        description: "test",
        options: {
          verbose: {
            name: "verbose",
            schema: z.boolean().default(false),
            description: "Verbose",
          },
        },
        handler: () => {},
      };

      const result = parseCommand([], command);

      expect(result.options.verbose).toBe(false);
    });

    it("maps short alias to the option", () => {
      const command: AnyCommandDefinition = {
        description: "test",
        options: {
          lastName: {
            name: "last-name",
            schema: z.string().default("world"),
            description: "Last name",
            aliases: ["l"],
          },
        },
        handler: () => {},
      };

      const result = parseCommand(["-l", "Doe"], command);

      expect(result.options.lastName).toBe("Doe");
    });
  });

  describe("arguments", () => {
    it("parses a provided argument as string", () => {
      const command: AnyCommandDefinition = {
        description: "test",
        args: [{ schema: z.string(), description: "Name", placeholder: "name" }],
        handler: () => {},
      };

      const result = parseCommand(["Alice"], command);

      expect(result.args[0]).toBe("Alice");
    });

    it("applies default when argument is absent", () => {
      const command: AnyCommandDefinition = {
        description: "test",
        args: [{ schema: z.string().default("world"), description: "Name", placeholder: "name" }],
        handler: () => {},
      };

      const result = parseCommand([], command);

      expect(result.args[0]).toBe("world");
    });

    it("throws a CommandValidationError when required argument is absent", () => {
      const command: AnyCommandDefinition = {
        description: "test",
        args: [{ schema: z.string(), description: "Name", placeholder: "name" }],
        handler: () => {},
      };

      expect(() => parseCommand([], command)).toThrow(CommandValidationError);
      expect(() => parseCommand([], command)).toThrow(
        "argument <name>: Invalid input: expected string, received undefined",
      );
    });

    it("returns undefined when optional argument is absent", () => {
      const command: AnyCommandDefinition = {
        description: "test",
        args: [{ schema: z.string().optional(), description: "Name", placeholder: "name" }],
        handler: () => {},
      };

      const result = parseCommand([], command);

      expect(result.args[0]).toBeUndefined();
    });

    it("parses multiple positional arguments in order", () => {
      const command: AnyCommandDefinition = {
        description: "test",
        args: [
          { schema: z.string(), description: "First", placeholder: "first" },
          { schema: z.string(), description: "Second", placeholder: "second" },
        ],
        handler: () => {},
      };

      const result = parseCommand(["one", "two"], command);

      expect(result.args[0]).toBe("one");
      expect(result.args[1]).toBe("two");
    });
  });

  describe("combined args and options", () => {
    it("parses both args and options together", () => {
      const command: AnyCommandDefinition = {
        description: "test",
        args: [{ schema: z.string(), description: "Name", placeholder: "name" }],
        options: {
          verbose: {
            name: "verbose",
            schema: z.boolean().default(false),
            description: "Verbose",
          },
        },
        handler: () => {},
      };

      const result = parseCommand(["Alice", "--verbose"], command);

      expect(result.args[0]).toBe("Alice");
      expect(result.options.verbose).toBe(true);
    });
  });

  describe("validation", () => {
    it("reports minimum length error from z.string().min()", () => {
      const command: AnyCommandDefinition = {
        description: "test",
        options: {
          name: {
            name: "name",
            schema: z.string().min(3),
            description: "Name",
          },
        },
        handler: () => {},
      };

      expect(() => parseCommand(["--name", "ab"], command)).toThrow(CommandValidationError);
      expect(() => parseCommand(["--name", "ab"], command)).toThrow(
        'option "--name": Too small: expected string to have >=3 characters',
      );
    });

    it("reports invalid enum value from z.enum()", () => {
      const command: AnyCommandDefinition = {
        description: "test",
        options: {
          format: {
            name: "format",
            schema: z.enum(["json", "yaml"]),
            description: "Output format",
          },
        },
        handler: () => {},
      };

      expect(() => parseCommand(["--format", "xml"], command)).toThrow(CommandValidationError);
      expect(() => parseCommand(["--format", "xml"], command)).toThrow('option "--format":');
    });

    it("coerces string to number with z.coerce.number()", () => {
      const command: AnyCommandDefinition = {
        description: "test",
        options: {
          count: {
            name: "count",
            schema: z.coerce.number(),
            description: "Count",
          },
        },
        handler: () => {},
      };

      const result = parseCommand(["--count", "42"], command);

      expect(result.options.count).toBe(42);
    });

    it("reports error from z.coerce.number() with validation", () => {
      const command: AnyCommandDefinition = {
        description: "test",
        options: {
          port: {
            name: "port",
            schema: z.coerce.number().min(1),
            description: "Port",
          },
        },
        handler: () => {},
      };

      expect(() => parseCommand(["--port", "0"], command)).toThrow(CommandValidationError);
      expect(() => parseCommand(["--port", "0"], command)).toThrow(
        'option "--port": Too small: expected number to be >=1',
      );
    });

    it("reports custom error from .refine()", () => {
      const command: AnyCommandDefinition = {
        description: "test",
        args: [
          {
            schema: z
              .string()
              .refine((v) => v.startsWith("/"), { message: "Must be an absolute path" }),
            description: "File path",
            placeholder: "file",
          },
        ],
        handler: () => {},
      };

      expect(() => parseCommand(["relative/path"], command)).toThrow(CommandValidationError);
      expect(() => parseCommand(["relative/path"], command)).toThrow(
        "argument <file>: Must be an absolute path",
      );
    });

    it("accumulates multiple errors from options and arguments", () => {
      const command: AnyCommandDefinition = {
        description: "test",
        options: {
          port: {
            name: "port",
            schema: z.coerce.number().min(1),
            description: "Port",
          },
        },
        args: [{ schema: z.string(), description: "File", placeholder: "file" }],
        handler: () => {},
      };

      const getError = () => {
        try {
          parseCommand(["--port", "0"], command);
        } catch (error) {
          return error;
        }
        return undefined;
      };

      const error = getError();
      expect(error).toBeInstanceOf(CommandValidationError);
      const validationError = error as CommandValidationError;
      expect(validationError.errors).toHaveLength(2);
      expect(validationError.errors[0]).toContain('option "--port"');
      expect(validationError.errors[1]).toContain("argument <file>");
    });
  });
});
