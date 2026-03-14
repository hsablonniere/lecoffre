---
"lecoffre": minor
---

Add 1Password as the default storage backend. Variables are now stored as Secure Notes in a dedicated vault. JSON file storage remains available via `LECOFFRE_STORAGE_PATH`. A new `lecoffre init` command creates the vault.

**Breaking:** `lecoffre list` now takes `project` as an option (`-p`) instead of a positional argument: `lecoffre list -p <project>`.
