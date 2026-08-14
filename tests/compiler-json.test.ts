import { describe, it, expect } from "vitest";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import {
  compileAndRun,
  compileAndRunDart,
  compileAndRunCSharp,
  compileAndRunGo,
  compileAndRunKotlin,
  compileAndRunPython,
  compileAndRunRust,
  compileRanger,
  getGeneratedRustCode,
  isCSharpAvailable,
  isDartAvailable,
  isGoAvailable,
  isKotlinAvailable,
  isPythonAvailable,
  isRustAvailable,
} from "./helpers/compiler";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

const FIXTURE = "tests/fixtures/json_ops.rgr";

function hasGpp(): boolean {
  try {
    execSync("g++ --version", { stdio: ["pipe", "pipe", "pipe"] });
    return true;
  } catch {
    return false;
  }
}

// The JSON operators (JSON.rgr) are per-target templates, so an operator with
// no template for one target fails on that target only. Python and Rust had no
// templates at all: every program that touched a JSONDataObject stopped with
// "Could not match argument types for json_object". These tests read the values
// back on each target so a missing template can not pass unnoticed.
const EXPECTED = [
  "name=ranger",
  "count=3",
  "ratio=0.5",
  "ok=yes",
  "items=3",
  "first=first",
  "kind=child",
  "keys=5",
  "missing=none",
  "json-ops-ok",
];

describe("JSON operators", () => {
  it("round trips an object through text on JavaScript", () => {
    const { compile, run } = compileAndRun(FIXTURE);

    expect(
      compile.success,
      `Compile failed: ${compile.error || compile.output}`
    ).toBe(true);
    expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
    for (const line of EXPECTED) {
      expect(run?.output).toContain(line);
    }
  });

  it.skipIf(!isPythonAvailable())(
    "round trips an object through text on Python",
    () => {
      const { compile, run } = compileAndRunPython(FIXTURE);

      expect(
        compile.success,
        `Compile failed: ${compile.error || compile.output}`
      ).toBe(true);
      expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
      for (const line of EXPECTED) {
        expect(run?.output).toContain(line);
      }
    }
  );

  // Dart already has the three shapes in the language -- Map, List and dynamic
  // -- and dart:convert reads and writes the text, so the only polyfills are
  // the getters, which check the type before they hand a value back.
  it.skipIf(!isDartAvailable())(
    "round trips an object through text on Dart",
    () => {
      const { compile, run } = compileAndRunDart(FIXTURE);

      expect(
        compile.success,
        `Compile failed: ${compile.error || compile.output}`
      ).toBe(true);
      expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
      for (const line of EXPECTED) {
        expect(run?.output).toContain(line);
      }
    }
  );

  // C++ had no template for any JSON operator either, and it is the target the
  // compiler itself needs: every @serialize class writes a toDictionary that
  // calls json_object / set / keys. The object and the array are handles
  // (shared_ptr), so pushing an object into an array and then filling it
  // behaves the way it does on JavaScript, and the value is a std::variant, so
  // `case v x:JSONDataObject` lowers to the same std::holds_alternative every
  // other closed family uses.
  it.skipIf(!hasGpp())("round trips an object through text on C++", () => {
    const outDir = path.join(ROOT, "tests", ".output-cpp-json");
    fs.mkdirSync(outDir, { recursive: true });

    const compile = compileRanger(FIXTURE, "cpp", outDir);
    expect(
      compile.success,
      `C++ codegen failed: ${compile.error || compile.output}`
    ).toBe(true);

    const cpp = path.join(outDir, "json_ops.cpp");
    const bin = path.join(outDir, "json_ops");
    execSync(`g++ -std=c++17 "${cpp}" -o "${bin}"`, {
      cwd: outDir,
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 120000,
    });

    const output = execSync(`"${bin}"`, {
      cwd: ROOT,
      encoding: "utf-8",
      timeout: 30000,
    });

    for (const line of EXPECTED) {
      expect(output).toContain(line);
    }
  }, 300000);

  // C# holds the three shapes as Dictionary / List / object, the same mapping
  // Go and Python use. The reader and the writer are hand written rather than
  // System.Text.Json, so the generated code builds on Mono and on .NET alike
  // with no package reference and the numbers keep the invariant culture.
  it.skipIf(!isCSharpAvailable())(
    "round trips an object through text on C#",
    () => {
      const { compile, run } = compileAndRunCSharp(FIXTURE);

      expect(
        compile.success,
        `Compile failed: ${compile.error || compile.output}`
      ).toBe(true);
      expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
      for (const line of EXPECTED) {
        expect(run?.output).toContain(line);
      }
    },
    120000
  );

  // Go holds the shapes as map[string]interface{} / []interface{} /
  // interface{}, and encoding/json reads and writes the text. A union over
  // primitives is interface{} here, so `case v s:string` narrows with a type
  // assertion rather than the tagged-struct compare the sealable unions use.
  it.skipIf(!isGoAvailable())(
    "round trips an object through text on Go",
    () => {
      const { compile, run } = compileAndRunGo(FIXTURE);

      expect(
        compile.success,
        `Compile failed: ${compile.error || compile.output}`
      ).toBe(true);
      expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
      for (const line of EXPECTED) {
        expect(run?.output).toContain(line);
      }
    },
    300000
  );

  // Kotlin has no JSON in the standard library and the output has to build
  // with a plain kotlinc line, so JSON.rgr declares the JSONObject / JSONArray
  // pair as a polyfill. org.json is NOT imported on top of it -- nothing puts
  // that package on the classpath.
  it.skipIf(!isKotlinAvailable())(
    "round trips an object through text on Kotlin",
    () => {
      const { compile, run } = compileAndRunKotlin(FIXTURE);

      expect(
        compile.success,
        `Compile failed: ${compile.error || compile.output}`
      ).toBe(true);
      expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
      for (const line of EXPECTED) {
        expect(run?.output).toContain(line);
      }
    },
    600000
  );

  it.skipIf(!isRustAvailable())(
    "round trips an object through text on Rust",
    () => {
      const { compile, run } = compileAndRunRust(FIXTURE);

      expect(
        compile.success,
        `Compile failed: ${compile.error || compile.output}`
      ).toBe(true);
      expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
      for (const line of EXPECTED) {
        expect(run?.output).toContain(line);
      }
    }
  );

  // The Rust file header holds inner attributes (#![allow(...)]), which have to
  // precede every item. An (imp "...") from an operator template writes its
  // `use` line into the import slice, which sits ahead of the class content, so
  // a header written with the content ended up second and rustc rejected the
  // file with "an inner attribute is not permitted in this context".
  it("writes the Rust inner attributes ahead of every use line", () => {
    const result = getGeneratedRustCode("tests/fixtures/hash_map.rgr");
    expect(result.success, `Compile failed: ${result.error}`).toBe(true);

    const firstUse = result.code.indexOf("use ");
    const lastAttribute = result.code.lastIndexOf("#![");

    expect(firstUse).toBeGreaterThan(-1);
    expect(lastAttribute).toBeGreaterThan(-1);
    expect(lastAttribute).toBeLessThan(firstUse);
  });
});
