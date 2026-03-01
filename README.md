# lecoffre

> [!WARNING]
> This project is a work in progress. Expect breaking changes.
> Variables are currently stored in a plain JSON file. 1Password integration is planned as the default storage backend.

Per-project environment variable manager for the shell.

Store, load and unload environment variables by project and environment, directly in your current shell session.

## Installation

```sh
npm install -g lecoffre
```

Requires Node.js 24 or later.

## Quick start

```sh
# Import variables from a .env file
lecoffre import < .env

# Load them into your shell
eval "$(lecoffre load)"

# When you're done, unload them
eval "$(lecoffre unload)"
```

## Commands

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
