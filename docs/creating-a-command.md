# Creating a command

A command is a file in `src/commands/` that default-exports the result of `defineCommand()`.

## Minimal command

```ts
// src/commands/greet.ts
import { defineCommand } from "../lib/define-command.ts";

export default defineCommand({
  description: "Say hello",
  handler() {
    console.log("hello!");
  },
});
```

The `handler` receives typed `options` as its first parameter, followed by any positional `args`. When a command declares neither options nor args, the handler takes no parameters.

## Command with a positional argument

```ts
// src/commands/greet.ts
import { z } from "zod";
import { defineArgument } from "../lib/define-argument.ts";
import { defineCommand } from "../lib/define-command.ts";

export default defineCommand({
  description: "Greet someone",
  args: [
    defineArgument({
      schema: z.string().default("world"),
      description: "Who to greet",
      placeholder: "name",
    }),
  ],
  handler(_options, name) {
    // name is typed as string thanks to Zod inference
    console.log(`hello, ${name}!`);
  },
});
```

```
$ my-cli greet
hello, world!

$ my-cli greet Alice
hello, Alice!
```

See [Arguments](./arguments.md) for details.

## Command with options

```ts
// src/commands/farewell.ts
import { z } from "zod";
import { defineCommand } from "../lib/define-command.ts";
import { defineOption } from "../lib/define-option.ts";

export default defineCommand({
  description: "Say goodbye",
  options: {
    firstName: defineOption({
      name: "first-name",
      schema: z.string().default("world"),
      description: "Who to say goodbye to",
      aliases: ["n"],
      placeholder: "name",
    }),
    loud: defineOption({
      name: "loud",
      schema: z.boolean().default(false),
      description: "Shout the farewell",
    }),
  },
  handler(options) {
    // options.firstName is string, options.loud is boolean
    const message = `goodbye, ${options.firstName}!`;
    console.log(options.loud ? message.toUpperCase() : message);
  },
});
```

```
$ my-cli farewell
goodbye, world!

$ my-cli farewell --name Alice --loud
GOODBYE, ALICE!

$ my-cli farewell -n Bob
goodbye, Bob!
```

See [Options](./options.md) for details.

## Command with both

A command can combine positional arguments and named options. Arguments come after `options` in the handler signature:

```ts
export default defineCommand({
  description: "Do something",
  args: [defineArgument({ schema: z.string(), description: "Input file", placeholder: "file" })],
  options: {
    verbose: defineOption({
      name: "verbose",
      schema: z.boolean().default(false),
      description: "Enable verbose output",
      aliases: ["v"],
    }),
  },
  handler(options, file) {
    if (options.verbose) console.log(`Processing ${file}...`);
    // ...
  },
});
```

## Type safety

`defineCommand` infers the types of `options` and `args` from their Zod schemas. The handler parameters are fully typed — no manual type annotations needed. If a schema has a `.default()`, the inferred type reflects that the value is always present.
