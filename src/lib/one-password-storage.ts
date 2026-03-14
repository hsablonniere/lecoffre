import { $ as $$ } from "execa";
import { EnvironmentNotFoundError, ProjectNotFoundError, Storage } from "./storage.ts";

const $ = $$({ stdin: "ignore" });
const VAULT = "lecoffre";

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

export class OnePasswordStorage extends Storage {
  private vault: string;
  private vaultChecked = false;

  constructor(vault: string = VAULT) {
    super();
    this.vault = vault;
  }

  private async ensureVault(): Promise<void> {
    if (this.vaultChecked) {
      return;
    }
    try {
      await $`op vault get ${this.vault} --format=json`;
    } catch {
      await $`op vault create ${this.vault}`;
    }
    this.vaultChecked = true;
  }

  private async getItem(project: string): Promise<OpItemDetail | null> {
    try {
      const result = await $`op item get ${project} --vault=${this.vault} --format=json`;
      return JSON.parse(result.stdout) as OpItemDetail;
    } catch {
      return null;
    }
  }

  private getUserFields(fields: Array<OpField>): Array<OpField> {
    return fields.filter(
      (field) => field.purpose === undefined && field.section?.label !== undefined,
    );
  }

  async getProjects(): Promise<Array<string>> {
    try {
      const result = await $`op item list --vault=${this.vault} --format=json`;
      const items = JSON.parse(result.stdout) as Array<OpItemSummary>;
      return items.map((item) => item.title);
    } catch {
      return [];
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

  async getEnvironments(project: string): Promise<Array<string>> {
    const projectData = await this.getProject(project);
    return Object.keys(projectData);
  }

  async getVariables(project: string, env: string): Promise<Record<string, string>> {
    const projectData = await this.getProject(project);
    const envData = projectData[env];
    if (envData === undefined) {
      throw new EnvironmentNotFoundError(project, env);
    }
    return envData;
  }

  async setVariables(project: string, env: string, vars: Record<string, string>): Promise<void> {
    await this.ensureVault();

    const item = await this.getItem(project);

    if (item === null) {
      const fieldAssignments = Object.entries(vars).map(
        ([key, value]) => `${env}.${key}[concealed]=${value}`,
      );
      await $`op item create --vault=${this.vault} --category=${"Secure Note"} --title=${project} ${fieldAssignments}`;
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
      await $`op item edit ${project} --vault=${this.vault} ${operations}`;
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
      await $`op item delete ${project} --vault=${this.vault}`;
      return;
    }

    await $`op item edit ${project} --vault=${this.vault} ${fieldsToDelete}`;
  }

  async deleteProject(project: string): Promise<void> {
    try {
      await $`op item delete ${project} --vault=${this.vault}`;
    } catch {
      // Item doesn't exist, no-op
    }
  }
}
