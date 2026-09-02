import { describe, it, expect, afterAll } from "vitest";
import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";
import {
  compileAndRun,
  compileAndRunGo,
  compileAndRunPython,
  isGoAvailable,
  isPythonAvailable,
} from "./helpers/compiler";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const FIXTURE = path.join(__dirname, "fixtures", "create_dir_nested.rgr");

// The fixture's path is RELATIVE, and each target's helper runs the compiled
// program from its own directory -- ES6 from the repository root, Go from
// tests/.output-go, Python from tests/.output-python. So the directory the
// fixture makes lands in a different place per target, and every one of them
// has to be removed before a run: a leftover tree from the previous, passing
// run is exactly what makes a broken create_dir look fixed.
const MADE_DIRS = [
  path.join(ROOT_DIR, "tests", ".output-createdir"),
  path.join(ROOT_DIR, "tests", ".output-go", "tests", ".output-createdir"),
  path.join(ROOT_DIR, "tests", ".output-python", "tests", ".output-createdir"),
  path.join(ROOT_DIR, "tests", ".output", "tests", ".output-createdir"),
];

/**
 * `create_dir` is one operator with one meaning: make this path, parents and
 * all, and say nothing if it is already there. Seven of the eleven targets did
 * that; four did not, and every one of the four failed only on the SECOND run,
 * which is the shape of every build script.
 *
 *   es6    mkdirSync with no `recursive` -- an EEXIST stack trace
 *   php    mkdir with no recursive flag -- a warning, and no parents
 *   go     os.Mkdir rather than os.MkdirAll -- one level only
 *   java   File.mkdir rather than File.mkdirs -- one level only
 *
 * Found by running the iOS build driver twice on a Mac.
 */
function cleanup() {
  for (const dir of MADE_DIRS) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

describe("create_dir makes parents and does not mind an existing directory", () => {
  afterAll(cleanup);

  it("ES6", () => {
    cleanup();
    const { compile, run } = compileAndRun(FIXTURE);
    expect(compile.success).toBe(true);
    expect(run?.success).toBe(true);
    expect(run?.output).toContain("nested=yes");
    expect(run?.output).toContain("readback=hello");
  });

  it.skipIf(!isPythonAvailable())("Python", () => {
    cleanup();
    const { compile, run } = compileAndRunPython(FIXTURE);
    expect(compile.success).toBe(true);
    expect(run?.output).toContain("nested=yes");
    expect(run?.output).toContain("readback=hello");
  });

  it.skipIf(!isGoAvailable())("Go", () => {
    cleanup();
    const { compile, run } = compileAndRunGo(FIXTURE);
    expect(compile.success).toBe(true);
    expect(run?.output).toContain("nested=yes");
    expect(run?.output).toContain("readback=hello");
  });
});
