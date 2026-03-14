import { defineCommand } from "../lib/define-command.ts";
import { getStorage } from "../lib/get-storage.ts";
import { projectOption } from "../options/project.option.ts";
import { ProjectNotFoundError } from "../lib/storage.ts";

export const listCommand = defineCommand({
  description: "List projects and their environments",
  options: {
    project: projectOption,
  },
  async handler(options) {
    const storage = getStorage();

    if (options.project !== undefined) {
      let projectData: Record<string, Record<string, string>>;
      try {
        projectData = await storage.getProject(options.project);
      } catch (error) {
        if (error instanceof ProjectNotFoundError) {
          throw new Error(`Project not found: ${options.project}`);
        }
        throw error;
      }
      for (const [env, vars] of Object.entries(projectData)) {
        const count = Object.keys(vars).length;
        console.log(`${env} (${count} variable${count !== 1 ? "s" : ""})`);
      }
      return;
    }

    const projects = await storage.getProjects();

    if (projects.length === 0) {
      console.log("No projects found.");
      return;
    }

    for (const p of projects) {
      console.log(p);
      const projectData = await storage.getProject(p);
      for (const [env, vars] of Object.entries(projectData)) {
        const count = Object.keys(vars).length;
        console.log(`  ${env} (${count} variable${count !== 1 ? "s" : ""})`);
      }
    }
  },
});
