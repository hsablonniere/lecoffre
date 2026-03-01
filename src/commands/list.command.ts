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
      const projects = await storage.getProjects();
      if (!projects.includes(project)) {
        throw new Error(`Project not found: ${project}`);
      }

      const envs = await storage.getEnvironments(project);
      for (const env of envs) {
        const vars = await storage.getVariables(project, env);
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
      const envs = await storage.getEnvironments(p);
      for (const env of envs) {
        const vars = await storage.getVariables(p, env);
        const count = Object.keys(vars).length;
        console.log(`  ${env} (${count} variable${count !== 1 ? "s" : ""})`);
      }
    }
  },
});
