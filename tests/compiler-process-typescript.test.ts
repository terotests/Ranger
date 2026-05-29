import { describe, it, expect } from "vitest";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUTPUT_TS = path.join(ROOT, "tests", ".output", "process_named_paths.ts");
const FIXTURE = "tests/fixtures/process_named_paths.rgr";

describe("Ranger @process TypeScript emit", () => {
  it("should emit optional return types and static ProcessRuntime extension", () => {
    const env = {
      ...process.env,
      RANGER_LIB: "./compiler/Lang.rgr;./lib/stdops.rgr",
    };
    execSync(
      `node bin/output.js -es6 -typescript -esm "${FIXTURE}" -d=tests/.output -o=process_named_paths.ts`,
      { cwd: ROOT, env, encoding: "utf-8", stdio: "pipe" }
    );

    const code = fs.readFileSync(OUTPUT_TS, "utf-8");
    expect(code).not.toContain("@ts-nocheck");
    expect(code).toMatch(/findByPath\s*\([^)]*\)\s*:\s*RangerProcessBase\s*\|\s*undefined/);
    expect(code).toContain("static collectAllLiveRoots");
    expect(code).toContain("ProcessRuntime.collectAllLiveRoots()");
    expect(code).not.toMatch(/__singleton\(\)\.collectAllLiveRoots/);
    expect(code).toContain("export type ProcessPath");
    expect(code).toContain("export interface ProcessNameRegistry");
    expect(code).toContain("findProcess(path:");
    expect(code).toContain("AlphaPage | undefined");
    expect(code).toContain("findProcess(path: string)");
    expect(code).toContain("findProcess (path");
    expect(code).not.toContain("export function findProcess");
    expect(code).toContain("__singleton_instance != null");
  });
});
