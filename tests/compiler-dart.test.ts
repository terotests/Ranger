import { describe, it, expect, beforeAll } from "vitest";
import * as fs from "fs";
import * as path from "path";
import {
  compileAndRunDart,
  compileRangerToDart,
  isDartAvailable,
} from "./helpers/compiler";

const FIXTURES_DIR = "tests/fixtures";
const dartAvailable = isDartAvailable();

describe.skipIf(!dartAvailable)("Ranger Compiler - Dart Target", () => {
  beforeAll(() => {
    if (!dartAvailable) {
      console.log("Dart SDK is not available, skipping Dart tests");
    }
  });

  describe("Basic programs", () => {
    it("should compile and run array push", () => {
      const { compile, run } = compileAndRunDart(
        `${FIXTURES_DIR}/array_push.rgr`
      );

      expect(
        compile.success,
        `Compile failed: ${compile.error || compile.output}`
      ).toBe(true);
      expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
      expect(run?.output).toContain("Done");
    });

    it("should compile and run local array with iteration", () => {
      const { compile, run } = compileAndRunDart(
        `${FIXTURES_DIR}/local_array.rgr`
      );

      expect(
        compile.success,
        `Compile failed: ${compile.error || compile.output}`
      ).toBe(true);
      expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
      expect(run?.output).toContain("hello");
      expect(run?.output).toContain("world");
    });

    it("should compile and run class-level array property", () => {
      const { compile, run } = compileAndRunDart(
        `${FIXTURES_DIR}/class_array.rgr`
      );

      expect(
        compile.success,
        `Compile failed: ${compile.error || compile.output}`
      ).toBe(true);
      expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
      expect(run?.output).toContain("Done");
    });

    it("should compile and run static factory method", () => {
      const { compile, run } = compileAndRunDart(
        `${FIXTURES_DIR}/static_factory.rgr`
      );

      expect(
        compile.success,
        `Compile failed: ${compile.error || compile.output}`
      ).toBe(true);
      expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
      expect(run?.output).toContain("test");
      expect(run?.output).toContain("Done");
    });
  });

  describe("Flutter-ready package scaffolding", () => {
    it("should emit pubspec.yaml with -pubspec", () => {
      const outDir = path.join(
        process.cwd(),
        "tests",
        ".output-dart-pubspec"
      );
      fs.rmSync(outDir, { recursive: true, force: true });
      fs.mkdirSync(outDir, { recursive: true });

      const result = compileRangerToDart(`${FIXTURES_DIR}/array_push.rgr`, outDir, [
        "-pubspec",
        "-name=ranger_demo",
        "-version=0.1.0",
        "-description=Ranger generated Dart package",
      ]);

      expect(
        result.success,
        `Compile failed: ${result.error || result.output}`
      ).toBe(true);

      const pubspecPath = path.join(outDir, "pubspec.yaml");
      expect(fs.existsSync(pubspecPath)).toBe(true);
      const pubspec = fs.readFileSync(pubspecPath, "utf8");
      expect(pubspec).toContain("name: ranger_demo");
      expect(pubspec).toContain("version: 0.1.0");
      expect(pubspec).toContain("sdk: '>=3.0.0 <4.0.0'");
      expect(pubspec).not.toContain("flutter:");
    });

    it("should emit Flutter dependencies with -pubspec -flutter", () => {
      const outDir = path.join(
        process.cwd(),
        "tests",
        ".output-dart-flutter"
      );
      fs.rmSync(outDir, { recursive: true, force: true });
      fs.mkdirSync(outDir, { recursive: true });

      const result = compileRangerToDart(`${FIXTURES_DIR}/array_push.rgr`, outDir, [
        "-pubspec",
        "-flutter",
        "-name=ranger_flutter_logic",
        "-version=0.1.0",
        "-description=Shared Flutter logic from Ranger",
      ]);

      expect(
        result.success,
        `Compile failed: ${result.error || result.output}`
      ).toBe(true);

      const pubspec = fs.readFileSync(path.join(outDir, "pubspec.yaml"), "utf8");
      expect(pubspec).toContain("name: ranger_flutter_logic");
      expect(pubspec).toContain("flutter:");
      expect(pubspec).toContain("sdk: flutter");
    });
  });
});
