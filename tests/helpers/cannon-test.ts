import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { compileRanger } from "./compiler";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");

const CANNON_RUNNER = "gallery/game_engine/physics/src/cannon_test_runner.rgr";
const OUT_DIR = path.join(ROOT, "tests", ".output");
const OUT_JS = path.join(OUT_DIR, "cannon_test_runner.js");

let compileError: string | undefined;

export function ensureCannonCompiled(): void {
  if (compileError) {
    throw new Error(compileError);
  }
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }
  if (fs.existsSync(OUT_JS)) {
    fs.unlinkSync(OUT_JS);
  }
  const result = compileRanger(CANNON_RUNNER, "es6", OUT_DIR);
  if (!result.success) {
    compileError = result.error || result.output;
    throw new Error(`Cannon compile failed: ${compileError}`);
  }
  if (!fs.existsSync(OUT_JS)) {
    compileError = `Missing compiled output: ${OUT_JS}`;
    throw new Error(compileError);
  }
}

/** Run one Cannon parity test by id (e.g. "Vec3.cross", "Body.computeAABB.box"). */
export function runCannonTest(testId: string): string {
  ensureCannonCompiled();
  try {
    return execSync(`node "${OUT_JS}" "${testId}"`, {
      cwd: ROOT,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string; message?: string };
    return (e.stdout || "") + (e.stderr || e.message || "");
  }
}

export function expectCannonPass(testId: string, output: string): void {
  if (!output.includes(`RESULT ${testId} PASS`)) {
    throw new Error(
      `Expected RESULT ${testId} PASS\nOutput:\n${output}`
    );
  }
  if (output.includes("RESULT ") && output.includes(" FAIL")) {
    throw new Error(`Cannon test failed:\n${output}`);
  }
}

/** Run full suite (no filter). */
export function runCannonAll(): string {
  ensureCannonCompiled();
  return execSync(`node "${OUT_JS}"`, {
    cwd: ROOT,
    encoding: "utf-8",
    stdio: ["pipe", "pipe", "pipe"],
  }).trim();
}
