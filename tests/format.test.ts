import { describe, expect, it } from "vitest";
import { z } from "zod";
import { formatCommandHelp, formatErrors, formatGlobalHelp } from "../src/lib/format.ts";
import type { AnyCommandDefinition } from "../src/lib/define-command.ts";

describe("formatGlobalHelp", () => {
  it("formats multiple commands with padding", () => {
    const commands: Record<string, AnyCommandDefinition> = {
      foo: { description: "Do foo things", handler: () => {} },
      barbaz: { description: "Do bar things", handler: () => {} },
    };

    const output = formatGlobalHelp("mytool", commands);

    expect(output).toMatchInlineSnapshot(`
      "USAGE
        mytool <command> [options]

      COMMANDS
        foo     Do foo things
        barbaz  Do bar things"
    `);
  });

  it("omits COMMANDS section when registry is empty", () => {
    const output = formatGlobalHelp("mytool", {});

    expect(output).toMatchInlineSnapshot(`
      "USAGE
        mytool <command> [options]"
    `);
  });

  it("formats a single command", () => {
    const commands: Record<string, AnyCommandDefinition> = {
      run: { description: "Run something", handler: () => {} },
    };

    const output = formatGlobalHelp("mytool", commands);

    expect(output).toMatchInlineSnapshot(`
      "USAGE
        mytool <command> [options]

      COMMANDS
        run  Run something"
    `);
  });
});

describe("formatCommandHelp", () => {
  it("omits ARGUMENTS and OPTIONS sections when none are defined", () => {
    const command: AnyCommandDefinition = {
      description: "A simple command",
      handler: () => {},
    };

    const output = formatCommandHelp("mytool", "simple", command);

    expect(output).toMatchInlineSnapshot(`
      "USAGE
        mytool simple [options]"
    `);
  });

  it("shows ARGUMENTS section when args are defined", () => {
    const command: AnyCommandDefinition = {
      description: "Command with args",
      args: [{ schema: z.string(), description: "The file path", placeholder: "file" }],
      handler: () => {},
    };

    const output = formatCommandHelp("mytool", "open", command);

    expect(output).toMatchInlineSnapshot(`
      "USAGE
        mytool open <file> [options]

      ARGUMENTS
        file  The file path"
    `);
  });

  it("shows OPTIONS section when options are defined", () => {
    const command: AnyCommandDefinition = {
      description: "Command with options",
      options: {
        verbose: {
          name: "verbose",
          schema: z.boolean().default(false),
          description: "Enable verbose output",
          aliases: ["v"],
        },
      },
      handler: () => {},
    };

    const output = formatCommandHelp("mytool", "build", command);

    expect(output).toMatchInlineSnapshot(`
      "USAGE
        mytool build [options]

      OPTIONS
        -v, --verbose  Enable verbose output (default: false)"
    `);
  });

  it("shows both ARGUMENTS and OPTIONS sections", () => {
    const command: AnyCommandDefinition = {
      description: "Full command",
      args: [{ schema: z.string(), description: "Input file", placeholder: "input" }],
      options: {
        output: {
          name: "output",
          schema: z.string().default("out.txt"),
          description: "Output file",
          aliases: ["o"],
          placeholder: "path",
        },
      },
      handler: () => {},
    };

    const output = formatCommandHelp("mytool", "convert", command);

    expect(output).toMatchInlineSnapshot(`
      "USAGE
        mytool convert <input> [options]

      ARGUMENTS
        input  Input file

      OPTIONS
        -o, --output <path>  Output file (default: out.txt)"
    `);
  });

  it("uses 4-space indent when option has no alias", () => {
    const command: AnyCommandDefinition = {
      description: "No alias",
      options: {
        format: {
          name: "format",
          schema: z.string(),
          description: "Output format",
        },
      },
      handler: () => {},
    };

    const output = formatCommandHelp("mytool", "export", command);

    expect(output).toMatchInlineSnapshot(`
      "USAGE
        mytool export [options]

      OPTIONS
        --format <format>  Output format (required)"
    `);
  });

  it("uses option name as placeholder fallback", () => {
    const command: AnyCommandDefinition = {
      description: "Fallback placeholder",
      options: {
        name: {
          name: "name",
          schema: z.string(),
          description: "Your name",
        },
      },
      handler: () => {},
    };

    const output = formatCommandHelp("mytool", "greet", command);

    expect(output).toMatchInlineSnapshot(`
      "USAGE
        mytool greet [options]

      OPTIONS
        --name <name>  Your name (required)"
    `);
  });

  it("uses custom placeholder when provided", () => {
    const command: AnyCommandDefinition = {
      description: "Custom placeholder",
      options: {
        name: {
          name: "name",
          schema: z.string(),
          description: "Your name",
          placeholder: "who",
        },
      },
      handler: () => {},
    };

    const output = formatCommandHelp("mytool", "greet", command);

    expect(output).toMatchInlineSnapshot(`
      "USAGE
        mytool greet [options]

      OPTIONS
        --name <who>  Your name (required)"
    `);
  });

  it("does not show placeholder for boolean options", () => {
    const command: AnyCommandDefinition = {
      description: "Boolean option",
      options: {
        dry: {
          name: "dry-run",
          schema: z.boolean().default(false),
          description: "Dry run mode",
        },
      },
      handler: () => {},
    };

    const output = formatCommandHelp("mytool", "deploy", command);

    expect(output).toMatchInlineSnapshot(`
      "USAGE
        mytool deploy [options]

      OPTIONS
        --dry-run  Dry run mode (default: false)"
    `);
  });

  it("shows all aliases when option has multiple aliases", () => {
    const command: AnyCommandDefinition = {
      description: "Multi alias",
      options: {
        verbose: {
          name: "verbose",
          schema: z.boolean().default(false),
          description: "Enable verbose output",
          aliases: ["v", "V"],
        },
      },
      handler: () => {},
    };

    const output = formatCommandHelp("mytool", "test", command);

    expect(output).toMatchInlineSnapshot(`
      "USAGE
        mytool test [options]

      OPTIONS
        -v, -V, --verbose  Enable verbose output (default: false)"
    `);
  });

  it("shows (required) for required options", () => {
    const command: AnyCommandDefinition = {
      description: "Required option",
      options: {
        token: {
          name: "token",
          schema: z.string(),
          description: "API token",
        },
      },
      handler: () => {},
    };

    const output = formatCommandHelp("mytool", "auth", command);

    expect(output).toMatchInlineSnapshot(`
      "USAGE
        mytool auth [options]

      OPTIONS
        --token <token>  API token (required)"
    `);
  });

  it("shows (default: value) for options with defaults", () => {
    const command: AnyCommandDefinition = {
      description: "Default option",
      options: {
        port: {
          name: "port",
          schema: z.string().default("3000"),
          description: "Port number",
        },
      },
      handler: () => {},
    };

    const output = formatCommandHelp("mytool", "serve", command);

    expect(output).toMatchInlineSnapshot(`
      "USAGE
        mytool serve [options]

      OPTIONS
        --port <port>  Port number (default: 3000)"
    `);
  });

  it("shows (default: value) for boolean options with defaults", () => {
    const command: AnyCommandDefinition = {
      description: "Boolean default",
      options: {
        verbose: {
          name: "verbose",
          schema: z.boolean().default(false),
          description: "Verbose mode",
        },
      },
      handler: () => {},
    };

    const output = formatCommandHelp("mytool", "run", command);

    expect(output).toMatchInlineSnapshot(`
      "USAGE
        mytool run [options]

      OPTIONS
        --verbose  Verbose mode (default: false)"
    `);
  });

  it("shows no marker for optional options without default", () => {
    const command: AnyCommandDefinition = {
      description: "Optional no default",
      options: {
        config: {
          name: "config",
          schema: z.string().optional(),
          description: "Config file",
        },
      },
      handler: () => {},
    };

    const output = formatCommandHelp("mytool", "init", command);

    expect(output).toMatchInlineSnapshot(`
      "USAGE
        mytool init [options]

      OPTIONS
        --config <config>  Config file"
    `);
  });

  it("shows no marker for required arguments", () => {
    const command: AnyCommandDefinition = {
      description: "Required arg",
      args: [{ schema: z.string(), description: "Input file", placeholder: "file" }],
      handler: () => {},
    };

    const output = formatCommandHelp("mytool", "open", command);

    expect(output).toMatchInlineSnapshot(`
      "USAGE
        mytool open <file> [options]

      ARGUMENTS
        file  Input file"
    `);
  });

  it("shows (optional) for optional arguments", () => {
    const command: AnyCommandDefinition = {
      description: "Optional arg",
      args: [{ schema: z.string().optional(), description: "Config file", placeholder: "config" }],
      handler: () => {},
    };

    const output = formatCommandHelp("mytool", "init", command);

    expect(output).toMatchInlineSnapshot(`
      "USAGE
        mytool init <config> [options]

      ARGUMENTS
        config  Config file (optional)"
    `);
  });

  it("shows (default: value) for arguments with defaults", () => {
    const command: AnyCommandDefinition = {
      description: "Default arg",
      args: [
        { schema: z.string().default("world"), description: "Who to greet", placeholder: "name" },
      ],
      handler: () => {},
    };

    const output = formatCommandHelp("mytool", "greet", command);

    expect(output).toMatchInlineSnapshot(`
      "USAGE
        mytool greet <name> [options]

      ARGUMENTS
        name  Who to greet (default: world)"
    `);
  });

  it("aligns options with varying lengths", () => {
    const command: AnyCommandDefinition = {
      description: "Alignment test",
      options: {
        verbose: {
          name: "verbose",
          schema: z.boolean().default(false),
          description: "Short",
          aliases: ["v"],
        },
        longOptionName: {
          name: "long-option-name",
          schema: z.string(),
          description: "Long",
          placeholder: "val",
        },
      },
      handler: () => {},
    };

    const output = formatCommandHelp("mytool", "align", command);

    expect(output).toMatchInlineSnapshot(`
      "USAGE
        mytool align [options]

      OPTIONS
        -v, --verbose                 Short (default: false)
            --long-option-name <val>  Long (required)"
    `);
  });
});

describe("formatErrors", () => {
  it("formats a single error with ERRORS header and indentation", () => {
    const output = formatErrors(['option "--port": Too small: expected number to be >=1']);

    expect(output).toMatchInlineSnapshot(`
      "ERRORS
        option "--port": Too small: expected number to be >=1"
    `);
  });

  it("formats multiple errors with one error per line", () => {
    const output = formatErrors([
      'option "--port": Too small: expected number to be >=1',
      "argument <file>: Invalid input: expected string, received undefined",
    ]);

    expect(output).toMatchInlineSnapshot(`
      "ERRORS
        option "--port": Too small: expected number to be >=1
        argument <file>: Invalid input: expected string, received undefined"
    `);
  });
});
