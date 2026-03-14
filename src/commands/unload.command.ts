import { basename } from "node:path";
import { realpath } from "node:fs/promises";
import { defineCommand } from "../lib/define-command.ts";
import { getStorage } from "../lib/get-storage.ts";
import { detectShell, formatUnsetVariables } from "../lib/shell.ts";
import { EnvironmentNotFoundError } from "../lib/storage.ts";
import { environmentOption } from "../options/environment.option.ts";
import { projectOption } from "../options/project.option.ts";

export const unloadCommand = defineCommand({
  description: "Unload variables from the current shell environment",
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
    const output = formatUnsetVariables(shell, Object.keys(vars));
    if (output !== "") {
      console.log(output);
    }
  },
});
