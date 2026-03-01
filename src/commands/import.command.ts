import { basename } from "node:path";
import { realpath } from "node:fs/promises";
import { parseEnv } from "node:util";
import { z } from "zod";
import { defineCommand } from "../lib/define-command.ts";
import { defineOption } from "../lib/define-option.ts";
import { getStorage } from "../lib/get-storage.ts";

export const importCommand = defineCommand({
  description: "Import variables from stdin (.env format)",
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
    merge: defineOption({
      name: "merge",
      schema: z.boolean().default(false),
      description: "Merge with existing variables instead of replacing",
      aliases: ["m"],
    }),
  },
  async handler(options) {
    const storage = getStorage();
    const project = options.project ?? basename(await realpath(process.cwd()));

    const input = await readStdin();
    const newVars = parseEnv(input) as Record<string, string>;

    const existingVars = await storage.getVariables(project, options.environment);

    const added: Array<string> = [];
    const updated: Array<string> = [];
    const removed: Array<string> = [];

    if (options.merge) {
      // Merge mode: add/overwrite without clearing
      for (const key of Object.keys(newVars)) {
        if (key in existingVars) {
          if (existingVars[key] !== newVars[key]) {
            updated.push(key);
          }
        } else {
          added.push(key);
        }
      }
      await storage.setVariables(project, options.environment, { ...existingVars, ...newVars });
    } else {
      // Replace mode: clear then set
      for (const key of Object.keys(newVars)) {
        if (key in existingVars) {
          if (existingVars[key] !== newVars[key]) {
            updated.push(key);
          }
        } else {
          added.push(key);
        }
      }
      for (const key of Object.keys(existingVars)) {
        if (!(key in newVars)) {
          removed.push(key);
        }
      }
      await storage.setVariables(project, options.environment, newVars);
    }

    for (const key of added) {
      console.error(`+ ${key} (added)`);
    }
    for (const key of updated) {
      console.error(`~ ${key} (updated)`);
    }
    for (const key of removed) {
      console.error(`- ${key} (removed)`);
    }

    const totalVars = Object.keys(newVars).length;
    console.error(
      `Imported ${totalVars} variable${totalVars !== 1 ? "s" : ""} into ${project} [${options.environment}]`,
    );
  },
});

async function readStdin(): Promise<string> {
  const chunks: Array<Buffer> = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks).toString("utf-8");
}
