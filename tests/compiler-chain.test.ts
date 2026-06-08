import { describe, it, expect } from "vitest";
import { compileAndRun, compileRanger } from "./helpers/compiler";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FIXTURES = "tests/fixtures";
const OUT = path.join(__dirname, ".output-chain");

describe("Ranger Compiler - method call chaining", () => {
  it("compiles fluent builder chain with correct JS output", () => {
    const result = compileRanger(
      `${FIXTURES}/chain_fluent_builder.rgr`,
      "es6",
      OUT
    );
    expect(result.success, result.error || result.output).toBe(true);
    const js = fs.readFileSync(
      path.join(OUT, "chain_fluent_builder.js"),
      "utf-8"
    );
    expect(js).toContain(".add(");
    expect(js).toContain(".get(");
  });

  it("runs fluent builder chain and returns sum", () => {
    const { compile, run } = compileAndRun(
      `${FIXTURES}/chain_fluent_builder.rgr`
    );
    expect(compile.success, compile.error || compile.output).toBe(true);
    expect(run?.success, run?.error).toBe(true);
    expect(run?.output?.trim()).toBe("6");
  });

  it("compiles statement-level new().method() chain", () => {
    const result = compileRanger(`${FIXTURES}/chain_new_method.rgr`, "es6", OUT);
    expect(result.success, result.error || result.output).toBe(true);
    const js = fs.readFileSync(path.join(OUT, "chain_new_method.js"), "utf-8");
    expect(js).toContain(".hello(");
    expect(js).toContain(".world(");
  });

  it("runs statement-level chain", () => {
    const { compile, run } = compileAndRun(`${FIXTURES}/chain_new_method.rgr`);
    expect(compile.success, compile.error || compile.output).toBe(true);
    expect(run?.success, run?.error).toBe(true);
    expect(run?.output).toContain("hello");
    expect(run?.output).toContain("world");
  });

  it("runs chain assigned to local then used", () => {
    const { compile, run } = compileAndRun(`${FIXTURES}/chain_local_var.rgr`);
    expect(compile.success, compile.error || compile.output).toBe(true);
    expect(run?.success, run?.error).toBe(true);
    expect(run?.output?.trim()).toBe("30");
  });

  it("infers int return type through full method chain", () => {
    const { compile, run } = compileAndRun(`${FIXTURES}/chain_return_int.rgr`);
    expect(compile.success, compile.error || compile.output).toBe(true);
    expect(run?.success, run?.error).toBe(true);
    expect(run?.output?.trim()).toBe("6");
  });

  it("rejects chain return type mismatch", () => {
    const result = compileRanger(
      `${FIXTURES}/chain_return_type_mismatch.rgr`,
      "es6",
      OUT
    );
    expect(result.success, "expected type error for Acc vs int").toBe(false);
    expect(result.output + (result.error || "")).toMatch(
      /invalid return value type/i
    );
  });

  it("infers int when chain continues from a local variable", () => {
    const { compile, run } = compileAndRun(`${FIXTURES}/chain_var_continue.rgr`);
    expect(compile.success, compile.error || compile.output).toBe(true);
    expect(run?.success, run?.error).toBe(true);
    expect(run?.output?.trim()).toBe("3");
  });
});
