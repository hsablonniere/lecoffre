import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { $ } from "execa";
import { OnePasswordStorage } from "../src/lib/one-password-storage.ts";
import { ProjectNotFoundError, StorageNotInitializedError } from "../src/lib/storage.ts";

async function isOpAvailable(): Promise<boolean> {
  try {
    await $`op vault list --format=json`;
    return true;
  } catch {
    return false;
  }
}

const opAvailable = await isOpAvailable();

describe.skipIf(!opAvailable)("OnePasswordStorage", () => {
  const testVault = `lecoffre-test-${randomUUID()}`;
  let storage: OnePasswordStorage;

  beforeAll(async () => {
    await $`op vault create ${testVault}`;
    storage = new OnePasswordStorage(testVault);
  });

  afterAll(async () => {
    try {
      await $`op vault delete ${testVault}`;
    } catch {
      // vault may not exist
    }
  });

  it("returns empty projects for an empty vault", async () => {
    expect(await storage.getProjects()).toEqual([]);
  });

  it("throws ProjectNotFoundError for getProject on unknown project", async () => {
    await expect(storage.getProject("foo")).rejects.toThrow(ProjectNotFoundError);
  });

  it("returns all environments and variables with getProject", async () => {
    await storage.setVariables("app", "dev", { A: "1" });
    await storage.setVariables("app", "staging", { B: "2", C: "3" });

    expect(await storage.getProject("app")).toEqual({
      dev: { A: "1" },
      staging: { B: "2", C: "3" },
    });

    await storage.deleteProject("app");
  });

  it("creates project and environment on setVariables", async () => {
    await storage.setVariables("myproject", "production", { API_KEY: "secret", PORT: "3000" });

    expect(await storage.getProjects()).toContain("myproject");
    const projectData = await storage.getProject("myproject");
    expect(projectData).toEqual({ production: { API_KEY: "secret", PORT: "3000" } });

    await storage.deleteProject("myproject");
  });

  it("overwrites variables on setVariables", async () => {
    await storage.setVariables("app", "dev", { A: "1", B: "2" });
    await storage.setVariables("app", "dev", { C: "3" });

    const projectData = await storage.getProject("app");
    expect(projectData).toEqual({ dev: { C: "3" } });

    await storage.deleteProject("app");
  });

  it("supports multiple environments", async () => {
    await storage.setVariables("app1", "dev", { A: "1" });
    await storage.setVariables("app1", "staging", { B: "2" });

    const projectData = await storage.getProject("app1");
    expect(Object.keys(projectData)).toEqual(expect.arrayContaining(["dev", "staging"]));
    expect(projectData["dev"]).toEqual({ A: "1" });
    expect(projectData["staging"]).toEqual({ B: "2" });

    await storage.deleteProject("app1");
  });

  it("supports multiple projects", async () => {
    await storage.setVariables("proj-a", "dev", { A: "1" });
    await storage.setVariables("proj-b", "prod", { B: "2" });

    const projects = await storage.getProjects();
    expect(projects).toContain("proj-a");
    expect(projects).toContain("proj-b");

    await storage.deleteProject("proj-a");
    await storage.deleteProject("proj-b");
  });

  it("deletes an environment", async () => {
    await storage.setVariables("app", "dev", { A: "1" });
    await storage.setVariables("app", "staging", { B: "2" });
    await storage.deleteEnvironment("app", "dev");

    const projectData = await storage.getProject("app");
    expect(Object.keys(projectData)).toEqual(["staging"]);

    await storage.deleteProject("app");
  });

  it("deletes project when last environment is removed", async () => {
    await storage.setVariables("app", "dev", { A: "1" });
    await storage.deleteEnvironment("app", "dev");

    const projects = await storage.getProjects();
    expect(projects).not.toContain("app");
  });

  it("deletes a project with all environments", async () => {
    await storage.setVariables("app", "dev", { A: "1" });
    await storage.setVariables("app", "staging", { B: "2" });
    await storage.deleteProject("app");

    const projects = await storage.getProjects();
    expect(projects).not.toContain("app");
    await expect(storage.getProject("app")).rejects.toThrow(ProjectNotFoundError);
  });

  it("is a no-op to delete a non-existent environment", async () => {
    await storage.deleteEnvironment("nonexistent", "dev");
    expect(await storage.getProjects()).not.toContain("nonexistent");
  });

  it("is a no-op to delete a non-existent project", async () => {
    await storage.setVariables("app", "dev", { A: "1" });
    await storage.deleteProject("nonexistent");
    expect(await storage.getProjects()).toContain("app");
    await storage.deleteProject("app");
  });

  it("init is idempotent", async () => {
    await storage.init();
    await storage.init();
    expect(await storage.getProjects()).toEqual([]);
  });
});

describe.skipIf(!opAvailable)("OnePasswordStorage — uninitialized vault", () => {
  it("throws StorageNotInitializedError when vault does not exist", async () => {
    const storage = new OnePasswordStorage(`nonexistent-${randomUUID()}`);
    await expect(storage.getProjects()).rejects.toThrow(StorageNotInitializedError);
  });
});
