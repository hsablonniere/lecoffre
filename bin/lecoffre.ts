#!/usr/bin/env node

import { parse } from "@bomb.sh/args";
import packageJson from "../package.json" with { type: "json" };
import { listCommand } from "../src/commands/list.command.ts";
import { loadCommand } from "../src/commands/load.command.ts";
import { unloadCommand } from "../src/commands/unload.command.ts";
import type { AnyCommandDefinition } from "../src/lib/define-command.ts";
import { formatCommandHelp, formatErrors, formatGlobalHelp } from "../src/lib/format.ts";
import {
  CommandHelpRequested,
  CommandValidationError,
  parseCommand,
} from "../src/lib/parse-command.ts";

const { name } = packageJson;
const commands: Record<string, AnyCommandDefinition> = {
  list: listCommand,
  load: loadCommand,
  unload: unloadCommand,
};

const initial = parse(process.argv.slice(2));
const [commandNameRaw] = initial._;

if (commandNameRaw === undefined) {
  console.log(formatGlobalHelp(name, commands));
  process.exit(0);
}

const commandName = String(commandNameRaw);
const command = commands[commandName];

if (command === undefined) {
  console.error(`Unknown command "${commandName}" for "${name}"\n`);
  console.error(formatGlobalHelp(name, commands));
  process.exit(1);
}

try {
  const { options, args } = parseCommand(process.argv.slice(3), command);
  await command.handler(options, ...args);
} catch (error) {
  if (error instanceof CommandHelpRequested) {
    console.log(formatCommandHelp(name, commandName, command));
    process.exit(0);
  }
  if (error instanceof CommandValidationError) {
    console.error(formatErrors(error.errors) + "\n");
    console.error(formatCommandHelp(name, commandName, command));
    process.exit(1);
  }
  if (error instanceof Error) {
    console.error(error.message);
    process.exit(1);
  }
  console.error("An unexpected error occurred");
  process.exit(1);
}
