import { describe, it, expect } from "vitest";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { compileAndRun, compileRanger } from "./helpers/compiler";

const FIXTURE = "tests/fixtures/process_proc_send.rgr";
const OUTPUT_JS = path.join(__dirname, ".output", "process_proc_send.js");
const OUTPUT_TS = path.join(__dirname, ".output", "process_proc_send.ts");

describe("Ranger proc_send", () => {
  it("should compile proc_send and emit receiveMessage + findByPath send", () => {
    const result = compileRanger(FIXTURE);
    expect(result.success, `Compile failed: ${result.error || result.output}`).toBe(true);
    const code = fs.readFileSync(OUTPUT_JS, "utf-8");
    expect(code).toContain("receiveMessage");
    expect(code).toContain("findByPath");
    expect(code).toMatch(/proc_send|receiveMessage/);
    expect(code).toContain("app.alpha");
  });

  it("should run proc_send fixture", () => {
    const { compile, run } = compileAndRun(FIXTURE);
    expect(compile.success, `Compile failed: ${compile.error}`).toBe(true);
    expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
    expect(run?.output).toContain("OK process proc_send");
    expect(run?.output).not.toContain("FAIL proc_send:");
  });
});

describe("Ranger proc_send TypeScript emit", () => {
  it("should emit ProcessPath and findProcess overloads", () => {
    const ROOT = path.resolve(__dirname, "..");
    execSync(
      `node bin/output.js -es6 -typescript -esm "${FIXTURE}" -d=tests/.output -o=process_proc_send.ts`,
      {
        cwd: ROOT,
        env: { ...process.env, RANGER_LIB: "./compiler/Lang.rgr;./lib/stdops.rgr" },
        encoding: "utf-8",
        stdio: "pipe",
      }
    );
    const code = fs.readFileSync(OUTPUT_TS, "utf-8");
    expect(code).toContain("export type ProcessPath");
    expect(code).toContain('"app.alpha"');
    expect(code).toContain("export interface ProcessNameRegistry");
    expect(code).toContain("findProcess (path");
    expect(code).toContain("AlphaPage | undefined");
  });
});
