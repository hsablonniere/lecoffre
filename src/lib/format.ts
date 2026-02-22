import { styleText } from "node:util";
import type { z } from "zod";
import type { ArgumentDefinition } from "./define-argument.ts";
import type { AnyCommandDefinition } from "./define-command.ts";
import type { OptionDefinition } from "./define-option.ts";
import { getDefault, isBoolean, isRequired } from "./zod-utils.ts";

export function formatGlobalHelp(toolName: string, commands: Record<string, AnyCommandDefinition>) {
  const names = Object.keys(commands);

  const sections: Array<string> = [styleText("bold", "USAGE"), `  ${toolName} <command> [options]`];

  if (names.length > 0) {
    const longest = Math.max(...names.map((n) => n.length));
    const commandList = names
      .map((name) => `  ${name.padEnd(longest)}  ${commands[name]!.description}`)
      .join("\n");
    sections.push("", styleText("bold", "COMMANDS"), commandList);
  }

  return sections.join("\n");
}

export function formatCommandHelp(
  toolName: string,
  commandName: string,
  command: AnyCommandDefinition,
) {
  const sections: Array<string> = [
    styleText("bold", "USAGE"),
    formatUsageLine(toolName, commandName, command),
  ];

  const argList = formatArgList(command.args ?? []);
  if (argList !== null) {
    sections.push("", styleText("bold", "ARGUMENTS"), argList);
  }

  const optionList = formatOptionList(command.options ?? {});
  if (optionList !== null) {
    sections.push("", styleText("bold", "OPTIONS"), optionList);
  }

  return sections.join("\n");
}

function formatUsageLine(toolName: string, commandName: string, command: AnyCommandDefinition) {
  const argPlaceholders = (command.args ?? []).map((a) => `<${a.placeholder}>`).join(" ");
  const parts = [toolName, commandName];
  if (argPlaceholders !== "") parts.push(argPlaceholders);
  parts.push("[options]");
  return `  ${parts.join(" ")}`;
}

function formatArgList(args: readonly ArgumentDefinition[]) {
  if (args.length === 0) return null;

  const lines = args.map((arg) => ({
    left: `  ${arg.placeholder}`,
    description: formatArgDescription(arg.description, arg.schema),
  }));

  const longest = Math.max(...lines.map((l) => l.left.length));
  return lines.map((l) => `${l.left.padEnd(longest)}  ${l.description}`).join("\n");
}

function formatOptionList(options: Record<string, OptionDefinition>) {
  const entries = Object.values(options);
  if (entries.length === 0) return null;

  const aliasPrefixes = entries.map((opt) => {
    const aliases = opt.aliases ?? [];
    return aliases.length > 0 ? aliases.map((a) => `-${a}`).join(", ") + ", " : "";
  });
  const longestAlias = Math.max(...aliasPrefixes.map((p) => p.length));

  const lines = entries.map((opt, i) => {
    const aliasPrefix = aliasPrefixes[i]!.padStart(longestAlias);
    const placeholder = opt.placeholder ?? opt.name;
    const flag = isBoolean(opt.schema) ? `--${opt.name}` : `--${opt.name} <${placeholder}>`;
    return {
      left: `  ${aliasPrefix}${flag}`,
      description: formatDescription(opt.description, opt.schema),
    };
  });

  const longest = Math.max(...lines.map((l) => l.left.length));
  return lines.map((l) => `${l.left.padEnd(longest)}  ${l.description}`).join("\n");
}

function formatArgDescription(description: string, schema: z.ZodType): string {
  const defaultValue = getDefault(schema);
  if (defaultValue !== undefined) return `${description} (default: ${String(defaultValue)})`;
  return isRequired(schema) ? description : `${description} (optional)`;
}

function formatDescription(description: string, schema: z.ZodType): string {
  if (isRequired(schema)) return `${description} (required)`;
  const defaultValue = getDefault(schema);
  return defaultValue === undefined
    ? description
    : `${description} (default: ${String(defaultValue)})`;
}

export function formatErrors(errors: Array<string>) {
  const errorLines = errors.map((e) => `  ${e}`).join("\n");
  return `${styleText("bold", "ERRORS")}\n${errorLines}`;
}
