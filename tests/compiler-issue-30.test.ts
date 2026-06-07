import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { compileAndRunGo, isGoAvailable } from "./helpers/compiler";

const GO_SOURCE = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  ".output-go",
  "issue_30_optional_init.go"
);

const goAvailable = isGoAvailable();

describe.skipIf(!goAvailable)("Issue #30 optional def with non-optional initializer", () => {
  it("compiles and runs def currNode@(optional) (new myClass()) in Go", () => {
    const { compile, run } = compileAndRunGo(
      "tests/fixtures/issue_30_optional_init.rgr"
    );
    expect(
      compile.success,
      `Compile failed: ${compile.error || compile.output}`
    ).toBe(true);
    expect(run?.success, `Go build/run failed: ${run?.error}`).toBe(true);
    expect(run?.output).toContain("OK");
  });

  it("emits GoNullable value assignment for non-optional new initializer", () => {
    const { compile } = compileAndRunGo(
      "tests/fixtures/issue_30_optional_init.rgr"
    );
    expect(compile.success).toBe(true);
    const goSource = fs.readFileSync(GO_SOURCE, "utf8");
    expect(goSource).toMatch(/currNode\.value\s*=/);
    expect(goSource).toMatch(/currNode\.has_value\s*=\s*true/);
    expect(goSource).not.toMatch(
      /var currNode \*GoNullable[\s\S]*currNode\s*=\s*CreateNew_myClass/
    );
  });
});
