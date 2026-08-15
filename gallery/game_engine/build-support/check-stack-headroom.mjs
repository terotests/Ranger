/**
 * Guard the compiler stack headroom the web builds depend on.
 *
 *   node gallery/game_engine/build-support/check-stack-headroom.mjs
 *
 * Why this exists
 * ---------------
 * `RangerLispParser.parse` is recursive, and it costs one stack frame per
 * block-opening statement in a block — a long run of `if (x) { … }` siblings
 * in one function, not nesting depth and nothing to do with JSX. Measured:
 * 1200 sequential one-line `if` statements reach a parse depth of 1129, and
 * ComponentEngine.rgr peaks at 975.
 *
 * Node's default stack (~984KB) sits just under that, which is why compiling
 * ComponentEngine overflowed — and the overflow is reported as "Unexpected
 * compiler error", replacing whatever real diagnostics were underneath it.
 * rgr-compile.mjs therefore compiles at COMPILER_STACK_KB.
 *
 * This check compiles the heavy sources at HALF that, so a pass means at least
 * 2x headroom. When it starts failing, the answer is not necessarily a bigger
 * number: look at whether one function has grown a very long run of block
 * statements, and consider splitting it.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { COMPILER_STACK_KB, RANGER_LIB } from "./rgr-compile.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const HALF = Math.floor(COMPILER_STACK_KB / 2);

/** The sources the Pages build compiles that are anywhere near the limit. */
const HEAVY = [
  "gallery/game_engine/v2/interp/migrate/src/ComponentEngine.rgr",
  "gallery/game_engine/v2/interp/engine/RgRegistryBridge.rgr",
  "gallery/game_engine/v2/web/web_live2d_host.rgr",
  "gallery/game_engine/v2/web/web_live3d_host.rgr",
];

const out = fs.mkdtempSync(path.join(os.tmpdir(), "rgr-stack-"));
let failed = 0;

console.log(`### compiler stack headroom (compiling at ${HALF}KB, half of ${COMPILER_STACK_KB}KB)`);
for (const src of HEAVY) {
  if (!fs.existsSync(path.join(ROOT, src))) {
    console.log(`  SKIP ${src} (not present)`);
    continue;
  }
  let log = "";
  try {
    log = execFileSync(
      "node",
      [`--stack-size=${HALF}`, "bin/output.js", "-es6", src, `-d=${path.relative(ROOT, out)}`, "-o=probe.js", "-nodecli"],
      { cwd: ROOT, encoding: "utf8", maxBuffer: 1 << 28, env: { RANGER_LIB, ...process.env } }
    );
  } catch (e) {
    log = String(e.stdout ?? "") + String(e.stderr ?? "");
  }
  if (/Maximum call stack size exceeded/.test(log)) {
    failed += 1;
    console.log(`  FAIL ${src} — needs more than ${HALF}KB of stack, i.e. under 2x headroom`);
  } else {
    console.log(`  PASS ${src}`);
  }
}
fs.rmSync(out, { recursive: true, force: true });

console.log("=".repeat(62));
if (failed) {
  console.log(`stack headroom FAIL — ${failed} source(s) too close to the limit`);
  process.exit(1);
}
console.log("stack headroom OK");
