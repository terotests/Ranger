/**
 * Golden test: gallery/ts_parser on the Dart target.
 *
 * The TypeScript/ES5-compatible parser is a large (~10k LOC) recursive-descent
 * engine. Matching the JS `-d` demo output is the milestone for Dart codegen.
 */
import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import {
  compileRangerToDart,
  isDartAvailable,
  runCompiledDart,
} from "./helpers/compiler";

const dartAvailable = isDartAvailable();
const ROOT = path.resolve(__dirname, "..");
const TSPARSER_MAIN = "gallery/ts_parser/ts_parser_main.rgr";
const TSPARSER_OUT_DIR = path.join(ROOT, "gallery", "ts_parser", "bin");
const TSPARSER_DART = path.join(TSPARSER_OUT_DIR, "ts_parser_main.dart");
const JS_BIN = path.join(TSPARSER_OUT_DIR, "ts_parser_main.js");

describe.skipIf(!dartAvailable)("Dart golden: ts_parser", () => {
  it(
    "compiles ts_parser_main.rgr to Dart",
    () => {
      const result = compileRangerToDart(
        TSPARSER_MAIN,
        TSPARSER_OUT_DIR,
        ["-nodecli"],
        {
          // Match other ts_parser target scripts: Lang.rgr only, no stdops.
          rangerLib: "./compiler/Lang.rgr",
          timeoutMs: 120000,
        }
      );

      expect(
        result.success,
        `Compile failed: ${result.error || result.output}`
      ).toBe(true);
      expect(fs.existsSync(TSPARSER_DART)).toBe(true);
    },
    120000
  );

  it(
    "runs -d demo with AST identical to the JS reference",
    () => {
      expect(fs.existsSync(TSPARSER_DART)).toBe(true);
      expect(fs.existsSync(JS_BIN)).toBe(true);

      const dartRun = runCompiledDart(TSPARSER_DART, ["-d"], {
        cwd: ROOT,
        timeoutMs: 60000,
      });
      expect(dartRun.success, `Dart run failed: ${dartRun.error}`).toBe(true);

      const jsOut = execSync(`node "${JS_BIN}" -d`, {
        cwd: ROOT,
        encoding: "utf-8",
        timeout: 60000,
      }).trim();

      // Stable markers first (readable failure if something drifts).
      for (const marker of [
        "=== TypeScript Parser Demo ===",
        "--- AST ---",
        "Program with 7 statements:",
        "TSInterfaceDeclaration: Person",
        "TSTypeAliasDeclaration: ID",
        "TSTypeAliasDeclaration: Result",
        "VariableDeclaration (let)",
        "VariableDeclaration (const)",
        "FunctionDeclaration: greet(name, age?)",
        "TSTypeReference: Array",
      ]) {
        expect(dartRun.output).toContain(marker);
      }

      expect(dartRun.output).toBe(jsOut);
    },
    90000
  );

  it(
    "parses sample.ts and lists interfaces via -i",
    () => {
      const sample = "gallery/ts_parser/test/sample.ts";
      expect(fs.existsSync(path.join(ROOT, sample))).toBe(true);

      const dartRun = runCompiledDart(
        TSPARSER_DART,
        ["-i", sample, "--show-interfaces"],
        { cwd: ROOT, timeoutMs: 60000 }
      );

      expect(dartRun.success, `Dart run failed: ${dartRun.error}`).toBe(true);
      expect(dartRun.output).toContain("=== Interfaces in");
      expect(dartRun.output).toContain("User");
      expect(dartRun.output).toContain("Total: 1 interface(s)");
    },
    60000
  );
});
