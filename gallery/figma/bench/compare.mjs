#!/usr/bin/env node
/**
 * Time Ranger FigParser against openfig-core on the same bytes.
 *
 *   npm run figma:bench
 *   npm run figma:bench -- path/to/file.fig
 *
 * The sample.fig is built by the Ranger CLI (no Figma app). A real export
 * exercises zstd + the file's own kiwi schema on both sides.
 */
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { execSync } from "node:child_process";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../../..");
const require = createRequire(import.meta.url);

function compileCli() {
  const out = join(root, "gallery/figma/bin/fig_cli.js");
  execSync(
    `bash scripts/rgr-suite.sh ./gallery/figma/src/fig_cli.rgr ./gallery/figma/bin fig_cli.js`,
    { cwd: root, stdio: "inherit" },
  );
  return out;
}

function ensureSample() {
  const dest = join(root, "gallery/figma/fixtures/sample.fig");
  mkdirSync(dirname(dest), { recursive: true });
  execSync(`node gallery/figma/bin/fig_cli.js write-sample ${dest}`, { cwd: root, stdio: "inherit" });
  return dest;
}

function rangerParse(FigWeb, bytes, name) {
  const t0 = performance.now();
  const web = new FigWeb();
  const ok = web.openBytes(bytes, name);
  const ms = performance.now() - t0;
  if (!ok) throw new Error(web.error() || "Ranger parse failed");
  const stats = JSON.parse(web.stats());
  return { ms, stats, pages: JSON.parse(web.pages()).length };
}

async function openfigParse(bytes) {
  let parseFig;
  try {
    ({ parseFig } = await import("openfig-core"));
  } catch {
    return { ms: null, nodes: null, reason: "openfig-core not installed" };
  }
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const t0 = performance.now();
  const doc = parseFig(u8);
  const ms = performance.now() - t0;
  return { ms, nodes: doc.nodes?.length ?? 0, pages: doc.nodeMap ? undefined : undefined };
}

function asRangerBuffer(buf) {
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  ab._view = new DataView(ab);
  return ab;
}

async function main() {
  compileCli();
  const arg = process.argv[2];
  const file = arg ? resolve(arg) : ensureSample();
  if (!existsSync(file)) {
    console.error("missing", file);
    process.exit(1);
  }
  const raw = readFileSync(file);
  const name = file.split("/").pop();

  execSync(
    `bash scripts/rgr-suite.sh ./gallery/figma/web/fig_web.rgr ./gallery/figma/bin fig_web.js`,
    { cwd: root, stdio: "inherit" },
  );
  const src = readFileSync(join(root, "gallery/figma/bin/fig_web.js"), "utf8");
  const FigWeb = (0, eval)(src + "; FigWeb");
  const bytes = asRangerBuffer(raw);

  // warmup
  rangerParse(FigWeb, bytes, name);
  const r1 = rangerParse(FigWeb, bytes, name);
  const r2 = rangerParse(FigWeb, bytes, name);
  const rangerMs = Math.min(r1.ms, r2.ms);

  const of = await openfigParse(raw);
  let ofMs = of.ms;
  if (ofMs != null) {
    const of2 = await openfigParse(raw);
    ofMs = Math.min(ofMs, of2.ms);
  }

  const row = {
    file: name,
    bytes: raw.length,
    rangerMs: Number(rangerMs.toFixed(2)),
    rangerNodes: r2.stats.nodes,
    rangerPages: r2.pages,
    rangerBreakdown: r2.stats.ms,
    openfigMs: ofMs == null ? null : Number(ofMs.toFixed(2)),
    openfigNodes: of.nodes,
    openfigNote: of.reason || null,
  };
  console.log(JSON.stringify(row, null, 2));
  const outDir = join(here, "out");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "last.json"), JSON.stringify(row, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
