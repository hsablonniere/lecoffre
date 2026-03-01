import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { unlink, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { execa, type Options } from "execa";
import { afterEach, beforeEach } from "vitest";

type ExecaWithShellOptions = Omit<Options, "shell"> & { shell?: ShellName };

const CLI = "bin/lecoffre.ts";

export const shells = {
  bash: "/usr/bin/bash",
  zsh: "/usr/bin/zsh",
  fish: "/usr/bin/fish",
} as const;

export type ShellName = keyof typeof shells;

export function isShellAvailable(name: ShellName): boolean {
  return existsSync(shells[name]);
}

export function useStore() {
  let storePath: string;

  beforeEach(() => {
    storePath = join(tmpdir(), `lecoffre-test-${randomUUID()}.json`);
  });

  afterEach(async () => {
    try {
      await unlink(storePath);
    } catch {}
  });

  function run(args: Array<string>, options?: ExecaWithShellOptions) {
    return runWithShell(CLI, args, {
      ...options,
      env: { LECOFFRE_STORAGE_PATH: storePath, ...options?.env },
    });
  }

  function seed(data: Record<string, unknown>) {
    return writeFile(storePath, JSON.stringify(data));
  }

  return { run, seed };
}

export function runLecoffre(args: Array<string>, options?: ExecaWithShellOptions) {
  return runWithShell(CLI, args, options);
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
