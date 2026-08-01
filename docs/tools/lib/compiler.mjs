/**
 * Loads the Ranger compiler as a Node module.
 *
 * The module is built from the compiler sources of the current tree, so the
 * reference always describes the compiler that is in the repository. The build
 * is skipped when the cached module is newer than every compiler source.
 */
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { CACHE, ROOT, ensureDir, walk } from "./paths.mjs";

const require = createRequire(import.meta.url);
const MODULE_FILE = path.join(CACHE, "rangerapi.js");
const CLI = path.join(ROOT, "bin", "output.js");

function newestSourceTime() {
  const files = [
    ...walk(path.join(ROOT, "compiler"), ".rgr"),
    ...walk(path.join(ROOT, "lib"), ".rgr"),
    CLI,
  ];
  let newest = 0;
  for (const file of files) {
    const stat = fs.statSync(file, { throwIfNoEntry: false });
    if (stat && stat.mtimeMs > newest) {
      newest = stat.mtimeMs;
    }
  }
  return newest;
}

export function buildCompilerModule({ force = false, quiet = false } = {}) {
  if (!fs.existsSync(CLI)) {
    throw new Error(
      `${CLI} is missing. Run "npm run compile" in the repository root first.`,
    );
  }
  const cached = fs.statSync(MODULE_FILE, { throwIfNoEntry: false });
  if (!force && cached && cached.mtimeMs >= newestSourceTime()) {
    return MODULE_FILE;
  }
  ensureDir(CACHE);
  if (!quiet) {
    process.stderr.write("docs: building the compiler module…\n");
  }
  execFileSync(
    process.execPath,
    [
      CLI,
      "-nodemodule",
      "-es6",
      "./compiler/ng_Compiler.rgr",
      "-d=./docs/.cache",
      "-o=rangerapi.js",
    ],
    { cwd: ROOT, stdio: quiet ? "ignore" : ["ignore", "ignore", "inherit"] },
  );
  if (!fs.existsSync(MODULE_FILE)) {
    throw new Error(`The compiler module was not written to ${MODULE_FILE}`);
  }
  return MODULE_FILE;
}

let cachedApi = null;

/** The compiler module: SourceCode, RangerLispParser, VirtualCompiler, InputEnv, CmdParams… */
export function loadCompilerApi(options = {}) {
  if (!cachedApi) {
    cachedApi = require(buildCompilerModule(options));
  }
  return cachedApi;
}

/** Identity of the compiler build, used as part of the example cache key. */
export function compilerBuildId() {
  const file = buildCompilerModule({ quiet: true });
  const stat = fs.statSync(file);
  return `${stat.size}:${Math.round(stat.mtimeMs)}`;
}
