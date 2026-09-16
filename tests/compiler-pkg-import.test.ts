import { describe, it, expect } from "vitest";
import {
  compileAndRun,
  compileRanger,
  compileAndRunGo,
  compileAndRunPython,
  compileAndRunRust,
  isGoAvailable,
  isPythonAvailable,
  isRustAvailable,
} from "./helpers/compiler";

describe("pkg: imports (ranger.json)", () => {
  it("resolves Import pkg:util and ./Local.rgr via ranger.json", () => {
    const source = "tests/fixtures/pkg/app/App.rgr";
    const { compile, run } = compileAndRun(source);
    expect(
      compile.success,
      `Compile failed: ${compile.error || compile.output}`
    ).toBe(true);
    expect(compile.output).not.toContain("Could not import file");
    expect(compile.output).not.toContain("no ranger.json");
    expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
    expect(run?.output).toContain("pkg-import-ok");
    expect(run?.output).toContain("local");
  });

  it("resolves Import pkg:util/Greeter.rgr as a path inside the package", () => {
    const { compile, run } = compileAndRun(
      "tests/fixtures/pkg/app/Subpath.rgr"
    );
    expect(
      compile.success,
      `Compile failed: ${compile.error || compile.output}`
    ).toBe(true);
    expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
    expect(run?.output).toContain("pkg-import-ok");
  });

  it("fails a missing package by name", () => {
    const result = compileRanger(
      "tests/fixtures/pkg/app/Missing.rgr",
      "es6"
    );
    expect(result.success).toBe(false);
    expect(result.output + (result.error || "")).toMatch(
      /not a dependency|Could not import file|no ranger.json/
    );
  });

  const goIt = isGoAvailable() ? it : it.skip;
  goIt("resolves pkg:util when compiled to Go", () => {
    const { compile, run } = compileAndRunGo("tests/fixtures/pkg/app/App.rgr");
    expect(
      compile.success,
      `Go compile failed: ${compile.error || compile.output}`
    ).toBe(true);
    expect(run?.success, `Go run failed: ${run?.error}`).toBe(true);
    expect(run?.output).toContain("pkg-import-ok");
  });

  const pyIt = isPythonAvailable() ? it : it.skip;
  pyIt("resolves pkg:util when compiled to Python", () => {
    const { compile, run } = compileAndRunPython(
      "tests/fixtures/pkg/app/App.rgr"
    );
    expect(
      compile.success,
      `Python compile failed: ${compile.error || compile.output}`
    ).toBe(true);
    expect(run?.success, `Python run failed: ${run?.error}`).toBe(true);
    expect(run?.output).toContain("pkg-import-ok");
  });

  const rustIt = isRustAvailable() ? it : it.skip;
  rustIt("resolves pkg:util when compiled to Rust", () => {
    const { compile, run } = compileAndRunRust(
      "tests/fixtures/pkg/app/App.rgr"
    );
    expect(
      compile.success,
      `Rust compile failed: ${compile.error || compile.output}`
    ).toBe(true);
    expect(run?.success, `Rust run failed: ${run?.error}`).toBe(true);
    expect(run?.output).toContain("pkg-import-ok");
  });
});
