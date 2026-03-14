#!/usr/bin/env node

import packageJson from "../package.json" with { type: "json" };
import { importCommand } from "../src/commands/import.command.ts";
import { initCommand } from "../src/commands/init.command.ts";
import { listCommand } from "../src/commands/list.command.ts";
import { loadCommand } from "../src/commands/load.command.ts";
import { unloadCommand } from "../src/commands/unload.command.ts";
import { defineMain } from "../src/lib/define-main.ts";

const main = defineMain({
  name: packageJson.name,
  commands: {
    init: initCommand,
    list: listCommand,
    load: loadCommand,
    unload: unloadCommand,
    import: importCommand,
  },
});

const { exitCode } = await main.run(process.argv);
process.exit(exitCode);
