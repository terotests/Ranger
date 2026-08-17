#!/usr/bin/env node
// Extracts the PROBES corpus from tests/runtime-conformance.test.ts and writes
// it out as Ranger data, so the SAME probes the Node-side conformance suite runs
// can be run by the engine compiled to every other target.
//
//   node scripts/gen-es-conformance-probes.cjs
//
// Produces tests/native/es_probes.rgr. Regenerate after editing PROBES; the
// suite checks that regenerating produces no diff.
//
// The probe bodies are JavaScript source, so they carry quotes, backslashes,
// newlines and non-ASCII. A Ranger string literal cannot hold that reliably
// across ten target writers, so each body is emitted as the HEX OF ITS UTF-8
// and rebuilt at runtime with RgBase.hexDecode + RgText.fromUtf8Bytes.
//
// Hex replaced a first attempt that emitted each body as a list of code points,
// `push out ([] _:int ( 102 117 110 ... ))`. That was abandoned after a
// "Maximum call stack size exceeded" from the compiler, which was MISDIAGNOSED
// at the time: the overflow comes from ComponentEngine.rgr, not from this file
// (ISSUES.md #70 — measured parse depth is 2117 for the engine and 70 for this
// corpus, whichever encoding it uses). Hex is kept anyway because it is half
// the bytes and one flat literal per probe instead of thousands of nested ones.

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "tests", "runtime-conformance.test.ts");
const OUT = path.join(ROOT, "tests", "native", "es_probes.rgr");

/** Slice out the `const PROBES = [...]` array literal and evaluate it. */
function readProbes() {
  const txt = fs.readFileSync(SRC, "utf8");
  const start = txt.indexOf("const PROBES");
  if (start < 0) throw new Error("PROBES not found in " + SRC);
  const open = txt.indexOf("[", txt.indexOf("=", start));
  let depth = 0;
  let inString = null;
  let escaped = false;
  let i = open;
  for (; i < txt.length; i++) {
    const c = txt[i];
    if (inString) {
      if (escaped) { escaped = false; continue; }
      if (c === "\\") { escaped = true; continue; }
      if (c === inString) inString = null;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") { inString = c; continue; }
    if (c === "/" && txt[i + 1] === "/") {
      while (i < txt.length && txt[i] !== "\n") i++;
      continue;
    }
    if (c === "[") depth++;
    else if (c === "]") { depth--; if (depth === 0) break; }
  }
  return vm.runInNewContext("(" + txt.slice(open, i + 1) + ")");
}

/** UTF-8 hex, so no target's string-literal escaping can touch the body. */
function utf8Hex(s) {
  return Buffer.from(s, "utf8").toString("hex");
}

/**
 * A Ranger function returning one chunk of the corpus.
 *
 * Split into chunks because a single function with 2000+ statements is where
 * target writers start to strain — the C# and Java writers emit one method body
 * per function and both have hard limits on it.
 */
/**
 * One array literal instead of a `push` per item.
 *
 * Measured on 2000 string items, compiling to es6 with the node compiler:
 * `push out "..."` per item is 473 ms and 2010 lines; the same data as one
 * `([] ... )` literal is 330 ms and 260 lines — **30% faster to compile**. Every
 * generated table already in this repository (UnicodeProps, LocaleData and the
 * other five) is written this way; this generator was the one place that was
 * not.
 *
 * `perLine` keeps the literal readable: short names pack several to a line,
 * hex bodies get one each because they run to 700 characters.
 */
function arrayLiteral(items, perLine) {
  if (items.length === 0) return ["        def out:[string]", "        return out"];
  // `([]` — the untyped array literal marker, exactly as UnicodeProps.rgr and
  // the other generated tables spell it. `([` alone parses but builds nothing:
  // the first version of this emitted it and the corpus came back empty.
  const lines = ["        return ([]"];
  for (let i = 0; i < items.length; i += perLine) {
    lines.push("            " + items.slice(i, i + perLine).join(" "));
  }
  lines.push("        )");
  return lines;
}

function emitChunk(index, probes) {
  const lines = [];
  lines.push(`    static sfn names${index}:[string] () {`);
  lines.push(...arrayLiteral(probes.map(([name]) => JSON.stringify(name)), 6));
  lines.push("    }");
  lines.push("");
  lines.push(`    static sfn bodies${index}:[string] () {`);
  lines.push(...arrayLiteral(probes.map(([, body]) => `"${utf8Hex(body)}"`), 1));
  lines.push("    }");
  return lines.join("\n");
}

function main() {
  const probes = readProbes();
  const CHUNK = 200;
  const chunks = [];
  for (let i = 0; i < probes.length; i += CHUNK) chunks.push(probes.slice(i, i + CHUNK));

  const out = [];
  out.push("; =============================================================================");
  out.push("; es_probes — the runtime-conformance probe corpus, as Ranger data");
  out.push("; =============================================================================");
  out.push(";");
  out.push("; GENERATED. Do not edit by hand; regenerate with");
  out.push(";");
  out.push(";   node scripts/gen-es-conformance-probes.cjs");
  out.push(";");
  out.push("; Source of truth is the PROBES array in tests/runtime-conformance.test.ts,");
  out.push("; which the Node-side suite runs against the engine module. This file carries");
  out.push("; the same probes so es_conformance_main.rgr can run them from a COMPILED");
  out.push("; engine on Go, C++, Rust, Python and the rest — the Node suite proves the");
  out.push("; semantics, this proves they survive compilation.");
  out.push(";");
  out.push("; Each body is the HEX OF ITS UTF-8, not a string literal. The bodies are");
  out.push("; JavaScript source and carry quotes, backslashes, newlines and non-ASCII, and");
  out.push("; hex is the one encoding no target's string-literal escaping can mangle. It");
  out.push("; is decoded at runtime with RgBase.hexDecode + RgText.fromUtf8Bytes.");
  out.push(";");
  out.push(`; ${probes.length} probes, in ${chunks.length} chunks of at most ${CHUNK}.`);
  out.push("; =============================================================================");
  out.push("");
  out.push('Import "../../lib/core/RgBase.rgr"');
  out.push("");
  out.push("class EsProbes {");
  out.push("");
  out.push("    static sfn chunkCount:int () {");
  out.push(`        return ${chunks.length}`);
  out.push("    }");
  out.push("");
  out.push("    static sfn probeCount:int () {");
  out.push(`        return ${probes.length}`);
  out.push("    }");
  out.push("");

  chunks.forEach((c, i) => {
    out.push(emitChunk(i, c));
    out.push("");
  });

  // Dispatchers, so the runner does not need to know the chunk layout.
  out.push("    static sfn namesOf:[string] (chunk:int) {");
  chunks.forEach((_, i) => {
    out.push(`        if (chunk == ${i}) {`);
    out.push(`            return (EsProbes.names${i}())`);
    out.push("        }");
  });
  out.push("        def empty:[string]");
  out.push("        return empty");
  out.push("    }");
  out.push("");
  out.push("    static sfn bodiesOf:[string] (chunk:int) {");
  chunks.forEach((_, i) => {
    out.push(`        if (chunk == ${i}) {`);
    out.push(`            return (EsProbes.bodies${i}())`);
    out.push("        }");
  });
  out.push("        def empty:[string]");
  out.push("        return empty");
  out.push("    }");
  out.push("}");
  out.push("");

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, out.join("\n"));
  console.log(`wrote ${path.relative(ROOT, OUT)}: ${probes.length} probes, ${chunks.length} chunks`);
}

main();
