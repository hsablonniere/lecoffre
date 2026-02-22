import type { z } from "zod";

export interface OptionDefinition<S extends z.ZodType = z.ZodType> {
  name: string;
  schema: S;
  description: string;
  aliases?: Array<string>;
  placeholder?: string;
}

export function defineOption<S extends z.ZodType>(
  definition: OptionDefinition<S>,
): OptionDefinition<S> {
  return definition;
}
