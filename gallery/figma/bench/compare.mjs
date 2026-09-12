#!/usr/bin/env node
/**
 * Time Ranger FigParser against openfig-core on the same bytes.
 *
 *   npm run figma:bench
 *   npm run figma:bench -- path/to/file.fig
 *
 * Two clocks, because they are not the same work:
 *
 *   parse  — ZIP + inflate/zstd + kiwi schema + message + node tree.
 *            Ranger `FigParser.parseBytes` vs OpenFig `parseFig`.
 *   viewer — Ranger parse + scene graph + EVG display list (`FigApp.openBytes`).
 *            OpenFig does not paint; there is no counterpart.
 *
 * The generated sample.fig is stored-deflate so both sides skip zstd.
 * health.fig is a real Figma export (zstd + the file's own kiwi schema).
 */
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../../..");
const RUNS = 9;

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

function loadFigWeb() {
  execSync(
    `bash scripts/rgr-suite.sh ./gallery/figma/web/fig_web.rgr ./gallery/figma/bin fig_web.js`,
    { cwd: root, stdio: "inherit" },
  );
  const src = readFileSync(join(root, "gallery/figma/bin/fig_web.js"), "utf8");
  return (0, eval)(src + "; FigWeb");
}

function asRangerBuffer(buf) {
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  ab._view = new DataView(ab);
  return ab;
}

function rangerOnce(FigWeb, bytes, name) {
  const t0 = performance.now();
  const web = new FigWeb();
  const ok = web.openBytes(bytes, name);
  const viewerMs = performance.now() - t0;
  if (!ok) throw new Error(web.error() || "Ranger parse failed");
  const stats = JSON.parse(web.stats());
  return {
    viewerMs,
    parseMs: stats.ms.total,
    stats,
    pages: JSON.parse(web.pages()).length,
    cmds: stats.cmds,
  };
}

async function loadOpenFig() {
  try {
    const mod = await import("openfig-core");
    const parseFig = mod.parseFig;
    if (typeof parseFig !== "function") {
      return { parseFig: null, reason: "openfig-core has no parseFig", version: null };
    }
    let version = null;
    try {
      const pkgPath = join(root, "node_modules/openfig-core/package.json");
      if (existsSync(pkgPath)) version = JSON.parse(readFileSync(pkgPath, "utf8")).version;
    } catch {
      version = null;
    }
    return { parseFig, reason: null, version };
  } catch {
    return { parseFig: null, reason: "openfig-core not installed", version: null };
  }
}

function openfigOnce(parseFig, raw) {
  const u8 = raw instanceof Uint8Array ? raw : new Uint8Array(raw);
  const t0 = performance.now();
  const doc = parseFig(u8);
  const ms = performance.now() - t0;
  return { ms, nodes: doc.nodes?.length ?? 0 };
}

function summary(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  return {
    min: sorted[0],
    median,
    max: sorted[sorted.length - 1],
  };
}

function rnd(n) {
  return Number(n.toFixed(2));
}

function ratio(a, b) {
  if (a == null || b == null || b === 0) return null;
  return Number((a / b).toFixed(2));
}

function fmt(n) {
  if (n == null) return "–";
  return `${rnd(n)}`;
}

async function benchFile(FigWeb, of, file) {
  const raw = readFileSync(file);
  const name = file.split("/").pop();
  const bytes = asRangerBuffer(raw);

  rangerOnce(FigWeb, bytes, name);
  const rangerRuns = [];
  for (let i = 0; i < RUNS; i++) rangerRuns.push(rangerOnce(FigWeb, bytes, name));

  let ofRuns = [];
  let ofReason = of.reason;
  if (of.parseFig) {
    openfigOnce(of.parseFig, raw);
    for (let i = 0; i < RUNS; i++) ofRuns.push(openfigOnce(of.parseFig, raw));
  }

  const last = rangerRuns[rangerRuns.length - 1];
  const rParse = summary(rangerRuns.map((r) => r.parseMs));
  const rView = summary(rangerRuns.map((r) => r.viewerMs));
  const oParse = ofRuns.length ? summary(ofRuns.map((r) => r.ms)) : null;

  return {
    file: name,
    bytes: raw.length,
    runs: RUNS,
    rangerNodes: last.stats.nodes,
    rangerPages: last.pages,
    rangerCmds: last.cmds,
    rangerZstd: last.stats.zstd,
    rangerParse: {
      min: rnd(rParse.min),
      median: rnd(rParse.median),
      max: rnd(rParse.max),
    },
    rangerViewer: {
      min: rnd(rView.min),
      median: rnd(rView.median),
      max: rnd(rView.max),
    },
    rangerBreakdown: last.stats.ms,
    openfigVersion: of.version,
    openfigNodes: ofRuns.length ? ofRuns[ofRuns.length - 1].nodes : null,
    openfigParse: oParse
      ? { min: rnd(oParse.min), median: rnd(oParse.median), max: rnd(oParse.max) }
      : null,
    openfigNote: ofReason,
    parseRatioRangerOverOpenFig: oParse ? ratio(rParse.median, oParse.median) : null,
    winnerParse:
      oParse == null
        ? "ranger (openfig missing)"
        : rParse.median < oParse.median
          ? "ranger"
          : oParse.median < rParse.median
            ? "openfig"
            : "tie",
  };
}

function printTable(rows) {
  console.log("");
  console.log("Parse only (ZIP + kiwi + node tree) — median of " + RUNS + " runs after warmup");
  console.log(
    "file".padEnd(16) +
      "bytes".padStart(10) +
      "Ranger".padStart(12) +
      "OpenFig".padStart(12) +
      "R/O".padStart(8) +
      "  winner",
  );
  for (const row of rows) {
    const of = row.openfigParse ? fmt(row.openfigParse.median) + " ms" : "missing";
    const rr = fmt(row.rangerParse.median) + " ms";
    const ratioStr = row.parseRatioRangerOverOpenFig == null ? "–" : String(row.parseRatioRangerOverOpenFig) + "x";
    console.log(
      row.file.padEnd(16) +
        String(row.bytes).padStart(10) +
        rr.padStart(12) +
        of.padStart(12) +
        ratioStr.padStart(8) +
        "  " +
        row.winnerParse,
    );
  }
  console.log("");
  console.log("Ranger viewer (parse + scene + EVG list) — OpenFig has no painter");
  console.log("file".padEnd(16) + "parse".padStart(12) + "viewer".padStart(12) + "  nodes / cmds");
  for (const row of rows) {
    console.log(
      row.file.padEnd(16) +
        (fmt(row.rangerParse.median) + " ms").padStart(12) +
        (fmt(row.rangerViewer.median) + " ms").padStart(12) +
        "  " +
        row.rangerNodes +
        " / " +
        row.rangerCmds,
    );
  }
  console.log("");
}

async function main() {
  compileCli();
  const FigWeb = loadFigWeb();
  const of = await loadOpenFig();

  const arg = process.argv[2];
  const files = arg
    ? [resolve(arg)]
    : [
        ensureSample(),
        join(root, "gallery/figma/fixtures/health.fig"),
      ];

  const rows = [];
  for (const file of files) {
    if (!existsSync(file)) {
      console.error("missing", file);
      process.exit(1);
    }
    rows.push(await benchFile(FigWeb, of, file));
  }

  printTable(rows);
  const out = {
    when: new Date().toISOString(),
    node: process.version,
    openfigVersion: of.version,
    openfigNote: of.reason,
    rows,
  };
  console.log(JSON.stringify(out, null, 2));
  const outDir = join(here, "out");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "last.json"), JSON.stringify(out, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
