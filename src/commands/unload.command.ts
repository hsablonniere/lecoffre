import { basename } from "node:path";
import { realpath } from "node:fs/promises";
import { z } from "zod";
import { defineCommand } from "../lib/define-command.ts";
import { defineOption } from "../lib/define-option.ts";
import { getStorage } from "../lib/get-storage.ts";
import { detectShell, formatUnsetVariables } from "../lib/shell.ts";

export const unloadCommand = defineCommand({
  description: "Unload variables from the current shell environment",
  options: {
    project: defineOption({
      name: "project",
      schema: z.string().optional(),
      description: "Project name",
      aliases: ["p"],
      placeholder: "name",
    }),
    environment: defineOption({
      name: "environment",
      schema: z.string().default("default"),
      description: "Environment name",
      aliases: ["e"],
      placeholder: "env",
    }),
  },
  async handler(options) {
    const storage = getStorage();
    const project = options.project ?? basename(await realpath(process.cwd()));

    const vars = await storage.getVariables(project, options.environment);
    const shell = detectShell();
    const output = formatUnsetVariables(shell, Object.keys(vars));
    if (output !== "") {
      console.log(output);
    }
  },
});
