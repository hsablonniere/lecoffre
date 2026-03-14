import { execFile as execFileCb } from "node:child_process";
import { promisify } from "node:util";
import { ProjectNotFoundError, Storage, StorageNotInitializedError } from "./storage.ts";

interface OpItemSummary {
  id: string;
  title: string;
  category: string;
}

interface OpField {
  id: string;
  label: string;
  value: string;
  type: string;
  section?: { id: string; label: string };
  purpose?: string;
}

interface OpItemDetail {
  id: string;
  title: string;
  fields: Array<OpField>;
}

interface ExecError {
  stderr?: string;
}

function hasStderr(error: unknown): error is ExecError {
  return typeof error === "object" && error !== null && "stderr" in error;
}

function getStderr(error: unknown): string {
  return hasStderr(error) ? (error.stderr?.trim() ?? "") : "";
}

function isItemNotFound(error: unknown): boolean {
  return /isn't an item/i.test(getStderr(error));
}

function isVaultNotFound(error: unknown): boolean {
  return /isn't a vault/i.test(getStderr(error));
}

const execFile = promisify(execFileCb);

async function execOp(...args: Array<string>): Promise<string> {
  try {
    const { stdout } = await execFile("op", args);
    return stdout;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error(
        "1Password CLI (op) is not installed. See https://developer.1password.com/docs/cli/get-started/",
      );
    }
    throw error;
  }
}

const VAULT = "lecoffre";

export class OnePasswordStorage extends Storage {
  private readonly vault: string;

  constructor(vault: string = VAULT) {
    super();
    this.vault = vault;
  }

  private rethrow(error: unknown): never {
    if (isVaultNotFound(error)) {
      throw new StorageNotInitializedError(
        `Vault "${this.vault}" not found. Run "lecoffre init" to create it.`,
      );
    }
    const stderr = getStderr(error);
    if (stderr !== "") {
      throw new Error(stderr);
    }
    throw error;
  }

  async init(): Promise<void> {
    try {
      await execOp("vault", "get", this.vault, "--format", "json");
    } catch (error) {
      if (isVaultNotFound(error)) {
        await execOp("vault", "create", this.vault);
        return;
      }
      throw error;
    }
  }

  private async getItem(project: string): Promise<OpItemDetail | null> {
    try {
      const stdout = await execOp(
        "item",
        "get",
        project,
        "--vault",
        this.vault,
        "--format",
        "json",
      );
      return JSON.parse(stdout) as OpItemDetail;
    } catch (error) {
      if (isItemNotFound(error)) return null;
      return this.rethrow(error);
    }
  }

  /**
   * Return only user-defined fields. 1Password items include system fields
   * (e.g. "notesPlain") that have a `purpose` property set. User-created
   * fields never have `purpose`, so we use that to distinguish them.
   */
  private getUserFields(fields: Array<OpField>): Array<OpField> {
    return fields.filter(
      (field) => field.purpose === undefined && field.section?.label !== undefined,
    );
  }

  async getProjects(): Promise<Array<string>> {
    try {
      const stdout = await execOp("item", "list", "--vault", this.vault, "--format", "json");
      const items = JSON.parse(stdout) as Array<OpItemSummary>;
      return items.map((item) => item.title);
    } catch (error) {
      return this.rethrow(error);
    }
  }

  async getProject(project: string): Promise<Record<string, Record<string, string>>> {
    const item = await this.getItem(project);
    if (item === null) {
      throw new ProjectNotFoundError(project);
    }

    const envs: Record<string, Record<string, string>> = {};
    for (const field of this.getUserFields(item.fields)) {
      const sectionLabel = field.section?.label;
      if (sectionLabel !== undefined) {
        envs[sectionLabel] ??= {};
        envs[sectionLabel][field.label] = field.value;
      }
    }
    return envs;
  }

  // Note: field values are passed as process arguments and are briefly visible
  // in /proc/<pid>/cmdline. The 1Password CLI does not support reading field
  // values from stdin when spawned as a child process (only shell pipes work).
  async setVariables(project: string, env: string, vars: Record<string, string>): Promise<void> {
    const item = await this.getItem(project);

    if (item === null) {
      const fieldAssignments = Object.entries(vars).map(
        ([key, value]) => `${env}.${key}[concealed]=${value}`,
      );
      await execOp(
        "item",
        "create",
        "--vault",
        this.vault,
        "--category",
        "Secure Note",
        "--title",
        project,
        ...fieldAssignments,
      );
      return;
    }

    const operations: Array<string> = [];

    for (const field of this.getUserFields(item.fields)) {
      if (field.section?.label === env) {
        operations.push(`${env}.${field.label}[delete]`);
      }
    }

    for (const [key, value] of Object.entries(vars)) {
      operations.push(`${env}.${key}[concealed]=${value}`);
    }

    if (operations.length > 0) {
      await execOp("item", "edit", project, "--vault", this.vault, ...operations);
    }
  }

  async deleteEnvironment(project: string, env: string): Promise<void> {
    const item = await this.getItem(project);
    if (item === null) {
      return;
    }

    const userFields = this.getUserFields(item.fields);
    const sections = new Set<string>();
    const fieldsToDelete: Array<string> = [];

    for (const field of userFields) {
      if (field.section?.label !== undefined) {
        sections.add(field.section.label);
      }
      if (field.section?.label === env) {
        fieldsToDelete.push(`${env}.${field.label}[delete]`);
      }
    }

    if (fieldsToDelete.length === 0) {
      return;
    }

    if (sections.size <= 1 && sections.has(env)) {
      await execOp("item", "delete", project, "--vault", this.vault);
      return;
    }

    await execOp("item", "edit", project, "--vault", this.vault, ...fieldsToDelete);
  }

  async deleteProject(project: string): Promise<void> {
    try {
      await execOp("item", "delete", project, "--vault", this.vault);
    } catch (error) {
      if (isItemNotFound(error)) return;
      this.rethrow(error);
    }
  }
}
