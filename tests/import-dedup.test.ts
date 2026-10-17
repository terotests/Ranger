import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { execFileSync } from "child_process";
import { fileURLToPath } from "url";
import { isGoAvailable } from "./helpers/compiler";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const RGRC = path.resolve(__dirname, "..", "dist", "rgrc.js");

// One shared file reached from several modules under different spellings
// (relative, through `..`, through a pkg: path dependency, transitively) must
// be in the output once. Two different files that share a bare name
// (`a/util.rgr`, `b/util.rgr`) must both be in it: the import string alone is
// not what identifies a file.
const FILES: Record<string, string> = {
  "shared/ranger.json": `{ "name": "sh", "version": "0.1.0" }`,
  "shared/S.rgr": `class Shared {
  fn hello:string () {
    return "shared"
  }
}
`,
  "app/ranger.json": `{ "name": "app", "version": "0.1.0", "dependencies": { "sh": { "path": "../shared" } } }`,
  "app/a/util.rgr": `class UtilA {
  fn n:string () {
    return "UA"
  }
}
`,
  "app/b/util.rgr": `class UtilB {
  fn n:string () {
    return "UB"
  }
}
`,
  "app/a/A.rgr": `Import "../../shared/S.rgr"
Import "util.rgr"
class A {
  fn run:string () {
    def s (new Shared)
    return (s.hello())
  }
}
`,
  "app/b/B.rgr": `Import "pkg:sh/S.rgr"
Import "../c/C.rgr"
Import "util.rgr"
class B {
  fn run:string () {
    def s (new Shared)
    return (s.hello())
  }
}
`,
  "app/c/C.rgr": `Import "../a/../../shared/./S.rgr"
Import "../a/A.rgr"
class C {
  fn run:string () {
    def s (new Shared)
    return (s.hello())
  }
}
`,
  "app/main.rgr": `Import "a/A.rgr"
Import "b/B.rgr"
Import "c/C.rgr"
Import "a/A.rgr"
class Main {
  sfn m@(main):void () {
    def a (new A)
    def b (new B)
    def c (new C)
    print ((a.run()) + (b.run()) + (c.run()))
    def ua (new UtilA)
    def ub (new UtilB)
    print ((ua.n()) + (ub.n()))
  }
}
`,
};

let dir = "";
const appDir = () => path.join(dir, "app");

function compile(lang: string, out: string): string {
  execFileSync(
    "node",
    [RGRC, `-l=${lang}`, "main.rgr", `-d=out_${lang}`, `-o=${out}`],
    { cwd: appDir(), encoding: "utf8", stdio: "pipe" }
  );
  return fs.readFileSync(path.join(appDir(), `out_${lang}`, out), "utf8");
}

const count = (text: string, re: RegExp) => (text.match(re) || []).length;

describe("Import de-duplication", () => {
  beforeAll(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "rgr-import-dedup-"));
    for (const [rel, text] of Object.entries(FILES)) {
      const p = path.join(dir, rel);
      fs.mkdirSync(path.dirname(p), { recursive: true });
      fs.writeFileSync(p, text, "utf8");
    }
  });
  afterAll(() => {
    if (dir) fs.rmSync(dir, { recursive: true, force: true });
  });

  it("es6: shared module once, same-named files in two folders both kept", () => {
    const js = compile("es6", "main.js");
    expect(count(js, /^class Shared\b/gm)).toBe(1);
    expect(count(js, /^class A\b/gm)).toBe(1);
    expect(count(js, /^class UtilA\b/gm)).toBe(1);
    expect(count(js, /^class UtilB\b/gm)).toBe(1);
    const out = execFileSync("node", [path.join(appDir(), "out_es6", "main.js")], {
      encoding: "utf8",
    });
    expect(out.trim().split(/\r?\n/)).toEqual(["sharedsharedshared", "UAUB"]);
  });

  it.skipIf(!isGoAvailable())("go: shared module once, same-named files in two folders both kept", () => {
    const go = compile("go", "main.go");
    expect(count(go, /^type Shared struct/gm)).toBe(1);
    expect(count(go, /^type UtilA struct/gm)).toBe(1);
    expect(count(go, /^type UtilB struct/gm)).toBe(1);
    const out = execFileSync("go", ["run", "main.go"], {
      cwd: path.join(appDir(), "out_go"),
      encoding: "utf8",
    });
    expect(out.trim().split(/\r?\n/)).toEqual(["sharedsharedshared", "UAUB"]);
  });
});
