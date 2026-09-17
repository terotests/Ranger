import { describe, it, expect } from "vitest";
import { compileAndRun, compileRanger } from "./helpers/compiler";

// `tests/compiler-pkg-import.test.ts` proves the mechanism on two fixture
// packages written for it. This file points the same mechanism at the real
// trees in `gallery/` and `lib/`, which is where it has to hold: a package
// whose dependency is declared in ITS manifest and not in the project's, and
// two packages that each carry a file of the same name.
describe("pkg: imports against the repository's own packages", () => {
  it("imports a gallery package by name", () => {
    const { compile, run } = compileAndRun(
      "tests/fixtures/pkg/gallery_app/GalleryPkgApp.rgr"
    );
    expect(
      compile.success,
      `Compile failed: ${compile.error || compile.output}`
    ).toBe(true);
    expect(run?.output).toContain("gallery-pkg-import-ok");
  });

  // gallery_app declares statechart. statechart's own manifest declares vela.
  // Nothing in the project names vela.
  it("resolves a dependency of a dependency through the manifest chain", () => {
    const { compile, run } = compileAndRun(
      "tests/fixtures/pkg/gallery_app/ChainApp.rgr"
    );
    expect(
      compile.success,
      `Compile failed: ${compile.error || compile.output}`
    ).toBe(true);
    expect(run?.output).toContain("chain-ok probe/a");
  });

  // Same shape one level down: vela is declared, and the vela file imported
  // reaches evg through vela's manifest.
  it("resolves evg through vela's manifest, unnamed by the project", () => {
    const { compile, run } = compileAndRun(
      "tests/fixtures/pkg/gallery_app/TransitiveApp.rgr"
    );
    expect(
      compile.success,
      `Compile failed: ${compile.error || compile.output}`
    ).toBe(true);
    expect(run?.output).toContain("transitive-ok");
  });

  // zip, rangersql and graphql in one program. rangersql and graphql each
  // hold `src/core/Token.rgr`, `Tokenizer.rgr` and `Parser.rgr`, and each
  // imports them by the bare name. Keyed on the import string rather than on
  // the file it resolves to, the second package's copies are dropped and the
  // failure surfaces as an unknown type — so this case is the regression
  // guard for that, not just a packaging smoke test.
  it("keeps same-named files from two packages apart", () => {
    const { compile, run } = compileAndRun(
      "tests/fixtures/pkg/gallery_app/LeafApp.rgr"
    );
    expect(
      compile.success,
      `Compile failed: ${compile.error || compile.output}`
    ).toBe(true);
    expect(run?.output).toContain("zip-ok 1");
    expect(run?.output).toContain("sql-ok true");
    expect(run?.output).toContain("gql-ok true");
  });

  it("compiles zip itself, which reaches lib/zip as pkg:zipcore", () => {
    const result = compileRanger("gallery/zip/zip_tool.rgr", "es6");
    expect(result.success, `Compile failed: ${result.error || result.output}`).toBe(
      true
    );
  });

  // A tree that still imports gallery/zip with a relative path gets the same
  // file, and that file's own imports are now `pkg:`. Moving a package to
  // `pkg:` must not require its consumers to move with it.
  it("lets a relative consumer import a package that itself uses pkg:", () => {
    const { compile, run } = compileAndRun("gallery/vfs/tests/VfsTest.rgr");
    expect(
      compile.success,
      `Compile failed: ${compile.error || compile.output}`
    ).toBe(true);
    expect(run?.output).toContain("ALL PASS");
  });
});
