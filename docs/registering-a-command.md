# Registering a command

After creating a command file in `src/commands/`, it must be registered in the entry point to be available on the CLI.

## Steps

1. Create the command file (see [Creating a command](./creating-a-command.md)):

```ts
// src/commands/deploy.ts
import { defineCommand } from "../lib/define-command.ts";

export default defineCommand({
  description: "Deploy the application",
  handler() {
    console.log("deploying...");
  },
});
```

2. Import and register it in `bin/my-cli.ts`:

```ts
import deploy from "../src/commands/deploy.ts";

const commands: Record<string, AnyCommandDefinition> = {
  deploy, // ← add it here
};
```

The key in the `commands` object becomes the command name on the CLI:

```
$ my-cli deploy
deploying...
```

## What you get for free

Once registered, the command automatically gets:

- Listed in the global help (`my-cli --help` or `my-cli` with no arguments)
- Its own `--help` output (`my-cli deploy --help`)
- Argument parsing and Zod validation
- Error on unknown command names

## Command naming

The key in the `commands` record is the command name. Use lowercase, short names:

```ts
const commands: Record<string, AnyCommandDefinition> = {
  deploy, // my-cli deploy
  init, // my-cli init
  status, // my-cli status
};
```

If you need a different CLI name than the import name, set the key explicitly:

```ts
import deployCommand from "../src/commands/deploy.ts";

const commands: Record<string, AnyCommandDefinition> = {
  up: deployCommand, // my-cli up
};
```
