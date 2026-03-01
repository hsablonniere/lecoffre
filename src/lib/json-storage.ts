import { readFile, writeFile } from "node:fs/promises";
import { Storage } from "./storage.ts";

type StoreData = Record<string, Record<string, Record<string, string>>>;

export class JsonStorage extends Storage {
  #filePath: string;

  constructor(filePath: string) {
    super();
    this.#filePath = filePath;
  }

  async #read(): Promise<StoreData> {
    try {
      const content = await readFile(this.#filePath, "utf-8");
      return JSON.parse(content) as StoreData;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return {};
      }
      throw error;
    }
  }

  async #write(data: StoreData): Promise<void> {
    await writeFile(this.#filePath, JSON.stringify(data, null, 2) + "\n");
  }

  async getProjects(): Promise<Array<string>> {
    const data = await this.#read();
    return Object.keys(data);
  }

  async getEnvironments(project: string): Promise<Array<string>> {
    const data = await this.#read();
    const projectData = data[project];
    if (projectData === undefined) {
      return [];
    }
    return Object.keys(projectData);
  }

  async getVariables(project: string, env: string): Promise<Record<string, string>> {
    const data = await this.#read();
    const projectData = data[project];
    if (projectData === undefined) {
      return {};
    }
    const envData = projectData[env];
    if (envData === undefined) {
      return {};
    }
    return { ...envData };
  }

  async setVariables(project: string, env: string, vars: Record<string, string>): Promise<void> {
    const data = await this.#read();
    if (data[project] === undefined) {
      data[project] = {};
    }
    data[project][env] = vars;
    await this.#write(data);
  }

  async deleteEnvironment(project: string, env: string): Promise<void> {
    const data = await this.#read();
    const projectData = data[project];
    if (projectData !== undefined) {
      delete projectData[env];
      if (Object.keys(projectData).length === 0) {
        delete data[project];
      }
      await this.#write(data);
    }
  }

  async deleteProject(project: string): Promise<void> {
    const data = await this.#read();
    delete data[project];
    await this.#write(data);
  }
}
