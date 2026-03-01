import { execFileSync } from "node:child_process";
import { basename } from "node:path";

const SUPPORTED_SHELLS = ["bash", "zsh", "fish"] as const;

export type ShellName = (typeof SUPPORTED_SHELLS)[number];

function isSupportedShell(name: string): name is ShellName {
  return (SUPPORTED_SHELLS as ReadonlyArray<string>).includes(name);
}

export function detectShell(): ShellName {
  const name = basename(
    execFileSync("ps", ["-p", String(process.ppid), "-o", "comm="], { encoding: "utf-8" }).trim(),
  );
  if (isSupportedShell(name)) {
    return name;
  }
  throw new Error(`Unsupported shell: ${name}`);
}

export function formatVariables(shell: ShellName, vars: Record<string, string>): string {
  const lines = Object.entries(vars).map(([key, value]) => formatSingleVariable(shell, key, value));
  return lines.join("\n");
}

function formatSingleVariable(shell: ShellName, key: string, value: string): string {
  if (shell === "fish") {
    return `set -gx ${key} '${escapeSingleQuotes(value, "fish")}'`;
  }
  return `export ${key}='${escapeSingleQuotes(value, "posix")}'`;
}

export function formatUnsetVariables(shell: ShellName, keys: Array<string>): string {
  const lines = keys.map((key) => formatSingleUnsetVariable(shell, key));
  return lines.join("\n");
}

function formatSingleUnsetVariable(shell: ShellName, key: string): string {
  if (shell === "fish") {
    return `set -e ${key}`;
  }
  return `unset ${key}`;
}

function escapeSingleQuotes(value: string, mode: "posix" | "fish"): string {
  if (mode === "fish") {
    return value.replaceAll("\\", "\\\\").replaceAll("'", "\\'");
  }
  // In POSIX shells: end quote, escaped quote, restart quote
  return value.replaceAll("'", "'\\''");
}
