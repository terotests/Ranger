#!/usr/bin/env node
/**
 * Time the Ranger decoder against fzstd — the library gallery/figma had to
 * vendor before this existed — and against Node's own zstd, on the same
 * bytes.
 *
 *   npm run zstd:bench
 *   npm run zstd:bench -- gallery/zstd/fixtures/prose-l19.zst
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import { zstdDecompressSync } from "node:zlib";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../../..");

execSync(
  "RANGER_LIB=./compiler/Lang.rgr:./lib/stdops.rgr node bin/output.js -es6 " +
    "./gallery/zstd/bench/ZstdBench.rgr -d=./gallery/zstd/bin -o=ZstdBench.js",
  { cwd: root, stdio: "ignore" }
);

// The bundle defines its classes as top-level names with no exports, which
// is what the compiler emits; eval'ing it hands back the entry point.
const bundleSrc = readFileSync(join(root, "gallery/zstd/bin/ZstdBench.js"), "utf8");
const rangerRun = (0, eval)(bundleSrc + "; ZstdBench.run");

const { decompress: fzstd } = await import(
  join(root, "gallery/figma/web/vendor/fzstd.mjs")
).catch(() => ({ decompress: null }));

const files = process.argv.slice(2);
const targets = files.length
  ? files
  : ["figma-message", "prose-l19", "multiblock-l19", "runs"].map(
      (n) => `gallery/zstd/fixtures/${n}.zst`
    );

function time(fn, runs) {
  fn();
  const t0 = performance.now();
  for (let i = 0; i < runs; i++) fn();
  return (performance.now() - t0) / runs;
}

console.log(
  "file".padEnd(22),
  "in".padStart(9),
  "out".padStart(9),
  "ranger".padStart(9),
  "fzstd".padStart(9),
  "node".padStart(9)
);
for (const path of targets) {
  const full = resolve(root, path);
  if (!existsSync(full)) {
    console.log(path, "— missing");
    continue;
  }
  const packed = readFileSync(full);
  const runs = packed.length > 200000 ? 5 : 20;
  const ab = packed.buffer.slice(packed.byteOffset, packed.byteOffset + packed.byteLength);
  ab._view = new DataView(ab);
  const out = rangerRun(ab);
  const want = zstdDecompressSync(packed);
  if (out.byteLength !== want.length) {
    console.log(path, "— the Ranger decoder disagrees about the size, not timing it");
    continue;
  }
  const rangerMs = time(() => rangerRun(ab), runs);
  const fzstdMs = fzstd ? time(() => fzstd(new Uint8Array(packed)), runs) : NaN;
  const nodeMs = time(() => zstdDecompressSync(packed), runs);
  console.log(
    path.split("/").pop().padEnd(22),
    String(packed.length).padStart(9),
    String(out.byteLength).padStart(9),
    rangerMs.toFixed(2).padStart(9),
    (Number.isNaN(fzstdMs) ? "n/a" : fzstdMs.toFixed(2)).padStart(9),
    nodeMs.toFixed(2).padStart(9)
  );
}
