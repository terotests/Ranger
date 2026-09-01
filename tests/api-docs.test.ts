/**
 * `doc { … }` declarations, the API model, and the per-target API output.
 * See PLAN_API_DOCS.md.
 *
 * The point of this suite is that the checks are ones a comment-based
 * documentation system cannot make: a `param` that names no parameter, a
 * `returns` on a void function, a restated type. Those are asserted as
 * compiler errors, not as text in a generated file.
 *
 * The interop tests are the acceptance criterion from the plan: the target's
 * own documentation toolchain reads Ranger output with no Ranger-specific
 * plugin. For JavaScript that is documentation.js; for C# it is the XML
 * documentation file the C# compiler itself produces, which is what DocFX and
 * Sandcastle consume.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { execFileSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const COMPILER = path.join(ROOT, "bin", "output.js");
const OUT = path.join(ROOT, "tests", ".output-apidocs");

const RANGER_LIB = [
  path.join(ROOT, "compiler", "Lang.rgr"),
  path.join(ROOT, "lib", "stdops.rgr"),
].join(":");

interface Compiled {
  ok: boolean;
  stdout: string;
  dir: string;
}

function compile(fixture: string, args: string[], dirName: string): Compiled {
  // The compiler resolves -d= against its working directory, so it has to be
  // repo-relative here even though the test reads back an absolute path.
  const relDir = `tests/.output-apidocs/${dirName}`;
  const dir = path.join(ROOT, relDir);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const argv = [
    COMPILER,
    fixture,
    `-d=${relDir}`,
    ...args,
  ];
  let stdout = "";
  let ok = true;
  try {
    stdout = execFileSync(process.execPath, argv, {
      cwd: ROOT,
      encoding: "utf8",
      env: { ...process.env, RANGER_LIB },
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 32 * 1024 * 1024,
    });
  } catch (e: any) {
    ok = false;
    stdout = `${e.stdout || ""}${e.stderr || ""}`;
  }
  if (!/\[OK\] Compilation successful/.test(stdout)) ok = false;
  return { ok, stdout, dir };
}

function read(dir: string, ...rel: string[]): string {
  return fs.readFileSync(path.join(dir, ...rel), "utf8");
}

describe("doc { } attaches to a declaration", () => {
  it("compiles a doc tail on class, field, method and static method", () => {
    const r = compile(
      "tests/fixtures/api_docs_a11y.rgr",
      ["-es6", "-o=index.js", "-apidoc=docs"],
      "attach"
    );
    expect(r.ok, r.stdout).toBe(true);
  });

  // ISSUES.md #75. Before the detach pass, EnterClass took the doc block for
  // the class body: the real body was never flow-analysed and `return (x + 1)`
  // was emitted as `return+x1` while the compiler reported success.
  it("analyses the class body when the class carries a doc tail", () => {
    const r = compile(
      "tests/fixtures/api_docs_class_tail.rgr",
      ["-es6", "-o=index.js"],
      "class-tail"
    );
    expect(r.ok, r.stdout).toBe(true);
    const js = read(r.dir, "index.js");
    expect(js).toContain("return x + 1");
    expect(js).not.toContain("return+x1");
    const ran = execFileSync(process.execPath, [path.join(r.dir, "index.js")], {
      encoding: "utf8",
    });
    expect(ran.trim()).toBe("2");
  });

  it("rejects a doc block that is not attached to a declaration", () => {
    const r = compile(
      "tests/fixtures/api_docs_detached.rgr",
      ["-es6", "-o=index.js"],
      "detached"
    );
    expect(r.ok).toBe(false);
    expect(r.stdout).toContain("not attached to a declaration");
  });
});

describe("the doc block never restates what the compiler knows", () => {
  it("rejects a param line that carries a type", () => {
    const r = compile(
      "tests/fixtures/api_docs_restated_type.rgr",
      ["-es6", "-o=index.js"],
      "restated"
    );
    expect(r.ok).toBe(false);
    expect(r.stdout).toContain("restates a type");
  });
});

describe("validation against the signature", () => {
  it("rejects a param that names no parameter", () => {
    const r = compile(
      "tests/fixtures/api_docs_invalid.rgr",
      ["-es6", "-o=index.js"],
      "badparam"
    );
    expect(r.ok).toBe(false);
    expect(r.stdout).toContain("does not name a parameter");
  });

  it("rejects a returns on a void function", () => {
    const r = compile(
      "tests/fixtures/api_docs_void_returns.rgr",
      ["-es6", "-o=index.js"],
      "voidreturns"
    );
    expect(r.ok).toBe(false);
    expect(r.stdout).toContain("which returns void");
  });
});

describe("ApiIR (api.json)", () => {
  let model: any;
  beforeAll(() => {
    const r = compile(
      "tests/fixtures/api_docs_a11y.rgr",
      ["-es6", "-o=index.js", "-apidoc=docs", "-apiformat=json,markdown,report"],
      "apiir"
    );
    expect(r.ok, r.stdout).toBe(true);
    model = JSON.parse(read(r.dir, "docs", "api.json"));
  });

  it("carries the types from the compiler, not from the doc block", () => {
    const tree = model.classes.find((c: any) => c.name === "EVGA11yTree");
    const find = tree.methods.find((m: any) => m.name === "find");
    expect(find.params[0]).toMatchObject({ name: "id", type: "string" });
    expect(find.returns.type).toBe("EVGA11yNode");
  });

  it("separates public API from documented-internal from undocumented", () => {
    const tree = model.classes.find((c: any) => c.name === "EVGA11yTree");
    const byName = (n: string) => tree.methods.find((m: any) => m.name === n);
    expect(byName("find")).toMatchObject({ public: true, documented: true });
    expect(byName("rebuildIndex")).toMatchObject({
      public: false,
      documented: true,
    });
    expect(byName("secretHelper")).toMatchObject({
      public: false,
      documented: false,
    });
  });

  it("keeps deprecation as three separate facts", () => {
    const tree = model.classes.find((c: any) => c.name === "EVGA11yTree");
    const old = tree.methods.find((m: any) => m.name === "oldFind");
    expect(old.deprecated).toMatchObject({ since: "2.0", use: "find" });
  });

  it("writes the api report with the public surface only", () => {
    const report = read(path.join(ROOT, "tests", ".output-apidocs", "apiir"), "docs", "api.txt");
    expect(report).toContain("EVGA11yTree.find(id: string): EVGA11yNode");
    expect(report).toContain("@since 1.2");
    expect(report).not.toContain("secretHelper");
    expect(report).not.toContain("rebuildIndex");
  });
});

describe("JavaScript target: JSDoc that documentation.js reads", () => {
  let js = "";
  let dir = "";
  beforeAll(() => {
    const r = compile(
      "tests/fixtures/api_docs_a11y.rgr",
      [
        "-es6",
        "-o=index.js",
        "-nodemodule",
        "-apidoc=docs",
        "-apipackage",
        "-name=evg-a11y",
        "-version=1.2.0",
        "-description=Accessibility tree",
        "-license=MIT",
      ],
      "jsdoc"
    );
    expect(r.ok, r.stdout).toBe(true);
    dir = r.dir;
    js = read(dir, "index.js");
  });

  it("writes JSDoc with the compiler's own types", () => {
    expect(js).toContain("@param {string} id - The stable accessibility identifier.");
    expect(js).toContain("@returns {EVGA11yNode} The matching node");
    expect(js).toContain("@param {EVGA11yNode} node");
    expect(js).toContain("@type {string}");
  });

  it("marks the public API @public and the internal documented @private", () => {
    expect(js).toMatch(/Finds an accessibility node by its stable identifier[\s\S]*?@public/);
    expect(js).toMatch(/Not part of the public API[\s\S]*?@private/);
  });

  it("does not emit a doc-shaped comment for a compiler note", () => {
    // `/** note: unused */` was picked up by documentation.js as an
    // anonymous documented symbol.
    expect(js).not.toContain("/** note: unused");
  });

  it("writes a package.json that npm would publish", () => {
    const pkg = JSON.parse(read(dir, "package.json"));
    expect(pkg).toMatchObject({
      name: "evg-a11y",
      version: "1.2.0",
      main: "index.js",
      license: "MIT",
    });
    expect(pkg.scripts.docs).toContain("documentation build");
    expect(fs.existsSync(path.join(dir, "README.md"))).toBe(true);
  });

  // documentation.js is not a dependency of this repository -- it is a large
  // tree and the devDependencies here are deliberately few. Install it
  // (`npm i -D documentation`) and these two tests run; without it they skip.
  const docjs = path.join(ROOT, "node_modules", ".bin", "documentation");
  const haveDocJs = fs.existsSync(docjs);

  it.runIf(haveDocJs)("documentation.js extracts the API with no plugin", () => {
    const out = execFileSync(process.execPath, [docjs, "build", "index.js", "-f", "json", "--shallow"], {
      cwd: dir,
      encoding: "utf8",
      maxBuffer: 32 * 1024 * 1024,
    });
    const docs = JSON.parse(out);
    const names = docs.map((d: any) => d.name);
    expect(names).toContain("EVGA11yTree");
    expect(names).toContain("EVGA11yNode");
    // every top-level entry is a real symbol: no anonymous entries from
    // compiler-internal comments
    expect(docs.every((d: any) => !!d.name)).toBe(true);

    const tree = docs.find((d: any) => d.name === "EVGA11yTree");
    const find = tree.members.instance.find((m: any) => m.name === "find");
    expect(find.access).toBe("public");
    expect(find.params).toHaveLength(1);
    expect(find.returns).toHaveLength(1);
    expect(find.sees).toHaveLength(1);

    const old = tree.members.instance.find((m: any) => m.name === "oldFind");
    expect(old.deprecated).toBeTruthy();

    // `@private` keeps the documented-internal method out of the default build
    expect(tree.members.instance.map((m: any) => m.name)).not.toContain("rebuildIndex");
  });

  it.runIf(haveDocJs)("documentation.js lint reports nothing", () => {
    const out = execFileSync(process.execPath, [docjs, "lint", "index.js"], {
      cwd: dir,
      encoding: "utf8",
    });
    expect(out.trim()).toBe("");
  });
});

describe("C# target: XML documentation a NuGet package can ship", () => {
  let cs = "";
  let dir = "";
  beforeAll(() => {
    const r = compile(
      "tests/fixtures/api_docs_a11y.rgr",
      [
        "-l=csharp",
        "-o=EvgA11y.cs",
        "-apidoc=docs",
        "-apipackage",
        "-name=Evg.A11y",
        "-version=1.2.0",
        "-description=Accessibility tree",
        "-license=MIT",
      ],
      "csharp"
    );
    expect(r.ok, r.stdout).toBe(true);
    dir = r.dir;
    cs = read(dir, "EvgA11y.cs");
  });

  it("writes XML documentation comments", () => {
    expect(cs).toContain("<summary>Finds an accessibility node by its stable identifier.</summary>");
    expect(cs).toContain('<param name="id">The stable accessibility identifier.</param>');
    expect(cs).toContain("<returns>The matching node");
    expect(cs).toContain('<seealso cref="EVGA11yNode"/>');
    expect(cs).toContain('[System.Obsolete("Use find instead.")]');
  });

  it("puts the types in a namespace and the API surface in public", () => {
    expect(cs).toContain("namespace Evg.A11y {");
    expect(cs).toContain("public class EVGA11yTree");
    expect(cs).toContain("public EVGA11yNode find(");
    // documented but not public, and undocumented, are both internal
    expect(cs).toContain("internal void rebuildIndex()");
    expect(cs).toContain("internal void secretHelper()");
  });

  it("writes a csproj that turns on the XML documentation file", () => {
    const proj = read(dir, "Evg.A11y.csproj");
    expect(proj).toContain("<GenerateDocumentationFile>true</GenerateDocumentationFile>");
    expect(proj).toContain("<PackageId>Evg.A11y</PackageId>");
    expect(proj).toContain("<Version>1.2.0</Version>");
    expect(fs.existsSync(path.join(dir, "docfx.json"))).toBe(true);
  });

  // The `metadata` stage writes api/*.yml and api/toc.yml but never an
  // api/index.md, so a content list naming that file gave the `build` stage
  // nothing of its own: DocFX rendered _site/api/*.html, no _site/index.html,
  // exited 0 and printed "0 error(s)". A site with no front door, reported as
  // a success. The landing page and the toc are written here so `build`
  // always has content.
  it("writes the landing page and toc the build stage renders", () => {
    const cfg = JSON.parse(read(dir, "docfx.json"));
    const globs = cfg.build.content.flatMap((c: any) => c.files);
    expect(globs).toContain("index.md");
    expect(globs).toContain("toc.yml");
    // The file DocFX never generates must not be the only markdown named.
    expect(globs).not.toContain("api/index.md");
    expect(cfg.build.dest).toBe("_site");
    expect(cfg.metadata[0].dest).toBe("api");

    const index = read(dir, "index.md");
    expect(index).toContain("# Evg.A11y");
    expect(index).toContain("Accessibility tree");
    expect(index).toContain("[API reference](api/)");
    expect(read(dir, "toc.yml")).toContain("href: api/");
  });

  const haveMcs = (() => {
    try {
      execFileSync("mcs", ["--version"], { stdio: "ignore" });
      return true;
    } catch {
      return false;
    }
  })();

  // The acceptance criterion for .NET: the C# compiler itself accepts the
  // output and produces the XML documentation file DocFX consumes.
  it.runIf(haveMcs)("compiles and produces a well-formed XML documentation file", () => {
    execFileSync(
      "mcs",
      ["-langversion:latest", "-doc:Evg.A11y.xml", "-out:Evg.A11y.exe", "EvgA11y.cs"],
      { cwd: dir, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }
    );
    const xml = read(dir, "Evg.A11y.xml");
    expect(xml).toContain("<name>Evg.A11y</name>");
    // the C# compiler resolved the cref, which it only does for a real type
    expect(xml).toContain('<seealso cref="T:Evg.A11y.EVGA11yNode" />');
    expect(xml).toContain("M:Evg.A11y.EVGA11yTree.find(System.String)");
    // internal members carry no public API documentation
    expect(xml).not.toContain("secretHelper");
  });
});

describe("Kotlin target: KDoc that Dokka reads", () => {
  let kt = "";
  let dir = "";
  beforeAll(() => {
    const r = compile(
      "tests/fixtures/api_docs_a11y.rgr",
      [
        "-l=kotlin",
        "-o=EvgA11y.kt",
        "-apidoc=docs",
        "-apipackage",
        "-name=com.evg.a11y",
        "-version=1.2.0",
        "-description=Accessibility tree",
      ],
      "kotlin"
    );
    expect(r.ok, r.stdout).toBe(true);
    dir = r.dir;
    kt = read(dir, "EvgA11y.kt");
  });

  it("writes KDoc with the tags Dokka renders", () => {
    expect(kt).toContain("@param id The stable accessibility identifier.");
    // KDoc spells it @return, not @returns
    expect(kt).toContain("@return The matching node");
    expect(kt).not.toContain("@returns ");
    expect(kt).toContain("@since 1.2");
    expect(kt).toContain("@see EVGA11yNode");
  });

  it("builds ReplaceWith from the replacement's own signature", () => {
    expect(kt).toContain('@Deprecated("Since 2.0. Use find instead.", ReplaceWith("find(id)"))');
  });

  it("puts the types in a package and marks non-API members internal", () => {
    expect(kt).toContain("package com.evg.a11y");
    // Kotlin defaults to public, so the modifier that has to be written is
    // the restrictive one
    expect(kt).toContain("internal fun  rebuildIndex()");
    expect(kt).toContain("internal fun  secretHelper()");
    expect(kt).toMatch(/class EVGA11yTree/);
    expect(kt).not.toMatch(/internal[^\n]*class EVGA11yTree/);
  });

  it("writes a Gradle build with Dokka and no pinned toolchain", () => {
    const gradle = read(dir, "build.gradle.kts");
    expect(gradle).toContain('id("org.jetbrains.dokka")');
    expect(gradle).toContain('group = "com.evg"');
    expect(gradle).toContain('artifactId = "a11y"');
    // pinning a JDK the machine does not have fails the build before it
    // compiles anything
    expect(gradle).not.toContain("jvmToolchain");
    expect(fs.existsSync(path.join(dir, "module.md"))).toBe(true);
  });

  const kotlinc = "/tmp/kotlinc/bin/kotlinc";
  const haveKotlinc = fs.existsSync(kotlinc);

  it.runIf(haveKotlinc)("compiles with kotlinc", () => {
    execFileSync(kotlinc, ["EvgA11y.kt", "-d", "out.jar"], {
      cwd: dir,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    expect(fs.existsSync(path.join(dir, "out.jar"))).toBe(true);
  }, 600000);
});

describe("Swift target: DocC markup", () => {
  let sw = "";
  let dir = "";
  beforeAll(() => {
    const r = compile(
      "tests/fixtures/api_docs_a11y.rgr",
      [
        "-l=swift6",
        "-o=EvgA11y.swift",
        "-apidoc=docs",
        "-apipackage",
        "-name=EVGA11y",
        "-version=1.2.0",
        "-description=Accessibility tree",
      ],
      "swift"
    );
    expect(r.ok, r.stdout).toBe(true);
    dir = r.dir;
    sw = read(dir, "EvgA11y.swift");
  });

  it("writes the DocC sections", () => {
    expect(sw).toContain("/// - Parameter id: The stable accessibility identifier.");
    expect(sw).toContain("/// - Returns: The matching node");
    expect(sw).toContain("/// See also: ``EVGA11yNode``");
    // a single parameter takes `- Parameter`, several take `- Parameters:`
    expect(sw).toContain("/// - Parameter node: The node to add");
  });

  it("renders since as a callout, never as @available", () => {
    expect(sw).toContain("/// > Since: 1.2");
    // @available is OS availability, not library version: emitting it would
    // gate the symbol on a platform the author never mentioned
    expect(sw).not.toMatch(/@available\([^)]*1\.2/);
  });

  it("maps deprecation onto @available", () => {
    expect(sw).toContain(
      '@available(*, deprecated, renamed: "find", message: "Since 2.0. Use find instead.")'
    );
  });

  it("marks the API public and leaves the rest internal", () => {
    // Swift defaults to internal, so a module whose types carry no modifier
    // exports nothing at all
    expect(sw).toContain("public final class EVGA11yTree");
    expect(sw).toContain("public func find(id : String)");
    expect(sw).toContain("public var focusId");
    expect(sw).toMatch(/\n {2}func rebuildIndex\(\)/);
    expect(sw).toMatch(/\n {2}func secretHelper\(\)/);
  });

  it("writes a SwiftPM manifest and a DocC catalog", () => {
    const pkg = read(dir, "Package.swift");
    expect(pkg).toContain("// swift-tools-version:5.7");
    expect(pkg).toContain('.library(name: "EVGA11y", targets: ["EVGA11y"])');
    expect(pkg).toContain('sources: ["EvgA11y.swift"]');
    // the catalog's Topics section is built from the `category` entries
    const catalog = read(dir, "EVGA11y.docc", "EVGA11y.md");
    expect(catalog).toContain("# ``EVGA11y``");
    expect(catalog).toContain("### Accessibility");
    expect(catalog).toContain("- ``EVGA11yTree``");
  });
});

describe("a public API may not expose an internal type", () => {
  it("rejects a public method that returns an undocumented class", () => {
    const r = compile(
      "tests/fixtures/api_docs_leak.rgr",
      ["-es6", "-o=index.js"],
      "leak"
    );
    expect(r.ok).toBe(false);
    expect(r.stdout).toContain("returns the internal type `InternalCache`");
  });
});

describe("Python target: Google docstrings that pdoc reads", () => {
  let py = "";
  let dir = "";
  beforeAll(() => {
    const r = compile(
      "tests/fixtures/api_docs_a11y.rgr",
      [
        "-l=python",
        "-o=evg_a11y.py",
        "-apidoc=docs",
        "-apipackage",
        "-name=evg-a11y",
        "-version=1.2.0",
        "-description=Accessibility tree",
      ],
      "python"
    );
    expect(r.ok, r.stdout).toBe(true);
    dir = r.dir;
    py = read(dir, "evg_a11y.py");
  });

  it("writes the docstring INSIDE the def, as the first statement", () => {
    expect(py).toMatch(
      /def find\(self, _id\):\s*\n\s*"""Finds an accessibility node by its stable identifier\./
    );
  });

  it("writes Google-style sections with the compiler's types", () => {
    // the compiled parameter name, not the Ranger one: `id` is a builtin and
    // the writer renamed it
    expect(py).toContain("_id (str): The stable accessibility identifier.");
    expect(py).toContain("EVGA11yNode: The matching node");
    expect(py).toContain("Args:");
    expect(py).toContain("Returns:");
    expect(py).toContain(".. versionadded:: 1.2");
  });

  it("declares the docstring format and the export surface", () => {
    // PEP 258: without it a Google-style Args: block renders as plain text
    expect(py).toContain('__docformat__ = "google"');
    expect(py).toContain('__all__ = ["EVGA11yNode", "EVGA11yTree"]');
    const proj = read(dir, "pyproject.toml");
    expect(proj).toContain('name = "evg-a11y"');
    expect(proj).toContain('py-modules = ["evg_a11y"]');
  });

  it("compiles and runs", () => {
    execFileSync("python3", ["-m", "py_compile", "evg_a11y.py"], { cwd: dir });
    const out = execFileSync("python3", ["evg_a11y.py"], { cwd: dir, encoding: "utf8" });
    expect(out.trim()).toBe("Root");
  });

  const havePdoc = (() => {
    try {
      execFileSync("python3", ["-c", "import pdoc"], { stdio: "ignore" });
      return true;
    } catch {
      return false;
    }
  })();

  it.runIf(havePdoc)("pdoc renders the sections as structure, not prose", () => {
    execFileSync("python3", ["-m", "pdoc", "--output-dir", "pdocs", "evg_a11y.py"], {
      cwd: dir,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    const html = read(dir, "pdocs", "evg_a11y.html");
    const docstrings = [...html.matchAll(/<div class="docstring">([\s\S]*?)<\/div>/g)].map(
      (m) => m[1]
    );
    const findDoc = docstrings.find((d) =>
      d.includes("Finds an accessibility node by its stable identifier")
    );
    expect(findDoc, "no rendered docstring for find").toBeTruthy();
    // "Args:" became a real section heading rather than a line of text
    expect(findDoc).toMatch(/Arguments|Parameters/);
    // `.. versionadded::` rendered as a directive
    expect(findDoc).toContain("New in version 1.2");
  }, 600000);
});

describe("Dart target: dartdoc and a generated export surface", () => {
  let dart = "";
  let dir = "";
  beforeAll(() => {
    const r = compile(
      "tests/fixtures/api_docs_a11y.rgr",
      [
        "-l=dart",
        "-o=evg_a11y_impl.dart",
        "-apidoc=docs",
        "-apipackage",
        "-name=evg_a11y",
        "-version=1.2.0",
        "-description=Accessibility tree",
      ],
      "dart/lib/src"
    );
    expect(r.ok, r.stdout).toBe(true);
    dir = r.dir;
    dart = read(dir, "evg_a11y_impl.dart");
  });

  it("writes dartdoc comments with bracket references", () => {
    expect(dart).toContain("/// Finds an accessibility node by its stable identifier.");
    // dartdoc has no @param tag: the name goes in brackets so it resolves
    expect(dart).toContain("/// [id] The stable accessibility identifier.");
    expect(dart).toContain("/// Returns The matching node");
    expect(dart).toContain("/// See also [EVGA11yNode].");
    expect(dart).toContain("@Deprecated('Since 2.0. Use find instead.')");
  });

  it("generates the package library from the model", () => {
    // Dart's only private form is a leading underscore, which renames every
    // call site. The idiomatic surface is the export list instead -- and it is
    // exactly the kind of list that rots when a person maintains it.
    const barrel = fs.readFileSync(path.join(dir, "..", "evg_a11y.dart"), "utf8");
    expect(barrel).toContain("library evg_a11y;");
    expect(barrel).toContain("export 'src/evg_a11y_impl.dart'");
    expect(barrel).toContain("show EVGA11yNode, EVGA11yTree");
  });

  it("writes the package layout dart doc needs", () => {
    // `dart doc` documents lib/ and nothing else -- a flat directory gives
    // "dartdoc could not find any libraries to document" -- and it skips
    // lib/src/ once the package resolves.
    const pubspec = fs.readFileSync(path.join(dir, "..", "..", "pubspec.yaml"), "utf8");
    expect(pubspec).toContain("name: evg_a11y");
    expect(pubspec).toContain("version: 1.2.0");
  });

  const dartBin = "/tmp/dart-sdk/bin/dart";
  const haveDart = fs.existsSync(dartBin);
  const pkgDir = path.join(ROOT, "tests", ".output-apidocs", "dart");

  it.runIf(haveDart)("analyzes clean, and dart doc documents only the public library", () => {
    const env = { ...process.env, PUB_CACHE: "/tmp/pubcache" };
    const run = (args: string[]) =>
      execFileSync(dartBin, args, {
        cwd: pkgDir,
        encoding: "utf8",
        env,
        stdio: ["ignore", "pipe", "pipe"],
      });

    const analysis = run(["analyze", "--no-fatal-warnings"]);
    expect(analysis).not.toMatch(/error -/);

    // without package resolution dartdoc sees file:// URIs, cannot tell
    // lib/src from lib, and both names and canonicalisation go wrong
    run(["pub", "get"]);
    const out = run(["doc", "--output", "docs_api", "."]);
    expect(out).toContain("Documented 1 public library");

    const lib = fs.readFileSync(
      path.join(pkgDir, "docs_api", "evg_a11y", "evg_a11y-library.html"),
      "utf8"
    );
    // the package library page lists exactly the public surface
    expect(lib).toContain("EVGA11yTree");
    expect(lib).toContain("EVGA11yNode");

    // canonically under the package library, not under lib/src
    const find = fs.readFileSync(
      path.join(pkgDir, "docs_api", "evg_a11y", "EVGA11yTree", "find.html"),
      "utf8"
    );
    const text = find.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
    expect(text).toContain("Finds an accessibility node by its stable identifier.");
    expect(text).toContain("The stable accessibility identifier.");
    expect(text).toContain("Since 1.2");
  }, 1800000);
});

describe("`example` names a function, not a string", () => {
  // The whole point: the sample is compiled, so it cannot drift from the API
  // it demonstrates -- and each target shows the sample in ITS OWN syntax.
  const targets = [
    { lang: "-es6", ext: "js", fence: "@example", body: 'const g = new Greeter();' },
    { lang: "-l=kotlin", ext: "kt", fence: "```kotlin", body: 'val g : Greeter  =  Greeter();' },
    { lang: "-l=python", ext: "py", fence: "Example:", body: "g = Greeter()" },
    { lang: "-l=dart", ext: "dart", fence: "```dart", body: "Greeter g =  Greeter();" },
    { lang: "-l=csharp", ext: "cs", fence: "<example><code>", body: "Greeter g = new Greeter();" },
    { lang: "-l=swift6", ext: "swift", fence: "```swift", body: "let g : Greeter = Greeter()" },
  ];

  for (const t of targets) {
    it(`renders the example in ${t.ext} syntax and leaves it out of the output`, () => {
      const r = compile(
        "tests/fixtures/api_docs_example.rgr",
        [t.lang, `-o=x.${t.ext}`],
        `example-${t.ext}`
      );
      expect(r.ok, r.stdout).toBe(true);
      const code = read(r.dir, `x.${t.ext}`);
      expect(code).toContain(t.fence);
      expect(code).toContain(t.body);
      // the example function and the class that holds it are gone: an
      // example is checked, not shipped
      expect(code).not.toContain("greetExample");
      expect(code).not.toMatch(/(^|\n)\s*(public |final |internal )*class GreeterExamples/);
      // the API it documents is still there
      expect(code).toContain("Builds a greeting for a name.");
    });
  }

  it("keeps the example in the output under -keep-examples", () => {
    const r = compile(
      "tests/fixtures/api_docs_example.rgr",
      ["-l=kotlin", "-o=x.kt", "-keep-examples"],
      "example-keep"
    );
    expect(r.ok, r.stdout).toBe(true);
    const code = read(r.dir, "x.kt");
    expect(code).toContain("greetExample");
    expect(code).toContain("class GreeterExamples");
  });

  it("type checks the example: a mistake inside one fails the build", () => {
    const r = compile(
      "tests/fixtures/api_docs_example_broken.rgr",
      ["-l=kotlin", "-o=x.kt"],
      "example-broken"
    );
    expect(r.ok).toBe(false);
    expect(r.stdout).toContain("greetz");
  });

  it("rejects an example that names no function", () => {
    const r = compile(
      "tests/fixtures/api_docs_example_missing.rgr",
      ["-l=kotlin", "-o=x.kt"],
      "example-missing"
    );
    expect(r.ok).toBe(false);
    expect(r.stdout).toContain("`example noSuchExample` names no function");
  });

  it("renders the example exactly as the compiler emits that code", () => {
    // the rendered sample is the writer's own output, so it cannot claim
    // syntax the target would not have produced
    const r = compile(
      "tests/fixtures/api_docs_example.rgr",
      ["-l=kotlin", "-o=x.kt", "-keep-examples"],
      "example-faithful"
    );
    expect(r.ok, r.stdout).toBe(true);
    const code = read(r.dir, "x.kt");
    const open = code.indexOf("```kotlin");
    const close = code.indexOf("```", open + 9);
    const inDoc = code
      .slice(open + 9, close)
      .split("\n")
      .map((l) => l.replace(/^\s*\*\s?/, "").trim())
      .filter((l) => l.length > 0);
    expect(inDoc.length).toBeGreaterThan(1);
    // every rendered line appears verbatim in the emitted example function
    const emitted = code.slice(code.indexOf("greetExample"));
    for (const line of inDoc) {
      expect(emitted, `rendered line missing from emitted code: ${line}`).toContain(line);
    }
  });

  it("keeps a class that holds an example AND something else", () => {
    // The removal is per class and conservative: a class is only dropped when
    // every member is an example. A top-level `sfn` attaches to the LAST
    // declared class, so `main` landing in an examples class must not delete
    // the program's entry point.
    const src = fs
      .readFileSync(path.join(ROOT, "tests/fixtures/api_docs_example.rgr"), "utf8")
      .replace(/class App \{[\s\S]*?\n\}/, "")
      .trimEnd()
      .concat('\nsfn main:void () {\n  print "ok"\n}\n');
    const tmp = path.join(ROOT, "tests/fixtures/.api_docs_example_mainlast.rgr");
    fs.writeFileSync(tmp, src);
    try {
      const r = compile(
        "tests/fixtures/.api_docs_example_mainlast.rgr",
        ["-l=kotlin", "-o=x.kt"],
        "example-mainlast"
      );
      expect(r.ok, r.stdout).toBe(true);
      const code = read(r.dir, "x.kt");
      // the example body is still gone
      expect(code).not.toContain("greetExample");
      // but the class survives, because main lives in it
      expect(code).toContain("class GreeterExamples");
      expect(code).toContain("fun main(");
    } finally {
      fs.rmSync(tmp, { force: true });
    }
  });

  it("a compiled example still runs", () => {
    const r = compile(
      "tests/fixtures/api_docs_example.rgr",
      ["-es6", "-o=x.js"],
      "example-run"
    );
    expect(r.ok, r.stdout).toBe(true);
    const out = execFileSync(process.execPath, [path.join(r.dir, "x.js")], {
      encoding: "utf8",
    });
    expect(out.trim()).toBe("Hello, Ranger");
  });
});
