#!/usr/bin/env node
// Puts the launcher at the top of dist/rgrc.js (run by `npm run compile`).
//
// Compiling a large program allocates objects that nearly all live until the
// end (CodeNodes, contexts): with V8's default 16 MB young generation every
// scavenge copies what it holds into the old space, and on web/com (109k
// lines of Rust) the scavenges took 5 of 18 seconds. A young generation of a
// fixed 128 MB scavenges an eighth as often. V8 reads the size only at start,
// so the compiler runs itself once more with the flags, unless they were
// given (or RGRC_NO_RESPAWN is set). docs/plans/RUST_COMPILE_BENCH.md
import fs from "node:fs";

const file = process.argv[2] ?? "dist/rgrc.js";
const MARK = "// rgrc-launcher";
let src = fs.readFileSync(file, "utf8");
if (src.includes(MARK)) process.exit(0);
const launcher = `${MARK}: one more start with a 128 MB young generation (scripts/rgrc-launcher.mjs)
if (typeof require === "function" && typeof module === "object" && require.main === module && !process.env.RGRC_NO_RESPAWN && !process.execArgv.some((a) => a.indexOf("semi-space") >= 0)) {
  const r = require("child_process").spawnSync(process.execPath, ["--min-semi-space-size=128", "--max-semi-space-size=128", ...process.execArgv, __filename, ...process.argv.slice(2)], { stdio: "inherit", env: Object.assign({}, process.env, { RGRC_NO_RESPAWN: "1" }) });
  if (r.error) throw r.error;
  process.exit(r.status === null ? 1 : r.status);
}
`;
let head = "";
if (src.startsWith("#!")) {
  const nl = src.indexOf("\n") + 1;
  head = src.slice(0, nl);
  src = src.slice(nl);
}
fs.writeFileSync(file, head + launcher + src);
