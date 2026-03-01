import { JsonStorage } from "./json-storage.ts";
import type { Storage } from "./storage.ts";

const DEFAULT_STORAGE_PATH = "/tmp/lecoffre.json";

export function getStorage(): Storage {
  const storagePath = process.env.LECOFFRE_STORAGE_PATH ?? DEFAULT_STORAGE_PATH;
  return new JsonStorage(storagePath);
}
