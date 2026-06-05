import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { compileAndRun, compileRanger } from "./helpers/compiler";

const FIXTURE = "tests/fixtures/process_dispatch_turn_notify.rgr";
const OUTPUT_JS = path.join(__dirname, ".output", "process_dispatch_turn_notify.js");

describe("Ranger process dispatch turn", () => {
  it("should wrap proc_send with beginDispatchTurn/endDispatchTurn", () => {
    const result = compileRanger(FIXTURE);
    expect(result.success, `Compile failed: ${result.error || result.output}`).toBe(true);
    const code = fs.readFileSync(OUTPUT_JS, "utf-8");
    expect(code).toContain("ProcessRuntime.beginDispatchTurn");
    expect(code).toContain("ProcessRuntime.endDispatchTurn");
    expect(code).toContain("__rangerFindRoot");
  });

  it("should deliver at most one UI notify per proc_send turn", () => {
    const { compile, run } = compileAndRun(FIXTURE);
    expect(compile.success, `Compile failed: ${compile.error}`).toBe(true);
    expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
    expect(run?.output).toContain("OK process dispatch turn notify");
    expect(run?.output).not.toContain("FAIL dispatch turn");
  });
});
