import { tmpdir } from "node:os";
import { join } from "node:path";
import { unlink } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { JsonStorage } from "../src/lib/json-storage.ts";
import { ProjectNotFoundError } from "../src/lib/storage.ts";

describe("JsonStorage", () => {
  let filePath: string;
  let storage: JsonStorage;

  beforeEach(() => {
    filePath = join(tmpdir(), `lecoffre-test-${randomUUID()}.json`);
    storage = new JsonStorage(filePath);
  });

  afterEach(async () => {
    try {
      await unlink(filePath);
    } catch {
      // file may not exist
    }
  });

  it("returns empty projects when file does not exist", async () => {
    expect(await storage.getProjects()).toEqual([]);
  });

  it("throws ProjectNotFoundError for unknown project", async () => {
    await expect(storage.getProject("foo")).rejects.toThrow(ProjectNotFoundError);
  });

  it("creates project and environment on setVariables", async () => {
    await storage.setVariables("myproject", "production", { API_KEY: "secret", PORT: "3000" });

    expect(await storage.getProjects()).toEqual(["myproject"]);
    const projectData = await storage.getProject("myproject");
    expect(projectData).toEqual({ production: { API_KEY: "secret", PORT: "3000" } });
  });

  it("overwrites variables on setVariables", async () => {
    await storage.setVariables("app", "dev", { A: "1", B: "2" });
    await storage.setVariables("app", "dev", { C: "3" });

    const projectData = await storage.getProject("app");
    expect(projectData).toEqual({ dev: { C: "3" } });
  });

  it("supports multiple projects and environments", async () => {
    await storage.setVariables("app1", "dev", { A: "1" });
    await storage.setVariables("app1", "staging", { B: "2" });
    await storage.setVariables("app2", "prod", { C: "3" });

    expect(await storage.getProjects()).toEqual(["app1", "app2"]);
    const app1 = await storage.getProject("app1");
    expect(Object.keys(app1)).toEqual(["dev", "staging"]);
    const app2 = await storage.getProject("app2");
    expect(Object.keys(app2)).toEqual(["prod"]);
  });

  it("deletes an environment", async () => {
    await storage.setVariables("app", "dev", { A: "1" });
    await storage.setVariables("app", "staging", { B: "2" });
    await storage.deleteEnvironment("app", "dev");

    const projectData = await storage.getProject("app");
    expect(Object.keys(projectData)).toEqual(["staging"]);
  });

  it("deletes project when last environment is removed", async () => {
    await storage.setVariables("app", "dev", { A: "1" });
    await storage.deleteEnvironment("app", "dev");

    expect(await storage.getProjects()).toEqual([]);
  });

  it("deletes a project with all environments", async () => {
    await storage.setVariables("app", "dev", { A: "1" });
    await storage.setVariables("app", "staging", { B: "2" });
    await storage.deleteProject("app");

    expect(await storage.getProjects()).toEqual([]);
    await expect(storage.getProject("app")).rejects.toThrow(ProjectNotFoundError);
  });

  it("is a no-op to delete a non-existent environment", async () => {
    await storage.deleteEnvironment("nonexistent", "dev");
    expect(await storage.getProjects()).toEqual([]);
  });

  it("is a no-op to delete a non-existent project", async () => {
    await storage.setVariables("app", "dev", { A: "1" });
    await storage.deleteProject("nonexistent");
    expect(await storage.getProjects()).toEqual(["app"]);
  });
});
