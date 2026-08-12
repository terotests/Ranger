/**
 * What the interpreter is allowed to depend on.
 *
 * The engine used to reach out of its own tree for a renderer (`evg/`) and an
 * image decoder (`imaging/`), and it read the filesystem directly in the module
 * path. None of that is ECMAScript; all of it was one embedder's environment
 * baked into the evaluator, and it is what stopped the engine being usable —
 * or testable — as a standalone module.
 *
 * A test rather than a convention, because the coupling grew back twice before
 * anyone noticed: nothing in v2 consumed the JSX path, so an import nobody
 * exercised cost nothing until the day it did.
 */
import { describe, expect, it, beforeAll } from "vitest";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(HERE, "..");
const SRC_DIR = path.join(
  ROOT_DIR,
  "gallery",
  "game_engine",
  "v2",
  "interp",
  "migrate",
  "src"
);

/** The interpreter proper — the files a standalone engine package would ship. */
const ENGINE_FILES = [
  "ComponentEngine.rgr",
  "EvalValue.rgr",
  "EvHandle.rgr",
  "EvValueBridge.rgr",
];

/** `Import "..."` targets of one file, in source order. */
function importsOf(file: string): string[] {
  const src = fs.readFileSync(path.join(SRC_DIR, file), "utf8");
  const out: string[] = [];
  for (const line of src.split("\n")) {
    const m = /^\s*Import\s+"([^"]+)"/.exec(line);
    if (m) out.push(m[1]);
  }
  return out;
}

/**
 * Directories outside the interpreter that it must not depend on, and why.
 * Each is a DOMAIN: a decision about what a document means, which belongs to
 * whoever is rendering or hosting it.
 */
const FORBIDDEN: Array<[fragment: string, why: string]> = [
  ["evg/", "a renderer's layout objects — JSX produces EvElement, and a host converts"],
  ["imaging/", "an image decoder — a host that wants image metadata supplies it through EvalNativeBridge"],
  ["pdf_writer/", "a document backend"],
  ["scripting/", "the game runtime"],
  ["render/", "a renderer"],
  ["audio/", "an audio backend"],
];

/**
 * The one dependency outside the interpreter that IS allowed: the shared
 * TypeScript/JSX parser. It is a language front end rather than a domain, and
 * whether to vendor it into v2 or accept it as a shared gallery dependency is
 * an open decision (v2/TODO.md § "Import isolation", where it is also
 * allowlisted for the boundary gate). Listed explicitly so the answer is a
 * choice rather than a drift.
 */
const ALLOWED_OUTSIDE = ["ts_parser/"];

describe("engine dependency surface", () => {
  for (const file of ENGINE_FILES) {
    it(`${file} imports no host or renderer domain`, () => {
      const imports = importsOf(file);
      for (const imp of imports) {
        for (const [fragment, why] of FORBIDDEN) {
          expect(
            imp.includes(fragment),
            `${file} imports "${imp}" — ${fragment} is ${why}`
          ).toBe(false);
        }
      }
    });
  }

  it("every dependency outside the interpreter is one that was chosen", () => {
    const escapes: string[] = [];
    for (const file of ENGINE_FILES) {
      for (const imp of importsOf(file)) {
        if (!imp.includes("../")) continue;
        // Inside interp/migrate/src, or a sibling under interp/, is fine.
        const resolved = path.resolve(SRC_DIR, imp);
        if (resolved.startsWith(path.join(SRC_DIR, ""))) continue;
        if (ALLOWED_OUTSIDE.some((a) => imp.includes(a))) continue;
        escapes.push(`${file} -> ${imp}`);
      }
    }
    expect(escapes, "unlisted dependency outside the interpreter").toEqual([]);
  });

  it("the module path reads no files of its own", () => {
    const src = fs.readFileSync(path.join(SRC_DIR, "ComponentEngine.rgr"), "utf8");
    // Filesystem access is confined to EvalModuleHost. Everywhere else asks
    // the host, so a build with no filesystem configures exactly one class
    // (addModule + setFilesystemEnabled(false)).
    const hostStart = src.indexOf("class EvalModuleHost");
    expect(hostStart, "EvalModuleHost should exist as the module host").toBeGreaterThan(-1);
    const hostEnd = src.indexOf("\n}", hostStart);
    const outside = src.slice(0, hostStart) + src.slice(hostEnd);
    for (const call of ["file_exists", "buffer_read_file", "file_mtime"]) {
      // The prose above FileModuleHost names both calls; only code counts.
      const codeHits = outside
        .split("\n")
        .filter((l) => l.includes(call) && !l.trimStart().startsWith(";"));
      expect(
        codeHits,
        `${call} outside EvalModuleHost — route it through moduleHost instead`
      ).toEqual([]);
    }
  });

  it("the engine still declares the seams a host plugs into", () => {
    const src = fs.readFileSync(path.join(SRC_DIR, "ComponentEngine.rgr"), "utf8");
    for (const seam of [
      "class EvalNativeBridge", // host-native functions
      "class EvalModuleHost", // where module source lives
      "fn setNativeBridge",
      "fn setModuleHost",
      "fn registerGlobal",
      "fn registerVirtualModule",
      "fn addTextTag", // which tags hold text rather than children
    ]) {
      expect(src.includes(seam), `missing host seam: ${seam}`).toBe(true);
    }
  });
});

/**
 * The seams, exercised rather than merely declared. A grep proves the import is
 * gone; only running the engine proves a host can actually supply what the
 * import used to.
 */
describe("engine runs with no environment", () => {
  let ComponentEngine: any;
  let EvalModuleHost: any;
  let EvHandle: any;

  beforeAll(() => {
    const modulePath = path.join(
      ROOT_DIR, "gallery", "game_engine", "v2", "interp", "bin", "engine_module.cjs"
    );
    if (!fs.existsSync(modulePath)) {
      execFileSync("bash", [path.join(ROOT_DIR, "scripts", "build-engine-module.sh")], {
        cwd: ROOT_DIR, stdio: "inherit",
      });
    }
    const mod = require(modulePath);
    ComponentEngine = mod.ComponentEngine;
    EvalModuleHost = mod.EvalModuleHost;
    EvHandle = mod.EvHandle;
  });

  it("imports a module the host supplied, with the filesystem switched off", () => {
    const host = new EvalModuleHost();
    host.setFilesystemEnabled(false);
    host.addModule("./", "lib.tsx", "export const answer = 42;\nexport function twice(n) { return n * 2; }\n");

    const engine = new ComponentEngine();
    engine.quiet = true;
    engine.setModuleHost(host);
    engine.setBasePath("./");

    const original = console.log;
    console.log = () => {};
    try {
      engine.loadScript(`import { answer, twice } from "./lib";\nfunction go() { return answer + twice(4); }`);
      const r = engine.callFunction("go", EvHandle.null());
      expect(r.isNumber() && r.numberOf()).toBe(50);
    } finally {
      console.log = original;
    }
  });

  it("a host that supplies nothing finds nothing, rather than reaching for a disk", () => {
    const host = new EvalModuleHost();
    host.setFilesystemEnabled(false);
    expect(host.exists("./", "anything.tsx")).toBe(false);
    expect(host.readSource("./", "anything.tsx")).toBe("");
  });

  it("the filesystem default still works, so an embedder that says nothing is unaffected", () => {
    const host = new EvalModuleHost();
    expect(host.exists(ROOT_DIR + "/", "package.json")).toBe(true);
    expect(host.readSource(ROOT_DIR + "/", "package.json").length).toBeGreaterThan(0);
  });

  it("a replaced module is re-read rather than served from the parse cache", () => {
    const host = new EvalModuleHost();
    host.setFilesystemEnabled(false);
    host.addModule("./", "v.tsx", "export const v = 1;");
    const first = host.stamp("./", "v.tsx");
    host.addModule("./", "v.tsx", "export const v = 2;");
    expect(host.readSource("./", "v.tsx")).toBe("export const v = 2;");
    expect(host.stamp("./", "v.tsx")).not.toBe(first);
  });
});
