import { z } from "zod";
import { defineArgument } from "../lib/define-argument.ts";
import { defineCommand } from "../lib/define-command.ts";
import { getStorage } from "../lib/get-storage.ts";

export const listCommand = defineCommand({
  description: "List projects and their environments",
  args: [
    defineArgument({
      schema: z.string().optional(),
      description: "Project name",
      placeholder: "project",
    }),
  ],
  async handler(_options, project) {
    const storage = getStorage();

    if (project !== undefined) {
      const projectData = await storage.getProject(project);
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
