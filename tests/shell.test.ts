import { describe, expect, it } from "vitest";
import { formatUnsetVariables, formatVariables } from "../src/lib/shell.ts";
import { isShellAvailable, runWithShell, shells, type ShellName } from "./test-helpers.ts";

const script = `import { detectShell } from "./src/lib/shell.ts"; process.stdout.write(detectShell());`;

describe("detectShell (integration)", () => {
  for (const shellName of Object.keys(shells) as Array<ShellName>) {
    it.skipIf(!isShellAvailable(shellName))(`detects ${shellName} via real process`, async () => {
      const result = await runWithShell("node", ["-e", script], {
        shell: shellName,
        cwd: import.meta.dirname + "/..",
      });
      expect(result.stdout).toBe(shellName);
    });
  }
});

describe("formatVariables", () => {
  it("formats for bash", () => {
    expect(formatVariables("bash", { FOO: "bar", NUM: "42" })).toBe(
      "export FOO='bar'\nexport NUM='42'",
    );
  });

  it("formats for zsh (same as bash)", () => {
    expect(formatVariables("zsh", { KEY: "value" })).toBe("export KEY='value'");
  });

  it("formats for fish", () => {
    expect(formatVariables("fish", { FOO: "bar", NUM: "42" })).toBe(
      "set -gx FOO 'bar'\nset -gx NUM '42'",
    );
  });

  it("escapes single quotes in bash/zsh", () => {
    expect(formatVariables("bash", { MSG: "it's a test" })).toBe("export MSG='it'\\''s a test'");
  });

  it("escapes single quotes in fish", () => {
    expect(formatVariables("fish", { MSG: "it's a test" })).toBe("set -gx MSG 'it\\'s a test'");
  });

  it("escapes backslashes in fish", () => {
    expect(formatVariables("fish", { PATH: "C:\\Users" })).toBe("set -gx PATH 'C:\\\\Users'");
  });

  it("handles empty variables", () => {
    expect(formatVariables("bash", {})).toBe("");
  });
});

describe("formatUnsetVariables", () => {
  it("formats for bash", () => {
    expect(formatUnsetVariables("bash", ["FOO", "NUM"])).toBe("unset FOO\nunset NUM");
  });

  it("formats for zsh (same as bash)", () => {
    expect(formatUnsetVariables("zsh", ["KEY"])).toBe("unset KEY");
  });

  it("formats for fish", () => {
    expect(formatUnsetVariables("fish", ["FOO", "NUM"])).toBe("set -e FOO\nset -e NUM");
  });

  it("handles empty list", () => {
    expect(formatUnsetVariables("bash", [])).toBe("");
  });
});
