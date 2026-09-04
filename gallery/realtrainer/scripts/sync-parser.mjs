/**
 * Vendor the COMPACT v1 parser into `gallery/realtrainer/parser/`.
 *
 * The parser is written in Ranger and lives in the RealTrainer monorepo
 * (`parser-ranger-v1/src`), which is private. `rt:check` runs in CI, so the
 * demo cannot resolve the parser through a sibling checkout that CI does not
 * have — the sources are copied in, and this script is what keeps the copy
 * honest.
 *
 * It copies the TRANSITIVE IMPORT CLOSURE of the entry file and nothing else:
 * the source tree also carries the NG track, JSON adapters and test runners,
 * none of which this demo compiles. Forty-six files instead of a hundred and
 * twenty-two, and a diff that only moves when the parser the demo actually
 * uses moves.
 *
 *   node gallery/realtrainer/scripts/sync-parser.mjs [--source <dir>] [--check]
 *
 * `--check` writes nothing and exits 1 if the copy is stale, which is the form
 * CI wants.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DEST = path.join(HERE, "..", "parser");
const REPO = path.resolve(HERE, "..", "..", "..");

const args = process.argv.slice(2);
const checkOnly = args.includes("--check");
const sourceArg = args.indexOf("--source");
const SOURCE = path.resolve(
  sourceArg === -1
    ? path.join(REPO, "..", "realtrainer", "parser-ranger-v1", "src")
    : args[sourceArg + 1]
);

const ENTRY = "compact_parser_v1.rgr";

/** Every .rgr the entry reaches through `Import "…"`, relative to SOURCE. */
function closure(sourceDir) {
  const seen = new Set();
  const visit = (file) => {
    const abs = path.resolve(file);
    if (seen.has(abs)) return;
    if (!fs.existsSync(abs)) {
      throw new Error(`Import not found: ${abs}`);
    }
    seen.add(abs);
    const text = fs.readFileSync(abs, "utf8");
    for (const m of text.matchAll(/^Import\s+"([^"]+)"/gm)) {
      visit(path.resolve(path.dirname(abs), m[1]));
    }
  };
  visit(path.join(sourceDir, ENTRY));
  return [...seen].map((f) => path.relative(sourceDir, f)).sort();
}

if (!fs.existsSync(path.join(SOURCE, ENTRY))) {
  const where =
    `No parser source at ${SOURCE}\n` +
    `Pass --source <dir> pointing at parser-ranger-v1/src, or check out the\n` +
    `RealTrainer monorepo next to this one.`;
  // The vendored copy is what the build uses, so a machine without the source
  // is not broken — it simply cannot answer the question this check asks.
  // Failing there would make the check a tax on everyone who is not syncing.
  if (checkOnly) {
    console.log(`${where}\n\nNothing to compare against — skipped.`);
    process.exit(0);
  }
  console.error(where);
  process.exit(2);
}

const files = closure(SOURCE);
let changed = 0;

for (const rel of files) {
  const from = path.join(SOURCE, rel);
  const to = path.join(DEST, rel);
  const next = fs.readFileSync(from);
  const prev = fs.existsSync(to) ? fs.readFileSync(to) : null;
  if (prev && prev.equals(next)) continue;
  changed += 1;
  if (checkOnly) {
    console.error(`stale: parser/${rel}`);
    continue;
  }
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.writeFileSync(to, next);
}

// A file dropped from the closure has to leave the copy too, or the demo keeps
// compiling something the parser no longer has.
const kept = new Set(files);
const walk = (dir) => {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [path.relative(DEST, p)];
  });
};
for (const rel of walk(DEST)) {
  if (rel === "README.md" || kept.has(rel)) continue;
  changed += 1;
  if (checkOnly) {
    console.error(`orphan: parser/${rel}`);
    continue;
  }
  fs.rmSync(path.join(DEST, rel));
}

if (checkOnly) {
  if (changed > 0) {
    console.error(`\nparser copy is stale (${changed} file(s)) — run npm run rt:parser:sync`);
    process.exit(1);
  }
  console.log(`parser copy up to date (${files.length} files)`);
} else {
  console.log(`parser: ${files.length} files, ${changed} updated`);
}
