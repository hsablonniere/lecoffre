export class ProjectNotFoundError extends Error {
  readonly project: string;

  constructor(project: string) {
    super(`Project not found: ${project}`);
    this.name = "ProjectNotFoundError";
    this.project = project;
  }
}

export class EnvironmentNotFoundError extends Error {
  readonly project: string;
  readonly environment: string;

  constructor(project: string, environment: string) {
    super(`Environment not found: ${environment}`);
    this.name = "EnvironmentNotFoundError";
    this.project = project;
    this.environment = environment;
  }
}

export class StorageNotInitializedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StorageNotInitializedError";
  }
}

export abstract class Storage {
  abstract init(): Promise<void>;
  abstract getProjects(): Promise<Array<string>>;
  abstract getProject(project: string): Promise<Record<string, Record<string, string>>>;
  abstract setVariables(project: string, env: string, vars: Record<string, string>): Promise<void>;
  abstract deleteEnvironment(project: string, env: string): Promise<void>;
  abstract deleteProject(project: string): Promise<void>;
}
