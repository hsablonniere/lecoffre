# CLI Framework

This project uses a small, declarative CLI framework built on top of [`@bomb.sh/args`](https://github.com/nicolo-ribaudo/args) and [Zod](https://zod.dev/).

Each command is a standalone file in `src/commands/` that exports a `CommandDefinition`. The entry point registers all commands and handles dispatch, help rendering, and argument parsing automatically.

## Overview

```
bin/my-cli.ts            → entry point, command registry and dispatch
src/commands/*.ts        → one file per command
src/lib/define-command.ts → defineCommand()
src/lib/define-argument.ts → defineArgument()
src/lib/define-option.ts  → defineOption()
src/lib/parse-command.ts  → argv parsing + Zod validation
src/lib/format.ts         → help text and error formatting
src/lib/zod-utils.ts      → Zod schema introspection helpers
```

## Guides

- [Creating a command](./creating-a-command.md) — step-by-step guide
- [Arguments](./arguments.md) — positional arguments reference
- [Options](./options.md) — named options reference
- [Registering a command](./registering-a-command.md) — wiring a command into the CLI
