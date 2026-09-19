import { describe, it, expect } from "vitest";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const FIXTURE = "tests/fixtures/loops_native.rgr";
const OUT = path.join(ROOT, "tests", ".output-loops");

// PLAN_CPP_IDIOMS C4, on every target that has a loop over a collection.
//
// `for xs v:T i { ... }` was a C-style index loop on eight of them, which is
// the first thing a native reader notices. When the body neither reads the
// index nor touches any name the collection rests on, it is now the loop that
// language actually has. Both conditions are safety, not length: a foreach
// form takes one iterator, enumerator or borrow for the whole loop, so a body
// that appends walks something the index form did not.
//
// The fixture has one loop of each shape, so every target is asked both
// questions by the same file.
// Java writes one file per class, every other target writes one file, so the
// generated code is whatever carries the extension in the output directory.
// The compiler is driven directly rather than through the shared helper: that
// one knows a fixed list of languages and would silently fall back to es6 for
// `dart`, which is the target this file most needs to ask.
const OUTPUT_JS = path.join(ROOT, "bin", "output.js");
const ENV = {
  ...process.env,
  RANGER_LIB: "./compiler/Lang.rgr:./lib/stdops.rgr",
};

function gen(lang: string, ext: string): string {
  const dir = path.join(OUT, lang);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  execSync(
    `node "${OUTPUT_JS}" -l=${lang} "${FIXTURE}" -d="${dir}" -o="loops_native${ext}" -nodecli`,
    { cwd: ROOT, env: ENV, timeout: 60000, stdio: ["pipe", "pipe", "pipe"] }
  );
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(ext));
  expect(files.length, `${lang} wrote no ${ext} file`).toBeGreaterThan(0);
  return files.map((f) => fs.readFileSync(path.join(dir, f), "utf-8")).join("\n");
}

describe("the generated `for` is the target's own loop", () => {
  const cases: Array<[string, string, string, string]> = [
    // lang,   ext,      the foreach form,              the index form it keeps
    ["es6", ".js", "for ( const v of xs)", "for ( let i = 0;"],
    ["cpp", ".cpp", "for ( int v : xs )", "for ( int i = 0;"],
    ["go", ".go", "for _, v := range xs {", "for ; i < int64(len(xs))"],
    ["java7", ".java", "for ( Integer v : xs)", "for ( int i = 0;"],
    ["kotlin", ".kt", "for ( v in xs ) {", "for ( i in xs.indices ) {"],
    ["csharp", ".cs", "foreach ( int v in xs)", "for ( int i = 0;"],
    ["dart", ".dart", "for ( final v in xs)", "for ( int i = 0;"],
    ["python", ".py", "for v in xs:", "for i, v in enumerate(xs):"],
    ["swift6", ".swift", "for v in xs {", "for (i, v) in xs.enumerated()"],
    ["rust", ".rs", "for v in xs.iter().copied()", "let __n_i ="],
  ];

  for (const [lang, ext, foreachForm, indexForm] of cases) {
    it(`${lang}: iterates when the body ignores the index and the collection`, () => {
      const code = gen(lang, ext);
      expect(code).toContain(foreachForm);
    });

    it(`${lang}: keeps the index loop when the body reads the index`, () => {
      const code = gen(lang, ext);
      expect(code).toContain(indexForm);
    });
  }

  // The condition that is about meaning rather than length. Every target above
  // keeps the index form for `growing`, whose body pushes to the collection it
  // is walking -- on C++ that is an invalidated iterator, on Java a
  // ConcurrentModificationException, on Go and Swift a different answer.
  it("never iterates a collection the body appends to", () => {
    // `growing` pushes to the collection it is walking. Every target keeps the
    // index loop there: a foreach form takes one iterator for the whole loop,
    // and what it would walk is not what the index form walks.
    const indexForms: Record<string, string> = {
      es6: "for ( let ", cpp: "for ( int ", go: "for ; ", java7: "for ( int ",
      kotlin: "for ( i", csharp: "for ( int ", dart: "for ( int ",
      python: "in enumerate(", swift6: ".enumerated()", rust: "let __n_",
    };
    const exts: Record<string, string> = {
      es6: ".js", cpp: ".cpp", go: ".go", java7: ".java", kotlin: ".kt",
      csharp: ".cs", dart: ".dart", python: ".py", swift6: ".swift", rust: ".rs",
    };
    for (const lang of Object.keys(indexForms)) {
      const code = gen(lang, exts[lang]);
      const at = code.indexOf("growing");
      expect(at, `${lang}: no growing() in the output`).toBeGreaterThan(-1);
      const tail = code.slice(at, at + 400);
      expect(
        tail.includes(indexForms[lang]),
        `${lang}: growing() lost its index loop:\n${tail.slice(0, 200)}`
      ).toBe(true);
    }
  });
});
