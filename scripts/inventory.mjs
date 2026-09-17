#!/usr/bin/env node
//
// The numbers in INVENTORY.md.
//
// Two questions, both answered by reading `Import` lines out of the `.rgr`
// files and nothing else:
//
//   node scripts/inventory.mjs           which components reach outside themselves
//   node scripts/inventory.mjs --dups    which file names occur more than once
//
// "Reaches into" counts import SITES, not files: a component with 202
// `../../evg/` imports is one dependency and 202 lines to convert, and both
// halves of that are worth seeing.

import fs from "fs";
import path from "path";
import crypto from "crypto";

const SKIP_DIRS = new Set(["node_modules", ".git", "bin", "dist", "output"]);

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name)) continue;
      walk(path.join(dir, e.name), acc);
    } else if (e.name.endsWith(".rgr")) {
      acc.push(path.join(dir, e.name));
    }
  }
  return acc;
}

function components() {
  const out = [];
  for (const e of fs.readdirSync("gallery", { withFileTypes: true })) {
    if (e.isDirectory()) out.push(path.join("gallery", e.name));
  }
  out.push("lib", "lib/core", "lib/zip", "pkg", "compiler");
  return out;
}

// Where an escaping import lands, named the way a manifest would name it:
// `gallery/evg`, or `lib` for the platform files that are not their own
// package.
function targetOf(resolved) {
  const parts = resolved.split(path.sep);
  if (parts[0] === "gallery") return parts.slice(0, 2).join("/");
  if (parts[0] === "lib") {
    if (parts[1] === "core" || parts[1] === "zip") return `lib/${parts[1]}`;
    return "lib";
  }
  if (parts[0] === "pkg") return "pkg";
  if (parts[0] === "compiler") return "compiler";
  return parts[0];
}

function scan() {
  const rows = [];
  for (const root of components()) {
    const files = walk(root);
    if (files.length === 0) continue;
    let internal = 0;
    let lines = 0;
    const pkgDeps = new Set();
    const escapes = new Map();
    for (const f of files) {
      const txt = fs.readFileSync(f, "utf8");
      lines += txt.split("\n").length;
      for (const m of txt.matchAll(/^\s*Import\s+"([^"]+)"/gm)) {
        const spec = m[1];
        if (spec.startsWith("pkg:")) {
          pkgDeps.add(spec.slice(4).split("/")[0]);
          continue;
        }
        const resolved = path.normalize(path.join(path.dirname(f), spec));
        if (resolved === root || resolved.startsWith(root + path.sep)) {
          internal++;
          continue;
        }
        const t = targetOf(resolved);
        escapes.set(t, (escapes.get(t) || 0) + 1);
      }
    }
    rows.push({
      name: root,
      files: files.length,
      lines,
      manifest: fs.existsSync(path.join(root, "ranger.json")),
      internal,
      pkgDeps: [...pkgDeps].sort(),
      escapes: [...escapes.entries()].sort((a, b) => b[1] - a[1]),
    });
  }
  return rows;
}

// `lib` and `lib/core` / `lib/zip` overlap, and `gallery/game_engine`
// contains `v2`. Counting a file once means counting only the directories
// the table treats as components.
function totals() {
  const files = [...walk("gallery"), ...walk("lib"), ...walk("pkg")];
  let lines = 0;
  for (const f of files) lines += fs.readFileSync(f, "utf8").split("\n").length;
  const dirs = fs
    .readdirSync("gallery", { withFileTypes: true })
    .filter((e) => e.isDirectory());
  const withSource = dirs.filter(
    (e) => walk(path.join("gallery", e.name)).length > 0
  );
  const manifests = [
    ...dirs
      .map((e) => path.join("gallery", e.name, "ranger.json"))
      .filter((p) => fs.existsSync(p)),
    ...["lib/zip/ranger.json", "lib/core/ranger.json", "pkg/ranger.json"].filter(
      (p) => fs.existsSync(p)
    ),
  ];
  return {
    dirs: dirs.length,
    withSource: withSource.length,
    files: files.length,
    lines,
    manifests: manifests.length,
  };
}

function dups() {
  const files = [
    ...walk("gallery"),
    ...walk("lib"),
    ...walk("pkg"),
    ...walk("compiler"),
  ];
  const byName = new Map();
  for (const f of files) {
    const b = path.basename(f);
    if (!byName.has(b)) byName.set(b, []);
    byName.get(b).push(f);
    }
  const rows = [];
  for (const [name, list] of byName) {
    if (list.length < 2) continue;
    const hashes = new Set(
      list.map((f) =>
        crypto.createHash("sha1").update(fs.readFileSync(f)).digest("hex")
      )
    );
    const lines = list.map((f) => fs.readFileSync(f, "utf8").split("\n").length);
    rows.push({ name, list, lines, identical: hashes.size === 1 });
  }
  rows.sort((a, b) => Math.max(...b.lines) - Math.max(...a.lines));
  return rows;
}

// The two generations inside gallery/game_engine, which is where most of the
// duplication is.
function engineSplit() {
  const hash = (f) =>
    crypto.createHash("sha1").update(fs.readFileSync(f)).digest("hex");
  const v2 = walk("gallery/game_engine/v2");
  const v1 = walk("gallery/game_engine").filter((f) => !f.includes(`${path.sep}v2${path.sep}`));
  const byName = new Map(v1.map((f) => [path.basename(f), f]));
  let identical = 0;
  let diverged = 0;
  for (const f of v2) {
    const g = byName.get(path.basename(f));
    if (!g) continue;
    if (hash(f) === hash(g)) identical++;
    else diverged++;
  }
  return { v1: v1.length, v2: v2.length, identical, diverged };
}

const wantDups = process.argv.includes("--dups");

if (wantDups) {
  const rows = dups();
  for (const r of rows) {
    console.log(
      `${r.name}  x${r.list.length}  ${
        r.identical ? "identical" : "DIVERGED"
      }  lines=${r.lines.join("/")}`
    );
    for (const f of r.list) console.log("    ", f);
  }
  const e = engineSplit();
  console.log("");
  console.log(`duplicate file names: ${rows.length}`);
  console.log(`  of them diverged:   ${rows.filter((r) => !r.identical).length}`);
  console.log(
    `game_engine: ${e.v1} files outside v2, ${e.v2} inside; ` +
      `${e.identical + e.diverged} share a name ` +
      `(${e.identical} identical, ${e.diverged} diverged)`
  );
} else {
  const t = totals();
  console.log(
    `gallery: ${t.dirs} directories, ${t.withSource} with Ranger source`
  );
  console.log(
    `gallery + lib + pkg: ${t.files} .rgr files, ${t.lines} lines, ` +
      `${t.manifests} manifests`
  );
  console.log("");
  console.log("M = has ranger.json.  pkg:[…] = imports by package name.");
  console.log("");
  for (const r of scan().sort((a, b) => b.files - a.files)) {
    const esc = r.escapes.map(([k, v]) => `${k}(${v})`).join(" ") || "none";
    console.log(
      `${r.manifest ? "M" : "-"} ${String(r.files).padStart(4)} ` +
        `${r.name.padEnd(26)} pkg:[${r.pkgDeps.join(",")}] esc:${esc}`
    );
  }
}
