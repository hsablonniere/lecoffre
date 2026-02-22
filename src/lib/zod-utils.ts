import type { z } from "zod";

interface ZodDef {
  type?: string;
  innerType?: z.ZodType;
  defaultValue?: unknown;
  in?: z.ZodType;
}

function getDef(schema: z.ZodType): ZodDef {
  return (schema as unknown as { _zod: { def: ZodDef } })._zod.def;
}

export function isBoolean(schema: z.ZodType): boolean {
  const def = getDef(schema);
  if (def.type === "boolean") return true;
  if (def.type === "default" || def.type === "optional" || def.type === "nullable") {
    if (def.innerType !== undefined) return isBoolean(def.innerType);
  }
  return false;
}

export function isRequired(schema: z.ZodType): boolean {
  const def = getDef(schema);
  if (def.type === "default" || def.type === "optional" || def.type === "nullable") {
    return false;
  }
  if (def.type === "pipe" && def.in !== undefined) {
    return isRequired(def.in);
  }
  return true;
}

export function getDefault(schema: z.ZodType): unknown {
  let current: z.ZodType | undefined = schema;
  while (current !== undefined) {
    const def = getDef(current);
    if (def.type === "default") return def.defaultValue;
    if (def.type === "optional" || def.type === "nullable") {
      current = def.innerType;
      continue;
    }
    if (def.type === "pipe") {
      current = def.in;
      continue;
    }
    break;
  }
  return undefined;
}
