/**
 * marked → ComponentEngine smoke (vendored marked@4.3.0 UMD).
 *
 * Default (CI-safe): UMD loads + `marked.parse` is callable.
 * Opt-in full parse / Node-parity probes (slow while output is corrupted):
 *   MARKED_SMOKE_PARSE=1 npx vitest run --config tests/vitest.config.ts marked-engine-smoke.test.ts
 *
 * CLI twin (always runs parse cases):
 *   node gallery/game_engine/v2/interp/bench/marked_smoke/marked-smoke.cjs
 */
import { describe, it, expect, beforeAll } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { execFileSync } from "child_process";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const ROOT_DIR = path.resolve(__dirname, "..");
const MODULE_PATH = path.join(
  ROOT_DIR,
  "gallery/game_engine/v2/interp/bin/engine_module.cjs",
);
const SMOKE_DIR = path.join(
  ROOT_DIR,
  "gallery/game_engine/v2/interp/bench/marked_smoke",
);
const VENDOR_UMD = path.join(SMOKE_DIR, "vendor/marked.umd.js");
const VENDOR_CJS = path.join(SMOKE_DIR, "vendor/marked.cjs");
const PREPARED_UMD = path.join(SMOKE_DIR, ".cache/marked.umd.prepared.js");
const RUN_PARSE = process.env.MARKED_SMOKE_PARSE === "1";

const CASES: Array<{ name: string; md: string }> = [
  { name: "heading", md: "# Hello" },
  { name: "paragraph", md: "Hello **world**" },
  { name: "link", md: "[Ranger](https://example.com)" },
  { name: "list", md: "- one\n- two" },
  { name: "blockquote", md: "> quoted" },
  { name: "mixed", md: "# Title\n\nA *short* paragraph with `code`.\n" },
];

function prepareMarkedUmdSource(src: string): string {
  return src
    .replace(/typeof\s+([A-Za-z_$][\w$]*)\s*<\s*"u"/g, 'typeof $1 !== "undefined"')
    .replace(/typeof\s+([A-Za-z_$][\w$]*)\s*>\s*"u"/g, 'typeof $1 === "undefined"')
    .replace(/typeof\s+([A-Za-z_$][\w$]*)\s*<\s*'u'/g, "typeof $1 !== 'undefined'")
    .replace(/typeof\s+([A-Za-z_$][\w$]*)\s*>\s*'u'/g, "typeof $1 === 'undefined'");
}

function prepareMarkedUmdFile(): string {
  fs.mkdirSync(path.dirname(PREPARED_UMD), { recursive: true });
  const prepared = prepareMarkedUmdSource(fs.readFileSync(VENDOR_UMD, "utf8"));
  fs.writeFileSync(PREPARED_UMD, prepared);
  return PREPARED_UMD;
}

function toHost(r: any): unknown {
  if (!r) return "<missing>";
  if (r.isNumber && r.isNumber()) return r.numberOf();
  if (r.isString && r.isString()) return r.stringOf();
  if (r.isBoolean && r.isBoolean()) return r.boolOf();
  if (r.isUndefined && r.isUndefined()) return undefined;
  if (r.isNull && r.isNull()) return null;
  return "<kind " + (r.kindName ? r.kindName() : "?") + ">";
}

type CaseResult = {
  name: string;
  md: string;
  nodeHtml: string;
  parseOk: boolean;
  html: unknown;
  error: string | null;
};

let ComponentEngine: any;
let EvalValue: any;
let nodeMarked: { parse: (md: string) => string };
let loadOk = false;
let apiOk = false;
let bootError: string | null = null;
let parseResults: CaseResult[] = [];

describe("marked engine smoke", () => {
  beforeAll(() => {
    expect(fs.existsSync(VENDOR_UMD), "vendor/marked.umd.js").toBe(true);
    expect(fs.existsSync(VENDOR_CJS), "vendor/marked.cjs").toBe(true);

    if (!fs.existsSync(MODULE_PATH)) {
      execFileSync("bash", [path.join(ROOT_DIR, "scripts", "build-engine-module.sh")], {
        cwd: ROOT_DIR,
        stdio: "inherit",
      });
    }
    const mod = require(MODULE_PATH);
    ComponentEngine = mod.ComponentEngine;
    EvalValue = mod.EvHandle;
    nodeMarked = require(VENDOR_CJS);
    const umd = fs.readFileSync(prepareMarkedUmdFile(), "utf8");

    const helpers = [
      "function __marked_api__() {",
      '  var g = (typeof globalThis !== "undefined") ? globalThis : this;',
      '  if (!g.marked) return "missing";',
      '  if (typeof g.marked.parse !== "function") return "no-parse";',
      '  return "ok";',
      "}",
    ];
    if (RUN_PARSE) {
      for (const c of CASES) {
        const fn = `__parse_${c.name.replace(/[^a-zA-Z0-9_]/g, "_")}__`;
        helpers.push(
          `function ${fn}() { return globalThis.marked.parse(${JSON.stringify(c.md)}); }`,
        );
      }
    }

    const eng = new ComponentEngine();
    eng.quiet = true;
    const origLog = console.log;
    console.log = () => {};
    try {
      eng.loadScript(umd + "\n" + helpers.join("\n"));
      loadOk = true;
    } catch (err: any) {
      bootError = String(err && err.message ? err.message : err);
      loadOk = false;
    } finally {
      console.log = origLog;
    }

    if (loadOk) {
      try {
        const api = toHost(eng.callFunction("__marked_api__", EvalValue.null()));
        apiOk = api === "ok";
        if (!apiOk) bootError = String(api);
      } catch (err: any) {
        apiOk = false;
        bootError = String(err && err.message ? err.message : err);
      }
    }

    if (RUN_PARSE && loadOk && apiOk) {
      parseResults = CASES.map((c) => {
        const nodeHtml = String(nodeMarked.parse(c.md));
        const fn = `__parse_${c.name.replace(/[^a-zA-Z0-9_]/g, "_")}__`;
        const row: CaseResult = {
          name: c.name,
          md: c.md,
          nodeHtml,
          parseOk: false,
          html: null,
          error: null,
        };
        try {
          const html = toHost(eng.callFunction(fn, EvalValue.null()));
          row.html = html;
          row.parseOk = typeof html === "string";
          row.error = row.parseOk ? null : `non-string ${typeof html}`;
        } catch (err: any) {
          row.error = String(err && err.message ? err.message : err);
        }
        return row;
      });
    }
  }, RUN_PARSE ? 300_000 : 60_000);

  it('prepare rewrite turns typeof x<"u" into !== undefined', () => {
    const sample = 'typeof exports<"u"&&typeof module<"u"';
    expect(prepareMarkedUmdSource(sample)).toBe(
      'typeof exports !== "undefined"&&typeof module !== "undefined"',
    );
  });

  it("UMD loads without throwing", () => {
    expect(loadOk, bootError ?? "load").toBe(true);
  });

  it("exposes marked.parse on globalThis", () => {
    expect(apiOk, bootError ?? "api").toBe(true);
  });

  describe.runIf(RUN_PARSE)("parse cases (MARKED_SMOKE_PARSE=1)", () => {
    for (const c of CASES) {
      it(`${c.name}: parse returns a string (hard gate)`, () => {
        const r = parseResults.find((x) => x.name === c.name)!;
        expect(r.parseOk, r.error ?? "parse").toBe(true);
        expect(typeof r.html).toBe("string");
        expect((r.html as string).length).toBeGreaterThan(0);
      });
    }

    for (const c of CASES) {
      it(`${c.name}: Node parity still known-wrong (or already fixed)`, () => {
        const r = parseResults.find((x) => x.name === c.name)!;
        expect(r.parseOk && typeof r.html === "string").toBe(true);
        const engHtml = r.html as string;
        if (engHtml === r.nodeHtml) {
          expect(engHtml).toBe(r.nodeHtml);
          return;
        }
        expect(engHtml).not.toBe(r.nodeHtml);
        expect(engHtml.length).toBeGreaterThan(0);
      });
    }
  });
});
