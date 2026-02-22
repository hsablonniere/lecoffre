import type { z } from "zod";
import type { ArgumentDefinition } from "./define-argument.ts";
import type { OptionDefinition } from "./define-option.ts";

type OptionsRecord = Record<string, OptionDefinition>;
type ArgumentsArray = readonly ArgumentDefinition[];

type InferOptionsType<O> = O extends OptionsRecord
  ? { [K in keyof O]: z.infer<O[K]["schema"]> }
  : Record<string, never>;

type InferArgsType<A extends ArgumentsArray> = {
  [K in keyof A]: A[K] extends ArgumentDefinition ? z.infer<A[K]["schema"]> : never;
};

type CommandHandler<O, A> = A extends ArgumentsArray
  ? (options: InferOptionsType<O>, ...args: InferArgsType<A>) => void
  : (options: InferOptionsType<O>) => void;

export interface CommandDefinition<
  O extends OptionsRecord | undefined = OptionsRecord,
  A extends ArgumentsArray | undefined = ArgumentsArray,
> {
  description: string;
  options?: O | undefined;
  args?: A | undefined;
  handler: CommandHandler<O, A>;
}

/** Type-erased command definition for use in registries. */
export interface AnyCommandDefinition {
  description: string;
  options?: OptionsRecord | undefined;
  args?: ArgumentsArray | undefined;
  handler: (options: any, ...args: any[]) => void;
}

export function defineCommand<
  O extends OptionsRecord | undefined = undefined,
  A extends ArgumentsArray | undefined = undefined,
>(definition: CommandDefinition<O, A>): CommandDefinition<O, A> {
  return definition;
}
