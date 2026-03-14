import { defineCommand } from "../lib/define-command.ts";
import { getStorage } from "../lib/get-storage.ts";

export const initCommand = defineCommand({
  description: "Initialize the storage backend",
  async handler() {
    const storage = getStorage();
    await storage.init();
    console.log("Storage initialized.");
  },
});
