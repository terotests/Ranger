/**
 * rgrc-cached — compile a Ranger program only when its sources changed, and
 * fail when the compile fails.
 *
 * A drop-in for `node bin/output.js` in an npm script:
 *
 *     node bin/output.js          -es6 -nodemodule src/App.rgr -d=bin -o=App.cjs
 *     node scripts/rgrc-cached.mjs -es6 -nodemodule src/App.rgr -d=bin -o=App.cjs
 *
 * WHY THIS EXISTS, PART ONE: the loop. Compiling a Ranger program costs about
 * what its whole import closure costs, every time, because the compiler parses
 * and walks the entire program:
 *
 *     AddWorkoutChart.rgr    2 files    1 069 lines     0.5 s
 *     CompactRows.rgr       47 files   11 989 lines     1.8 s
 *     RtHost.rgr           157 files  108 102 lines    12.4 s
 *
 * Roughly twenty of the `rt:*` scripts in package.json begin with
 * `npm run rt:build &&`, so running four checks after one edit compiles the
 * same 108 000 unchanged lines four times. Three of those four compiles are a
 * cache that nobody kept.
 *
 * WHY THIS EXISTS, PART TWO: the silent failure. `rgrc` prints `[FAIL]` and
 * `Compilation FAILED` and then EXITS 0. Written as
 * `npm run rt:build && node web/trace-check.mjs`, the `&&` is satisfied by
 * that zero, the previous `.cjs` is still on disk, and the check runs against
 * it — so the edit looks applied and the check looks green when neither is
 * true. This is the same trap `scripts/rgr` exists for in the starter project,
 * and it is currently open in every `rt:*` script. The compiler's log is read
 * for the failure its exit status omits, and a missing output file is itself
 * an error.
 *
 * HOW THE CACHE KNOWS. Not by resolving imports itself. `Import` resolution
 * goes through `RANGER_LIB` search paths, `ranger.json` dependency maps,
 * `ranger.lock`, `vendor/` and the package cache; a second implementation of
 * those rules that drifted by one case would serve a stale build silently,
 * which is the exact failure the paragraph above is about. Instead the
 * compiler is asked what it read: `deps-probe.cjs` is preloaded into the
 * compiler process, records every `.rgr` and `ranger.json` it opened and every
 * path it looked for and did not find, and that list becomes the key. A
 * recorded file whose content changed invalidates; so does a file that has
 * appeared where the resolver once looked in vain, because that changes what
 * the next `Import` resolves to.
 *
 * The first run after this is added always compiles — there is no manifest yet.
 *
 * SPDX-License-Identifier: MIT
 */
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const PROBE = path.join(HERE, "deps-probe.cjs");
const COMPILER = path.join(ROOT, "bin/output.js");

const argv = process.argv.slice(2);
if (!argv.length) {
  process.stderr.write(`usage: node scripts/rgrc-cached.mjs <the arguments you would pass to bin/output.js>

  Same arguments, same output. The compile is skipped when nothing it reads
  has changed, and a failed compile exits non-zero instead of 0.

  RGRC_NO_CACHE=1   compile unconditionally (the manifest is still written)
  RGRC_CACHE_LOG=1  say which file invalidated the cache
`);
  process.exit(2);
}

/** `-d=<dir>` and `-o=<file>` decide where the output lands. */
const outDir = (argv.find((a) => a.startsWith("-d=")) || "-d=.").slice(3);
const outName = (argv.find((a) => a.startsWith("-o=")) || "").slice(3);
if (!outName) {
  process.stderr.write("rgrc-cached: no -o=<file> in the arguments; nothing to cache.\n");
  process.exit(2);
}
const outFile = path.resolve(ROOT, outDir, outName);
const manifestFile = path.join(path.dirname(outFile), `.${path.basename(outFile)}.deps.json`);

const verbose = process.env.RGRC_CACHE_LOG === "1";
const noCache = process.env.RGRC_NO_CACHE === "1";

const sha = (buf) => crypto.createHash("sha256").update(buf).digest("hex").slice(0, 16);

/**
 * Everything outside the sources that changes what a compile produces: the
 * arguments, the compiler bundle, and the search path `Import` resolves
 * against. A `RANGER_LIB` that changed picks different files for the same
 * `Import`, so a manifest recorded under a different one cannot be trusted.
 */
function environmentKey() {
  const h = crypto.createHash("sha256");
  h.update(JSON.stringify(argv));
  h.update("\0");
  h.update(process.env.RANGER_LIB || "");
  h.update("\0");
  h.update(fs.readFileSync(COMPILER));
  return h.digest("hex").slice(0, 16);
}

/** Is the recorded manifest still true of the tree on disk? */
function isFresh(manifest) {
  if (manifest.version !== 1) return "manifest format";
  if (manifest.env !== environmentKey()) return "compiler, arguments or RANGER_LIB";
  if (!fs.existsSync(outFile)) return "the output is gone";

  for (const [rel, hash] of Object.entries(manifest.read)) {
    const abs = path.resolve(ROOT, rel);
    let buf;
    try { buf = fs.readFileSync(abs); } catch { return rel + " (removed)"; }
    if (sha(buf) !== hash) return rel;
  }
  // A file that has appeared where the resolver once looked and found nothing
  // changes what the next `Import` resolves to, so it invalidates too.
  for (const rel of manifest.missed) {
    if (fs.existsSync(path.resolve(ROOT, rel))) return rel + " (appeared)";
  }
  return null;
}

if (!noCache && fs.existsSync(manifestFile)) {
  let manifest = null;
  try { manifest = JSON.parse(fs.readFileSync(manifestFile, "utf8")); } catch { manifest = null; }
  if (manifest) {
    const why = isFresh(manifest);
    if (!why) {
      if (verbose) process.stderr.write(`rgrc-cached: ${path.relative(ROOT, outFile)} is up to date\n`);
      process.exit(0);
    }
    if (verbose) process.stderr.write(`rgrc-cached: recompiling, changed: ${why}\n`);
  }
}

// ------------------------------------------------------------------ compile

const depsOut = path.join(
  fs.mkdtempSync(path.join(process.env.TMPDIR || "/tmp", "rgrc-deps-")),
  "deps.json"
);

// The compiler leaves the previous output in place when it fails, and says so
// only in its log. Removing it first makes a failure impossible to mistake for
// a success.
fs.rmSync(outFile, { force: true });
fs.rmSync(manifestFile, { force: true });

const res = spawnSync("node", ["-r", PROBE, COMPILER, ...argv], {
  cwd: ROOT,
  encoding: "utf8",
  maxBuffer: 1 << 28,
  env: { ...process.env, RGRC_DEPS_OUT: depsOut },
});

if (res.error) {
  process.stderr.write(`rgrc-cached: could not run the compiler: ${res.error.message}\n`);
  process.exit(1);
}
process.stdout.write(res.stdout || "");
process.stderr.write(res.stderr || "");

const log = (res.stdout || "") + (res.stderr || "");
if (res.status !== 0 || log.includes("Compilation FAILED") || !fs.existsSync(outFile)) {
  fs.rmSync(outFile, { force: true });
  if (!log.includes("Compilation FAILED") && !fs.existsSync(outFile)) {
    process.stderr.write(`rgrc-cached: the compiler wrote no ${path.relative(ROOT, outFile)}\n`);
  }
  process.stderr.write("rgrc-cached: compilation FAILED\n");
  process.exit(1);
}

// -------------------------------------------------------- record what it read

let recorded = null;
try { recorded = JSON.parse(fs.readFileSync(depsOut, "utf8")); } catch { recorded = null; }
fs.rmSync(path.dirname(depsOut), { recursive: true, force: true });

if (!recorded || !recorded.read || !recorded.read.length) {
  // No manifest means every later run recompiles. That is slow, not wrong, so
  // it is a warning rather than a failure.
  process.stderr.write("rgrc-cached: warning: recorded no dependencies; the next run will recompile\n");
  process.exit(0);
}

const read = {};
for (const abs of recorded.read) {
  try { read[path.relative(ROOT, abs)] = sha(fs.readFileSync(abs)); } catch {}
}
const missed = [...new Set(recorded.missed.map((p) => path.relative(ROOT, p)))]
  // A probe outside the repository cannot be watched usefully from here.
  .filter((p) => !p.startsWith(".."));

fs.mkdirSync(path.dirname(manifestFile), { recursive: true });
fs.writeFileSync(manifestFile, JSON.stringify({
  version: 1,
  env: environmentKey(),
  output: path.relative(ROOT, outFile),
  read,
  missed,
}, null, 0) + "\n");

if (verbose) {
  process.stderr.write(
    `rgrc-cached: recorded ${Object.keys(read).length} sources, ${missed.length} probed paths\n`
  );
}
