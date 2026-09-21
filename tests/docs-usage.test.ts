/**
 * The operator registry is only as current as docs/sources.json. These tests
 * measure the Import statements in the tree, so a status that no longer
 * matches the tree fails the suite.
 */
import { describe, expect, it } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const usage = await import(path.join(ROOT, "docs/tools/lib/usage.mjs"));

const registry = JSON.parse(fs.readFileSync(path.join(ROOT, "docs/sources.json"), "utf8"));
const rgrFiles = usage.walkRgrFiles(ROOT);
const shipped = new Set(usage.playgroundLibFiles(ROOT));
const legacyFiles = new Set(
  registry.sources.filter((s: { status: string }) => s.status === "legacy").map((s: { file: string }) => s.file),
);

describe("docs source usage", () => {
  it("does not mark a used operator library as legacy", () => {
    const wrong: string[] = [];
    for (const source of registry.sources) {
      if (source.status !== "legacy" || !source.import) {
        continue;
      }
      const users = usage.nonLegacyImporters(source.import, legacyFiles, { files: rgrFiles });
      if (users.length > 0) {
        wrong.push(`${source.file} is legacy but imported by ${users.slice(0, 5).join(", ")}`);
      }
      if (shipped.has(source.import)) {
        wrong.push(`${source.file} is legacy but the playground ships it`);
      }
    }
    expect(wrong).toEqual([]);
  });

  it("does not mark an unused operator library as stable", () => {
    const wrong: string[] = [];
    for (const source of registry.sources) {
      if (source.status !== "stable" || source.always || !source.import) {
        continue;
      }
      const users = usage.nonLegacyImporters(source.import, legacyFiles, { files: rgrFiles });
      if (users.length === 0 && !shipped.has(source.import)) {
        wrong.push(`${source.file} is stable but has no maintained importer and is not in the playground`);
      }
    }
    expect(wrong).toEqual([]);
  });

  it("names every top-level lib file that declares no operators", () => {
    const known = new Set([
      ...registry.sources.map((s: { file: string }) => s.file),
      ...(registry.classLibraries || []).map((s: { file: string }) => s.file),
    ]);
    const missing: string[] = [];
    const extra: string[] = [];
    for (const file of usage.topLevelLibFiles(ROOT)) {
      if (usage.isLibTestFile(file)) {
        continue;
      }
      const text = fs.readFileSync(path.join(ROOT, file), "utf8");
      if (usage.declaresOperators(text)) {
        continue;
      }
      if (!known.has(file)) {
        missing.push(file);
      }
    }
    for (const entry of registry.classLibraries || []) {
      const text = fs.readFileSync(path.join(ROOT, entry.file), "utf8");
      if (usage.declaresOperators(text)) {
        extra.push(`${entry.file} declares operators and belongs in sources, not classLibraries`);
      }
    }
    expect(missing, "add the file to classLibraries in docs/sources.json").toEqual([]);
    expect(extra).toEqual([]);
  });

  it("gives every class library an import name that matches the file", () => {
    for (const entry of registry.classLibraries || []) {
      expect(entry.file).toBe(`lib/${entry.import}`);
      expect(entry.summary, `${entry.id} has no summary`).toBeTruthy();
    }
  });
});
