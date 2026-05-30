import { describe, it, expect } from "vitest";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { compileAndRun, compileRanger } from "./helpers/compiler";

const FIXTURE = "tests/fixtures/process_proc_send.rgr";
const FIXTURE_OVERLOAD = "tests/fixtures/process_proc_send_overload.rgr";
const OUTPUT_JS = path.join(__dirname, ".output", "process_proc_send.js");
const OUTPUT_TS = path.join(__dirname, ".output", "process_proc_send.ts");

describe("Ranger proc_send", () => {
  it("should compile proc_send to typed handler calls", () => {
    const result = compileRanger(FIXTURE);
    expect(result.success, `Compile failed: ${result.error || result.output}`).toBe(true);
    const code = fs.readFileSync(OUTPUT_JS, "utf-8");
    expect(code).toContain(".onHello(");
    expect(code).toContain(".onPing(");
    expect(code).toContain(".onGreet(");
    expect(code).not.toContain("receiveMessage(");
    expect(code).toContain("find_process");
    expect(code).toContain("app.alpha");
  });

  it("should run proc_send fixture", () => {
    const { compile, run } = compileAndRun(FIXTURE);
    expect(compile.success, `Compile failed: ${compile.error}`).toBe(true);
    expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
    expect(run?.output).toContain("OK process proc_send");
    expect(run?.output).not.toContain("FAIL proc_send:");
  });

  it("should reject string literal handler at compile time", () => {
    const badFixture = path.join(__dirname, ".output", "proc_send_bad.rgr");
    fs.mkdirSync(path.dirname(badFixture), { recursive: true });
    fs.writeFileSync(
      badFixture,
      `Import "RangerProcess.rgr"
class P @process(true) @name("app.p") extends RangerProcessBase {
  fn onX:void () { }
}
class Main {
  sfn m@(main):void () {
    def p:P (new P)
    proc_start p
    proc_send p "onX"
  }
}
`
    );
    const result = compileRanger(badFixture);
    expect(result.success).toBe(false);
    expect(result.output || result.error || "").toMatch(/handler must be a method name/i);
  });
});

describe("Ranger proc_send overload + class message", () => {
  it("should compile overload handlers and emit mangled method names", () => {
    const result = compileRanger(FIXTURE_OVERLOAD);
    expect(result.success, `Compile failed: ${result.error || result.output}`).toBe(true);
    const code = fs.readFileSync(
      path.join(__dirname, ".output", "process_proc_send_overload.js"),
      "utf-8"
    );
    expect(code).toContain(".onDeliver(");
    expect(code).toContain(".onDeliver_1(");
    expect(code).not.toContain("receiveMessage(");
  });

  it("should run overload fixture (int vs TickMsg)", () => {
    const { compile, run } = compileAndRun(FIXTURE_OVERLOAD);
    expect(compile.success, `Compile failed: ${compile.error}`).toBe(true);
    expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
    expect(run?.output).toContain("OK process proc_send overload");
    expect(run?.output).not.toContain("FAIL proc_send overload:");
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
