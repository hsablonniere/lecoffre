import { basename } from "node:path";
import { realpath } from "node:fs/promises";
import { defineCommand } from "../lib/define-command.ts";
import { getStorage } from "../lib/get-storage.ts";
import { detectShell, formatVariables } from "../lib/shell.ts";
import { EnvironmentNotFoundError } from "../lib/storage.ts";
import { environmentOption } from "../options/environment.option.ts";
import { projectOption } from "../options/project.option.ts";

export const loadCommand = defineCommand({
  description: "Load variables into the current shell environment",
  options: {
    project: projectOption,
    environment: environmentOption,
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
