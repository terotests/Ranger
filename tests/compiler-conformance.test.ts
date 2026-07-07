import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import {
  compileAndRun,
  compileAndRunGo,
  compileAndRunKotlin,
  isGoAvailable,
  isKotlinAvailable,
} from "./helpers/compiler";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFORMANCE_DIR = path.join(__dirname, "conformance");

const GO_KNOWN_GAPS = new Set([
  // Issue #58: Go slice pass-by-value — param array mutation not yet boxed
  "array_param_mutate",
]);

function listConformanceCases(): string[] {
  return fs
    .readdirSync(CONFORMANCE_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
}

function readExpected(caseName: string): string {
  const expectedPath = path.join(
    CONFORMANCE_DIR,
    caseName,
    "expected_output.txt"
  );
  return fs.readFileSync(expectedPath, "utf8").replace(/\r\n/g, "\n").trimEnd();
}

function normalizeOutput(output: string): string {
  return output
    .replace(/\r\n/g, "\n")
    .replace(/\d+\.\d+/g, (num) => {
      const v = Number(num);
      if (Number.isNaN(v)) {
        return num;
      }
      return v.toFixed(6).replace(/\.?0+$/, (m) => (m === "." ? "" : m));
    })
    .trimEnd();
}

function assertConformance(
  label: string,
  caseName: string,
  result: { compile: { success: boolean; error?: string; output: string }; run?: { success: boolean; error?: string; output: string } }
) {
  const program = `tests/conformance/${caseName}/program.rgr`;
  expect(
    result.compile.success,
    `${label} compile failed for ${program}: ${result.compile.error || result.compile.output}`
  ).toBe(true);
  expect(
    result.run?.success,
    `${label} run failed for ${program}: ${result.run?.error}`
  ).toBe(true);
  const expected = readExpected(caseName);
  expect(normalizeOutput(result.run?.output ?? "")).toBe(
    normalizeOutput(expected)
  );
}

describe("Cross-target conformance suite (Track 1)", () => {
  const cases = listConformanceCases();

  it("should have at least one conformance fixture", () => {
    expect(cases.length).toBeGreaterThan(0);
  });

  describe("ES6 reference target", () => {
    for (const caseName of cases) {
      it(`should match expected output for ${caseName}`, () => {
        const program = `tests/conformance/${caseName}/program.rgr`;
        assertConformance("ES6", caseName, compileAndRun(program));
      });
    }
  });

  describe.skipIf(!isGoAvailable())("Go target", () => {
    for (const caseName of cases) {
      const testFn = GO_KNOWN_GAPS.has(caseName) ? it.skip : it;
      testFn(`should match expected output for ${caseName}`, () => {
        const program = `tests/conformance/${caseName}/program.rgr`;
        assertConformance("Go", caseName, compileAndRunGo(program));
      });
    }
  });

  describe.skipIf(!isKotlinAvailable())("Kotlin target", () => {
    for (const caseName of cases) {
      it(`should match expected output for ${caseName}`, () => {
        const program = `tests/conformance/${caseName}/program.rgr`;
        assertConformance("Kotlin", caseName, compileAndRunKotlin(program));
      });
    }
  });
});
