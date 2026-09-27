// ============================================================================
// rust-parser.test.ts — the Rust lexer and parser written in Ranger
// (compiler/frontend/rust, PLAN_RUST_SYNTAX.md stage R0).
// ============================================================================
//
// 1. Golden dumps: every tests/fixtures/rust_syntax/*.rs parses to the tree in
//    its .dump file. `UPDATE_GOLDEN=1 npx vitest run … rust-parser` rewrites
//    them; review the diff before committing.
// 2. Every .rs file tracked in the repository parses and passes the span check
//    (no dropped statements or items), except files that are not valid Rust.
// 3. Invalid input is reported, not silently accepted.
// ============================================================================

import { describe, it, expect, beforeAll } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { execSync, spawnSync } from "child_process";

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "tests", ".output", "rust-parser");
const CLI_SRC = "compiler/frontend/rust/cli/RustParseMain.rgr";
const CLI_JS = path.join(OUT, "rustparse.js");
const FIXTURES = path.join(ROOT, "tests", "fixtures", "rust_syntax");

// Tracked .rs files that are not valid Rust: rustfmt rejects them with the
// same errors the parser reports.
const INVALID_RUST = new Set(["legacy/rust_compiler/src/parsers/mod.rs"]);

function run(args: string[]) {
  const r = spawnSync("node", [CLI_JS, ...args], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  return { status: r.status, out: r.stdout + r.stderr };
}

beforeAll(() => {
  fs.mkdirSync(OUT, { recursive: true });
  const log = execSync(
    `node dist/rgrc.js -es6 ${CLI_SRC} -d=${path.relative(ROOT, OUT)} -o=rustparse.js -nodecli 2>&1`,
    { cwd: ROOT, encoding: "utf8" }
  );
  if (log.includes("[FAIL]") || !fs.existsSync(CLI_JS)) {
    throw new Error(`compiling the Rust parser failed:\n${log}`);
  }
}, 120000);

describe("Rust parser: golden trees", () => {
  const fixtures = fs
    .readdirSync(FIXTURES)
    .filter((f) => f.endsWith(".rs"))
    .sort();

  for (const f of fixtures) {
    it(`${f} parses to its golden tree`, () => {
      const file = path.join(FIXTURES, f);
      const r = run(["-dump", "-check", file]);
      expect(r.status, r.out).toBe(0);
      const golden = file.replace(/\.rs$/, ".dump");
      if (process.env.UPDATE_GOLDEN) {
        fs.writeFileSync(golden, r.out);
      }
      expect(r.out).toBe(fs.readFileSync(golden, "utf8"));
    });
  }
});

describe("Rust parser: repository sources", () => {
  it("parses every tracked .rs file without dropping code", () => {
    const files = execSync("git ls-files '*.rs'", { cwd: ROOT, encoding: "utf8" })
      .split("\n")
      .filter((f) => f && !INVALID_RUST.has(f));
    expect(files.length).toBeGreaterThan(0);
    const r = run(["-check", ...files]);
    expect(r.out.split("\n").filter((l) => l.startsWith("FAIL")), r.out).toEqual([]);
    expect(r.status).toBe(0);
  });

  it("reports the invalid files as errors", () => {
    for (const f of INVALID_RUST) {
      const r = run([f]);
      expect(r.status).toBe(1);
      expect(r.out).toContain("expected ';'");
    }
  });
});

describe("Rust parser: errors", () => {
  const cases: Array<[string, string]> = [
    ["fn f( {}", "expected"],
    ["fn f() { let x = ; }", "expected an expression"],
    ["struct S { a: }", "expected a type"],
    ["fn f() { a b }", "expected ';'"],
    ["fn f() { match x { A => 1 B => 2 } }", "expected ',' after a match arm"],
    ["fn f() { let s = \"open; }", "unterminated string literal"],
    ["/* never closed", "unterminated block comment"],
    ["impl X {", "expected '}'"],
  ];
  for (const [src, message] of cases) {
    it(`rejects ${JSON.stringify(src)}`, () => {
      const file = path.join(OUT, `err_${cases.findIndex((c) => c[0] === src)}.rs`);
      fs.writeFileSync(file, src);
      const r = run([file]);
      expect(r.status).toBe(1);
      expect(r.out).toContain(message);
    });
  }
});
