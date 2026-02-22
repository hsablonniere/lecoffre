#!/usr/bin/env node

import { parse } from "@bomb.sh/args";
import packageJson from "../package.json" with { type: "json" };
import type { AnyCommandDefinition } from "../src/lib/define-command.ts";
import { formatCommandHelp, formatErrors, formatGlobalHelp } from "../src/lib/format.ts";
import { CommandValidationError, parseCommand } from "../src/lib/parse-command.ts";

const { name } = packageJson;
const commands: Record<string, AnyCommandDefinition> = {};

const initial = parse(process.argv.slice(2), { boolean: ["help"], alias: { h: "help" } });
const [commandNameRaw] = initial._;

if (initial.help || commandNameRaw === undefined) {
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

if (initial.help) {
  console.log(formatCommandHelp(name, commandName, command));
  process.exit(0);
}

try {
  const { options, args } = parseCommand(process.argv.slice(3), command);
  command.handler(options, ...args);
} catch (error) {
  if (error instanceof CommandValidationError) {
    console.error(formatErrors(error.errors) + "\n");
    console.error(formatCommandHelp(name, commandName, command));
    process.exit(1);
  }
  throw error;
}
