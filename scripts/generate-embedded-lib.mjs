#!/usr/bin/env node
// Generate compiler/EmbeddedLib.rgr — the standard library as string constants
// inside the compiler itself.
//
// Every file read the compiler does goes through the `InputEnv` operators in
// compiler/InputFileSystem.rgr (`file_exists env path name` / `read_file env
// path name`), including `Import`. Those two fall back to `RangerEmbeddedLib`
// when the real file is not on disk, so a compiler built with a filled-in
// EmbeddedLib.rgr needs neither RANGER_LIB nor any .rgr file beside the binary.
// Files on disk still win, so a project can bring its own library.
//
// The committed EmbeddedLib.rgr is the **stub** (no files, `hasFile` always
// false): the default build stays the size it was, and only the packaged
// binaries carry the library. `scripts/build-native-compiler.sh --embed-lib`
// fills it in, builds, and restores the stub.
//
// Usage:
//   node scripts/generate-embedded-lib.mjs            # fill in
//   node scripts/generate-embedded-lib.mjs --stub     # empty it again
//   node scripts/generate-embedded-lib.mjs --check    # is the file the stub?
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "compiler", "EmbeddedLib.rgr");

// Roughly 4 kB of source per `push`, split on line boundaries only — a chunk
// never ends in the middle of a line, so it can never end in the middle of a
// multi-byte character or an escape sequence.
const CHUNK_TARGET = 4000;

const args = process.argv.slice(2);
const STUB = args.includes("--stub");
const CHECK = args.includes("--check");

/** The files a compiler with no library on disk has to be able to find. */
function collectFiles() {
  const files = new Map();
  files.set("Lang.rgr", readFileSync(join(ROOT, "compiler", "Lang.rgr"), "utf8"));
  for (const name of readdirSync(join(ROOT, "lib")).sort()) {
    if (!name.endsWith(".rgr")) continue;
    files.set(name, readFileSync(join(ROOT, "lib", name), "utf8"));
  }
  return files;
}

/** Escape a chunk for a Ranger string literal. Backslash first, always. */
function rangerString(text) {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n");
}

/** Split on line boundaries, keeping the newline with its line. */
function chunk(text) {
  const out = [];
  let current = "";
  for (const line of text.split(/(?<=\n)/)) {
    if (current.length > 0 && current.length + line.length > CHUNK_TARGET) {
      out.push(current);
      current = "";
    }
    current += line;
  }
  if (current.length > 0) out.push(current);
  return out;
}

/** `JSON.rgr` -> `f_JSON_rgr` — a name that is legal in every target. */
function fnName(file) {
  return "f_" + file.replace(/[^A-Za-z0-9]/g, "_");
}

function generate(files) {
  const L = [];
  L.push("; GENERATED FILE - do not edit by hand.");
  L.push("; Written by scripts/generate-embedded-lib.mjs; the committed version");
  L.push("; is the stub (no files). `npm run embed:lib` fills it in for a packaged");
  L.push("; build, `npm run embed:stub` empties it again.");
  L.push(";");
  L.push("; The library, compiled into the compiler. InputFileSystem.rgr falls back");
  L.push("; here when a file is not on disk, so RANGER_LIB is optional.");
  L.push("");
  L.push("class RangerEmbeddedLib {");
  L.push("");
  L.push("  ; True when this build carries the library inside it.");
  L.push("  static fn isEmbedded:boolean () {");
  L.push(`    return ${files.size > 0 ? "true" : "false"}`);
  L.push("  }");
  L.push("");
  L.push("  static fn hasFile:boolean (name:string) {");
  if (files.size > 0) {
    L.push("    switch name {");
    for (const file of files.keys()) {
      L.push(`      case "${file}" { return true }`);
    }
    L.push("    }");
  }
  L.push("    return false");
  L.push("  }");
  L.push("");
  L.push("  static fn getFile:string (name:string) {");
  if (files.size > 0) {
    L.push("    switch name {");
    for (const file of files.keys()) {
      L.push(`      case "${file}" { return (RangerEmbeddedLib.${fnName(file)}()) }`);
    }
    L.push("    }");
  }
  L.push('    return ""');
  L.push("  }");

  for (const [file, text] of files) {
    const chunks = chunk(text.replace(/\r\n/g, "\n"));
    L.push("");
    L.push(`  ; ${file} — ${text.length} characters in ${chunks.length} parts`);
    L.push(`  static fn ${fnName(file)}:string () {`);
    L.push("    def parts:[string]");
    for (const part of chunks) {
      L.push(`    push parts "${rangerString(part)}"`);
    }
    L.push('    return (join parts "")');
    L.push("  }");
  }

  L.push("}");
  L.push("");
  return L.join("\n");
}

if (CHECK) {
  const current = readFileSync(OUT, "utf8");
  const isStub = /static fn isEmbedded:boolean \(\) {\s*\n\s*return false/.test(current);
  console.log(isStub ? "stub" : "filled");
  process.exit(isStub ? 0 : 1);
}

const files = STUB ? new Map() : collectFiles();
const text = generate(files);
writeFileSync(OUT, text);

const bytes = [...files.values()].reduce((n, t) => n + t.length, 0);
console.log(
  STUB
    ? `wrote stub ${OUT} (${text.length} bytes)`
    : `wrote ${OUT}: ${files.size} files, ${bytes} characters of library, ${text.length} bytes of Ranger`
);
