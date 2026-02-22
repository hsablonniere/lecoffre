import type { z } from "zod";

export interface ArgumentDefinition<S extends z.ZodType = z.ZodType> {
  schema: S;
  description: string;
  placeholder: string;
}

export function defineArgument<S extends z.ZodType>(
  definition: ArgumentDefinition<S>,
): ArgumentDefinition<S> {
  return definition;
}
