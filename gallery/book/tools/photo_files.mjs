/**
 * photo_files.mjs — the file names in a folder, for a language that has none.
 *
 *   node gallery/book/tools/photo_files.mjs ~/Pictures/Export --out names.txt
 *
 * Ranger has `file_exists` and `read_file` and no operator that lists a
 * directory, which is a reasonable place to draw the line for a language that
 * compiles to six targets — and it means "index this folder" needs one line of
 * host code. This is that line.
 *
 * It writes one name per line, relative to the folder, and nothing else: the
 * metadata is read by `PhotoScan` on the Ranger side, out of the files
 * themselves. That split is deliberate — the EXIF reading is the part worth
 * testing, and it is tested there, on all three targets.
 *
 * On a Mac prefer `mac_photos.mjs`: Spotlight has already read these files, it
 * reaches HEIC, and it can ask Photos.app about a library this cannot see
 * into. This one is for everywhere else, and for a folder of plain JPEGs.
 */
import fs from "node:fs";
import path from "node:path";

const EXTS = new Set([".jpg", ".jpeg"]);

function walk(root, at, out) {
  let entries = [];
  try {
    entries = fs.readdirSync(at, { withFileTypes: true });
  } catch (e) {
    console.error("  (skipping " + at + ": " + e.message + ")");
    return;
  }
  for (const e of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const full = path.join(at, e.name);
    if (e.isDirectory()) {
      walk(root, full, out);
    } else if (EXTS.has(path.extname(e.name).toLowerCase())) {
      out.push(path.relative(root, full));
    }
  }
}

const args = process.argv.slice(2);
const dir = args.find((a) => !a.startsWith("--"));
const outIdx = args.indexOf("--out");
const out = outIdx >= 0 ? args[outIdx + 1] : "";

if (!dir) {
  console.error("usage: node photo_files.mjs DIR [--out names.txt]");
  process.exit(2);
}

const root = path.resolve(dir);
const names = [];
walk(root, root, names);

const text = names.join("\n") + (names.length ? "\n" : "");
if (out) {
  fs.writeFileSync(out, text);
  console.log(`${names.length} JPEG(s) under ${root} -> ${out}`);
  console.log("Now index and search them:");
  console.log(`  npm run book:photos -- -scan ${root} -names ${out} -index photo-index.json -summary`);
} else {
  process.stdout.write(text);
}
