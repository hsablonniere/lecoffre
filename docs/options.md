# Options

Named options are defined with `defineOption()` and passed as the `options` object of a command.

## Definition

```ts
import { z } from "zod";
import { defineOption } from "../lib/define-option.ts";

defineOption({
  name: "output", // CLI flag name: --output
  schema: z.string(), // Zod schema for validation and type inference
  description: "Output file", // Shown in help text
  aliases: ["o"], // Short flags: -o
  placeholder: "file", // Shown in help: --output <file>
});
```

## Fields

| Field         | Type            | Required | Description                                                            |
| ------------- | --------------- | -------- | ---------------------------------------------------------------------- |
| `name`        | `string`        | yes      | The `--flag` name (kebab-case)                                         |
| `schema`      | `z.ZodType`     | yes      | Zod schema used for validation and type inference                      |
| `description` | `string`        | yes      | Description shown in the OPTIONS help section                          |
| `aliases`     | `Array<string>` | no       | Short aliases (e.g., `["o"]` for `-o`). All aliases are shown in help. |
| `placeholder` | `string`        | no       | Value label in help text (defaults to `name`)                          |

## Key naming

The key in the `options` object is the camelCase name used in the handler. The `name` field is the kebab-case flag on the CLI:

```ts
options: {
  outputDir: defineOption({       // handler receives options.outputDir
    name: "output-dir",           // CLI uses --output-dir
    schema: z.string(),
    description: "Output directory",
  }),
},
```

## String options

```ts
defineOption({
  name: "format",
  schema: z.string().default("json"),
  description: "Output format",
  aliases: ["f"],
});
```

```
$ my-cli cmd --format yaml
$ my-cli cmd -f yaml
```

## Boolean options

Boolean options are flags that don't take a value:

```ts
defineOption({
  name: "verbose",
  schema: z.boolean().default(false),
  description: "Enable verbose output",
  aliases: ["v"],
});
```

```
$ my-cli cmd --verbose
$ my-cli cmd -v
```

The framework detects boolean schemas automatically (including through `.default()` and `.optional()` wrappers) and configures the argument parser accordingly.

## Number options

Since CLI values are always strings, use `z.coerce.number()` to convert them to numbers. Zod's coercion handles the string-to-number conversion automatically:

```ts
defineOption({
  name: "port",
  schema: z.coerce.number().min(1024).default(3000),
  description: "Port number",
  aliases: ["p"],
});
```

```
$ my-cli serve --port 8080
$ my-cli serve -p 8080
```

For more complex conversions, use `z.string().transform().pipe()`:

```ts
defineOption({
  name: "since",
  schema: z
    .string()
    .transform((v) => new Date(v))
    .pipe(z.date()),
  description: "Start date (ISO 8601)",
});
```

```
$ my-cli logs --since 2025-01-15
```

## Required vs optional

Like arguments, the schema controls whether an option is required:

```ts
// Required — must be provided on the CLI
defineOption({
  name: "token",
  schema: z.string(),
  description: "API token",
});

// Optional with default
defineOption({
  name: "port",
  schema: z.coerce.number().min(1024).default(3000),
  description: "Port number",
});
```

## Help output

Options appear in the OPTIONS section with aliases, placeholders, and required/default indicators:

```
OPTIONS
  -f, --format <format>  Output format (default: json)
      --token <token>    API token (required)
  -v, --verbose          Enable verbose output (default: false)
      --config <config>  Config file
  -h, --help             Show this help message
```

- `(required)` is shown for options with no default and no `.optional()`.
- `(default: value)` is shown for options with a `.default()` value.
- Optional options without a default show no marker.
- All aliases are displayed (e.g., `-o, -O, --output` if `aliases: ["o", "O"]`).
- `--help` / `-h` is always included automatically.
