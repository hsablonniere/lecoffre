import { existsSync } from "node:fs";
import { execa, type Options } from "execa";

type ExecaWithShellOptions = Omit<Options, "shell"> & { shell?: ShellName };

export const shells = {
  bash: "/usr/bin/bash",
  zsh: "/usr/bin/zsh",
  fish: "/usr/bin/fish",
} as const;

export type ShellName = keyof typeof shells;

export function isShellAvailable(name: ShellName): boolean {
  return existsSync(shells[name]);
}

/**
 * Like `execa(file, args, options)` but runs inside a real shell.
 *
 * Prepends `trap : EXIT;` to prevent bash/zsh from exec-optimizing
 * (replacing itself with the child process), which would make
 * `process.ppid` point to the shell's parent instead of the shell itself.
 */
export function runWithShell(file: string, args: Array<string>, options?: ExecaWithShellOptions) {
  const { shell: shellName = "bash", ...execaOptions } = options ?? {};
  const command =
    "trap : EXIT; " +
    [file, ...args]
      .map((arg: string): string => {
        return `'${arg.replaceAll("'", "'\\''")}'`;
      })
      .join(" ");
  return execa(shells[shellName], ["-c", command], {
    reject: false,
    ...execaOptions,
  });
}
