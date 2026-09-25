/**
 * `if (!null? x) { ... }` narrows x for the then block: under -strict the
 * block may read through x without an `unwrap`. Only a condition that must be
 * true for the block to run counts -- a bare `!null?` or an `&&` of them. An
 * `||`, another variable, and the code after the `if` stay optional.
 */
import { describe, it, expect } from "vitest";
import { spawnSync } from "node:child_process";
import * as path from "node:path";
import * as os from "node:os";
import * as fs from "node:fs";

const ROOT = path.resolve(__dirname, "..");
const FIXTURES = path.join(__dirname, "fixtures");

function compileStrict(fixture: string, lang: string, keep?: (dir: string) => void) {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "strict-narrowing-"));
  try {
    const r = spawnSync(
      process.execPath,
      [
        "dist/rgrc.js",
        `-l=${lang}`,
        "-strict",
        path.join(FIXTURES, fixture),
        `-d=${out}`,
        "-o=out",
      ],
      { cwd: ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
    );
    if (keep) keep(out);
    return r.stdout + r.stderr;
  } finally {
    fs.rmSync(out, { recursive: true, force: true });
  }
}

const UNWRAP_ERROR = "Optional automatically unwrapped outside try block";

describe("-strict: if (!null? x) narrows x", () => {
  for (const lang of ["es6", "cpp", "go", "python", "java7", "rust", "kotlin", "swift6"]) {
    it(`accepts reads through a narrowed optional (${lang})`, () => {
      const output = compileStrict("strict_narrowing.rgr", lang);
      expect(output).not.toContain(UNWRAP_ERROR);
      expect(output).not.toContain("[FAIL]");
    });
  }

  it("still rejects ||, another variable and code after the if", () => {
    const output = compileStrict("strict_narrowing_rejects.rgr", "es6");
    const count = output.split(UNWRAP_ERROR).length - 1;
    expect(count).toBe(3);
  });
});

function readAll(dir: string): string {
  let text = "";
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    text += fs.statSync(full).isDirectory() ? readAll(full) : fs.readFileSync(full, "utf8");
  }
  return text;
}

describe("-strict: fields the program says are present", () => {
  for (const lang of ["es6", "cpp", "go", "python", "java7", "rust", "kotlin", "swift6"]) {
    it(`accepts constructor-assigned and @(late) fields (${lang})`, () => {
      const output = compileStrict("strict_fields.rgr", lang);
      expect(output).not.toContain(UNWRAP_ERROR);
      expect(output).not.toContain("[FAIL]");
    });
  }

  it("runs: constructor field, @(late) field, copies and narrowed defs", () => {
    let js = "";
    compileStrict("strict_fields.rgr", "es6", (dir) => {
      js = readAll(dir);
    });
    const file = path.join(os.tmpdir(), `strict-fields-${process.pid}.js`);
    fs.writeFileSync(file, js);
    try {
      const r = spawnSync(process.execPath, [file], { encoding: "utf8" });
      expect(r.stdout.trim().split("\n")).toEqual(["total=9", "CC", "none"]);
    } finally {
      fs.rmSync(file, { force: true });
    }
  });

  it("still rejects a partly assigned, an early-read and an unassigned field", () => {
    const output = compileStrict("strict_fields_rejects.rgr", "es6");
    const count = output.split(UNWRAP_ERROR).length - 1;
    expect(count).toBe(3);
  });

  // `def f:Person p.friend` inside `if p.friend` becomes `(unwrap p.friend)`:
  // one unwrap in the target's own spelling, the same as writing the unwrap
  // out, and never two.
  for (const [lang, once, twice] of [
    ["cpp", "p->_friend.value();", ".value().value()"],
    ["swift6", "p.friend!", "p.friend!!"],
    ["kotlin", "p.friend!!;", "!!!!"],
  ] as const) {
    it(`unwraps a narrowed def exactly once (${lang})`, () => {
      let src = "";
      compileStrict("strict_fields.rgr", lang, (dir) => {
        src = readAll(dir);
      });
      expect(src.split(once).length - 1).toBe(2);
      expect(src).not.toContain(twice);
    });
  }
});

describe("error positions", () => {
  // The parser counts UTF-8 bytes. Lines used to be counted in UTF-16 units,
  // so each multibyte character before an error moved it -- here the error
  // would have landed lines away from `p.name`.
  it("reports the right line after multibyte characters", () => {
    const src = [
      "; ——————————————————————————————————————————————————————————————",
      "; ——————————————————————————————————————————————————————————————",
      "; ——————————————————————————————————————————————————————————————",
      "class Person {",
      '  def name:string ""',
      "}",
      "class PosMain {",
      "  fn f:string (p@(optional):Person) {",
      "    return p.name",
      "  }",
      "  sfn main@(main):void () {",
      '    print "x"',
      "  }",
      "}",
    ].join("\n");
    const file = path.join(FIXTURES, `.strict_positions_${process.pid}.rgr`);
    fs.writeFileSync(file, src);
    try {
      const output = compileStrict(path.basename(file), "es6");
      expect(output).toMatch(/strict_positions_\d+\.rgr:9:11/);
    } finally {
      fs.rmSync(file, { force: true });
    }
  });
});

