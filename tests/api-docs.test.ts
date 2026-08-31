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
