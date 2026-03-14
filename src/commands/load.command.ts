import { basename } from "node:path";
import { realpath } from "node:fs/promises";
import { z } from "zod";
import { defineCommand } from "../lib/define-command.ts";
import { defineOption } from "../lib/define-option.ts";
import { getStorage } from "../lib/get-storage.ts";
import { detectShell, formatVariables } from "../lib/shell.ts";
import { EnvironmentNotFoundError } from "../lib/storage.ts";

export const loadCommand = defineCommand({
  description: "Load variables into the current shell environment",
  options: {
    project: defineOption({
      name: "project",
      schema: z
        .string()
        .refine((val) => !val.startsWith("-"), { message: 'must not start with "-"' })
        .optional(),
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

    const projectData = await storage.getProject(project);
    const vars = projectData[options.environment];
    if (vars === undefined) {
      throw new EnvironmentNotFoundError(project, options.environment);
    }

    const shell = detectShell();
    const output = formatVariables(shell, vars);
    if (output !== "") {
      console.log(output);
    }
  },
});
