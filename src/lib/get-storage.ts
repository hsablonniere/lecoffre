import { JsonStorage } from "./json-storage.ts";
import { OnePasswordStorage } from "./one-password-storage.ts";
import type { Storage } from "./storage.ts";

export function getStorage(): Storage {
  const storagePath = process.env.LECOFFRE_STORAGE_PATH;
  if (storagePath !== undefined) {
    return new JsonStorage(storagePath);
  }
  return new OnePasswordStorage();
}
