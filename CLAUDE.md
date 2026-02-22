# CLAUDE.md

Guidance for coding agents working in this repository.

## Project Snapshot

- `lecoffre` is a TypeScript CLI package published to npm.
- The project uses an internal CLI framework built on top of `@bomb.sh/args` (argv parsing) and `zod` (validation and type inference).
- Runtime and package format are ESM-only (`"type": "module"`).
- Minimum Node.js version is 24 (`"engines": { "node": ">=24" }`).
- Tool versions are managed with mise (`.mise.toml`).
- There is no build step: TypeScript is executed directly by Node.

## Core Commands

- `pnpm dev` - run the CLI locally
- `pnpm test` - run tests (vitest)
- `pnpm lint` - lint with oxlint, warnings denied
- `pnpm lint:fix` - lint and auto-fix
- `pnpm format` - format with oxfmt
- `pnpm format:check` - check formatting
- `pnpm typecheck` - type-check with tsgo (`--noEmit`)
- `pnpm check` - run lint + format:check + typecheck + test
- `pnpm changeset` - create a changeset
- `pnpm version-packages` - apply changesets and bump versions
- `pnpm release` - publish via changesets

## Repository Layout

- `bin/lecoffre.ts` - CLI entry point (with shebang)
- `src/lib/` - core framework modules (command/option/argument definitions, parsing, help formatting)
- `tests/*.test.ts` - unit and integration tests
- `docs/` - developer documentation for the internal CLI framework (how to define commands, options, arguments)
- `vitest.config.ts` - test include pattern (`tests/**/*.test.ts`)
- `.changeset/config.json` - changeset and changelog configuration

## Engineering Conventions

- Use strict TypeScript and keep code compatible with:
  - `noUncheckedIndexedAccess`
  - `exactOptionalPropertyTypes`
  - `verbatimModuleSyntax`
  - `erasableSyntaxOnly` (no enums, no namespaces, no parameter properties)
- Keep all code and tests in ESM syntax (`import` / `export`).
- Do not introduce a transpile/build output workflow.
- Keep CLI behavior deterministic; tests assert exact stdout.
- When changing CLI output or flags, update tests in `tests/` in the same change.

## Agent Checklist Before Finishing

- Run `pnpm check`.
- If the change is user-facing, create a changeset with `pnpm changeset`.
- Use a conventional commit prefix for commit messages (`feat:`, `fix:`, `chore:`, etc.).
