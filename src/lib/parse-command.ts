import { parse } from "@bomb.sh/args";
import { ZodError } from "zod";
import type { AnyCommandDefinition } from "./define-command.ts";
import type { OptionDefinition } from "./define-option.ts";
import { isBoolean } from "./zod-utils.ts";

export class CommandValidationError extends Error {
  errors: Array<string>;

  constructor(errors: Array<string>) {
    super(errors.join("\n"));
    this.errors = errors;
  }
}

export class CommandHelpRequested extends Error {
  constructor() {
    super("Help requested");
  }
}

export function parseCommand(
  argv: Array<string>,
  command: AnyCommandDefinition,
): { options: Record<string, unknown>; args: Array<unknown> } {
  const commandOptions = command.options ?? {};
  const commandArgs = command.args ?? [];

  const parseOpts = buildParseOptions(commandOptions);
  const raw = parse(argv, parseOpts);

  // --help takes priority over validation errors
  if (raw["help"]) {
    throw new CommandHelpRequested();
  }

  const errors: Array<string> = [];

  const knownOptions = new Set<string>(["help", "h"]);
  for (const opt of Object.values(commandOptions)) {
    knownOptions.add(opt.name);
    if (opt.aliases !== undefined) {
      for (const a of opt.aliases) {
        knownOptions.add(a);
      }
    }
  }

  // Unknown options
  errors.push(...findUnknownOptions(raw, knownOptions));

  // Option validation
  const options: Record<string, unknown> = {};
  for (const [key, opt] of Object.entries(commandOptions)) {
    const rawValue = raw[opt.name] as unknown;
    try {
      if (rawValue !== undefined) {
        options[key] = opt.schema.parse(rawValue);
      } else {
        options[key] = opt.schema.parse(undefined);
      }
    } catch (error) {
      if (error instanceof ZodError) {
        for (const issue of error.issues) {
          errors.push(`option "${formatOptionLabel(opt)}": ${issue.message}`);
        }
      } else {
        throw error;
      }
    }
  }

  // Unexpected arguments
  if (raw._.length > commandArgs.length) {
    for (let i = commandArgs.length; i < raw._.length; i++) {
      errors.push(`argument "${raw._[i]}": unexpected argument`);
    }
  }

  // Argument validation
  const args: Array<unknown> = [];
  for (let i = 0; i < commandArgs.length; i++) {
    const argDef = commandArgs[i]!;
    const rawValue = raw._[i];
    try {
      if (rawValue !== undefined) {
        args.push(argDef.schema.parse(String(rawValue)));
      } else {
        args.push(argDef.schema.parse(undefined));
      }
    } catch (error) {
      if (error instanceof ZodError) {
        for (const issue of error.issues) {
          errors.push(`argument <${argDef.placeholder}>: ${issue.message}`);
        }
      } else {
        throw error;
      }
    }
  }

  if (errors.length > 0) {
    throw new CommandValidationError(errors);
  }

  return { options, args };
}

export function findUnknownOptions(
  parsed: Record<string, unknown>,
  knownOptions: Set<string>,
): Array<string> {
  const errors: Array<string> = [];
  for (const key of Object.keys(parsed)) {
    if (key !== "_" && !knownOptions.has(key)) {
      errors.push(`option "${key}": unknown option`);
    }
  }
  return errors;
}

function formatOptionLabel(opt: OptionDefinition): string {
  const parts = opt.aliases !== undefined ? [...opt.aliases, opt.name] : [opt.name];
  return parts.join("/");
}

function buildParseOptions(options: Record<string, OptionDefinition>) {
  const boolean: Array<string> = [];
  const string: Array<string> = [];
  const alias: Record<string, string> = {};

  for (const opt of Object.values(options)) {
    if (isBoolean(opt.schema)) {
      boolean.push(opt.name);
    } else {
      string.push(opt.name);
    }
    if (opt.aliases !== undefined) {
      for (const a of opt.aliases) {
        alias[a] = opt.name;
      }
    }
  }

  boolean.push("help");
  alias["h"] = "help";

  return { boolean, string, alias };
}
