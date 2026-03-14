export class ProjectNotFoundError extends Error {
  constructor(project: string) {
    super(`Project not found: ${project}`);
  }
}

export class EnvironmentNotFoundError extends Error {
  constructor(_project: string, env: string) {
    super(`Environment not found: ${env}`);
  }
}

export abstract class Storage {
  abstract getProjects(): Promise<Array<string>>;
  abstract getProject(project: string): Promise<Record<string, Record<string, string>>>;
  abstract getEnvironments(project: string): Promise<Array<string>>;
  abstract getVariables(project: string, env: string): Promise<Record<string, string>>;
  abstract setVariables(project: string, env: string, vars: Record<string, string>): Promise<void>;
  abstract deleteEnvironment(project: string, env: string): Promise<void>;
  abstract deleteProject(project: string): Promise<void>;
}
