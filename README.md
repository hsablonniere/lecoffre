# lecoffre

> [!WARNING]
> This project is a work in progress. Expect breaking changes.

Per-project environment variable manager for the shell.

Store, load and unload environment variables by project and environment, directly in your current shell session.

## Prerequisites

- Node.js 24 or later
- [1Password CLI (`op`)](https://developer.1password.com/docs/cli/get-started/) installed and signed in

## Installation

```sh
npm install -g lecoffre
```

## Storage

By default, lecoffre uses **1Password** as its storage backend. Variables are stored as Secure Notes inside a dedicated `lecoffre` vault.

> [!NOTE]
> When importing variables, field values are briefly visible in the process argument list (`/proc/<pid>/cmdline`). This is a limitation of the 1Password CLI, which does not support reading field values from stdin when spawned as a child process.

To get started, initialize the vault:

```sh
lecoffre init
```

### Alternative: JSON file storage

> [!CAUTION]
> This storage backend is **not secure**. Variables are stored in plain text on disk.

For development or environments without 1Password, set the `LECOFFRE_STORAGE_PATH` environment variable to use a local JSON file instead:

```sh
export LECOFFRE_STORAGE_PATH=/tmp/lecoffre.json
```

## Quick start

```sh
# Initialize the storage backend
lecoffre init

# Import variables from a .env file
lecoffre import < .env

# Load them into your shell
eval "$(lecoffre load)"

# When you're done, unload them
eval "$(lecoffre unload)"
```

## Commands

### `lecoffre init`

Initialize the storage backend. For 1Password, this creates the `lecoffre` vault if it doesn't exist.

### `lecoffre list [project]`

List all projects and their environments. When a project name is given, list only the environments for that project.

```sh
# List all projects
lecoffre list

# List environments for a specific project
lecoffre list my-app
```

### `lecoffre import`

Import variables from stdin in `.env` format. By default, imported variables replace all existing variables for the target environment. Use `--merge` to add or overwrite without removing existing variables.

```sh
# Import and replace
lecoffre import < .env

# Import and merge with existing variables
lecoffre import --merge < .env

# Pipe from another command
cat .env.production | lecoffre import -e production
```

### `lecoffre load`

Output shell commands that export the stored variables. Wrap with `eval` to apply them to the current shell.

```sh
eval "$(lecoffre load)"

# Load a specific environment
eval "$(lecoffre load -e production)"
```

### `lecoffre unload`

Output shell commands that unset the stored variables. Wrap with `eval` to remove them from the current shell.

```sh
eval "$(lecoffre unload)"
```

## Common options

| Option                | Alias | Description      | Default                           |
| --------------------- | ----- | ---------------- | --------------------------------- |
| `--project <name>`    | `-p`  | Project name     | basename of the current directory |
| `--environment <env>` | `-e`  | Environment name | `default`                         |

These options are available on `import`, `load` and `unload`.

## Shell support

Supported shells: **bash**, **zsh** and **fish**. The shell is detected automatically from the parent process.

## License

MIT
