import { z } from "zod";
import { defineOption } from "../lib/define-option.ts";

export const projectOption = defineOption({
  name: "project",
  schema: z
    .string()
    .refine((val) => !val.startsWith("-"), { message: 'must not start with "-"' })
    .optional(),
  description: "Project name",
  aliases: ["p"],
  placeholder: "name",
});
