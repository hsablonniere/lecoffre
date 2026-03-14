# lecoffre

## 0.2.0

### Minor Changes

- [#9](https://github.com/hsablonniere/lecoffre/pull/9) [`5af76d2`](https://github.com/hsablonniere/lecoffre/commit/5af76d2f258b5123d59daa242927391219a5fc7f) Thanks [@hsablonniere](https://github.com/hsablonniere)! - Add 1Password as the default storage backend. Variables are now stored as Secure Notes in a dedicated vault. JSON file storage remains available via `LECOFFRE_STORAGE_PATH`. A new `lecoffre init` command creates the vault.

  **Breaking:** `lecoffre list` now takes `project` as an option (`-p`) instead of a positional argument: `lecoffre list -p <project>`.

## 0.1.0

### Minor Changes

- [#5](https://github.com/hsablonniere/lecoffre/pull/5) [`7ddf3b5`](https://github.com/hsablonniere/lecoffre/commit/7ddf3b57ad9ea3cc6bd4c4240d1b039d66db688c) Thanks [@hsablonniere](https://github.com/hsablonniere)! - Add core commands: list, load, unload, and import

  - Add `list` command to display projects with their environments and variable counts
  - Add `load` command to output shell export statements for a project's variables
  - Add `unload` command to output shell unset statements for a project's variables
  - Add `import` command to import variables from stdin in .env format with replace/merge modes
