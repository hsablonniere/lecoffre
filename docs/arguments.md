# Arguments

Positional arguments are defined with `defineArgument()` and passed as the `args` array of a command.

## Definition

```ts
import { z } from "zod";
import { defineArgument } from "../lib/define-argument.ts";

defineArgument({
  schema: z.string(), // Zod schema for validation and type inference
  description: "Input file", // Shown in help text
  placeholder: "file", // Shown in usage line: my-cli cmd <file>
});
```

## Fields

| Field         | Type        | Required | Description                                       |
| ------------- | ----------- | -------- | ------------------------------------------------- |
| `schema`      | `z.ZodType` | yes      | Zod schema used for validation and type inference |
| `description` | `string`    | yes      | Description shown in the ARGUMENTS help section   |
| `placeholder` | `string`    | yes      | Label shown in the usage line (`<placeholder>`)   |

## Required vs optional

The schema determines whether an argument is required or optional:

```ts
// Required — omitting it will throw a Zod validation error
defineArgument({
  schema: z.string(),
  description: "Input file",
  placeholder: "file",
});

// Optional with a default value — omitting it uses the default
defineArgument({
  schema: z.string().default("world"),
  description: "Who to greet",
  placeholder: "name",
});

// Optional without a default — value is string | undefined
defineArgument({
  schema: z.string().optional(),
  description: "Output file",
  placeholder: "output",
});
```

## Non-string types

Since CLI values are always strings, use `z.coerce` to convert them to other types. Zod's coercion handles the conversion automatically:

```ts
// Number argument
defineArgument({
  schema: z.coerce.number().int().positive(),
  description: "Number of retries",
  placeholder: "count",
});

// Date argument via transform
defineArgument({
  schema: z
    .string()
    .transform((v) => new Date(v))
    .pipe(z.date().min(new Date("2000-01-01"))),
  description: "Start date (ISO 8601)",
  placeholder: "date",
});
```

## Multiple arguments

Arguments are positional, matched in order:

```ts
export default defineCommand({
  description: "Copy a file",
  args: [
    defineArgument({ schema: z.string(), description: "Source", placeholder: "src" }),
    defineArgument({ schema: z.string(), description: "Destination", placeholder: "dest" }),
  ],
  handler(_options, src, dest) {
    // src and dest are both typed as string
  },
});
```

Usage line: `my-cli copy <src> <dest> [options]`

## Help output

Arguments appear in a dedicated ARGUMENTS section when running `--help`, with required/default indicators:

```
USAGE
  my-cli greet <name> [options]

ARGUMENTS
  name  Who to greet (default: world)

OPTIONS
  -h, --help  Show this help message
```

- Required arguments (no default, no `.optional()`) show no marker.
- `(default: value)` is shown for arguments with a `.default()` value.
- `(optional)` is shown for optional arguments without a default.
