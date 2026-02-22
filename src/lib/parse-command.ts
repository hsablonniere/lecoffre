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

export function parseCommand(
  argv: Array<string>,
  command: AnyCommandDefinition,
): { options: Record<string, unknown>; args: Array<unknown> } {
  const commandOptions = command.options ?? {};
  const commandArgs = command.args ?? [];

  const parseOpts = buildParseOptions(commandOptions);
  const raw = parse(argv, parseOpts);

  const errors: Array<string> = [];

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
          errors.push(`option "--${opt.name}": ${issue.message}`);
        }
      } else {
        throw error;
      }
    }
  }

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

  return { boolean, string, alias };
}
