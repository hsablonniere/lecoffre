import { z } from "zod";
import { defineOption } from "../lib/define-option.ts";

export const environmentOption = defineOption({
  name: "environment",
  schema: z.string().default("default"),
  description: "Environment name",
  aliases: ["e"],
  placeholder: "env",
});
