import { parse } from "@bomb.sh/args";
import type { AnyCommandDefinition } from "./define-command.ts";
import { formatCommandHelp, formatErrors, formatGlobalHelp } from "./format.ts";
import {
  CommandHelpRequested,
  CommandValidationError,
  findUnknownOptions,
  parseCommand,
} from "./parse-command.ts";

interface MainDefinition {
  name: string;
  commands: Record<string, AnyCommandDefinition>;
}

export interface RunResult {
  exitCode: number;
}

export function defineMain({ name, commands }: MainDefinition) {
  return {
    async run(argv: Array<string>): Promise<RunResult> {
      const initial = parse(argv.slice(2));
      const [commandNameRaw] = initial._;

      if (commandNameRaw === undefined) {
        // --help takes priority over unknown option errors
        const unknownErrors = findUnknownOptions(initial, new Set(["help", "h"]));
        if (unknownErrors.length > 0 && !initial["help"] && !initial["h"]) {
          console.error(formatErrors(unknownErrors) + "\n");
          console.error(formatGlobalHelp(name, commands));
          return { exitCode: 1 };
        }

        console.log(formatGlobalHelp(name, commands));
        return { exitCode: 0 };
      }

      const commandName = String(commandNameRaw);
      const command = commands[commandName];

      if (command === undefined) {
        console.error(formatErrors([`command "${commandName}": unknown command`]) + "\n");
        console.error(formatGlobalHelp(name, commands));
        return { exitCode: 1 };
      }

      try {
        const { options, args } = parseCommand(argv.slice(3), command);
        await command.handler(options, ...args);
      } catch (error) {
        if (error instanceof CommandHelpRequested) {
          console.log(formatCommandHelp(name, commandName, command));
          return { exitCode: 0 };
        }
        if (error instanceof CommandValidationError) {
          console.error(formatErrors(error.errors) + "\n");
          console.error(formatCommandHelp(name, commandName, command));
          return { exitCode: 1 };
        }
        if (error instanceof Error) {
          console.error(error.message);
          return { exitCode: 1 };
        }
        console.error("An unexpected error occurred");
        return { exitCode: 1 };
      }

      return { exitCode: 0 };
    },
  };
}
