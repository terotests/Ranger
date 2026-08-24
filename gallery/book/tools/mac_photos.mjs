/**
 * mac_photos.mjs — the part of the photo pipeline that has to be a Mac.
 *
 *   node gallery/book/tools/mac_photos.mjs --index --out ~/book
 *   node gallery/book/tools/mac_photos.mjs --folder ~/Pictures/Export --out ~/book
 *   node gallery/book/tools/mac_photos.mjs --book --out ~/book \
 *        --from 2019-06-01 --to 2019-08-31 --near 61.5,25.0 --radius 20
 *   node gallery/book/tools/mac_photos.mjs --self-test
 *
 * Everything above this file is portable Ranger: the index, the search, the
 * layout, the preflight. Three things are not, and they are all here.
 *
 *   REACHING THE LIBRARY. A modern Photos library has no readable index —
 *   Apple stopped writing AlbumData.xml — and its database is inside a package
 *   the system guards. The supported way in is to ASK Photos.app, over
 *   AppleScript, which is what `--index` does. macOS will put up a permission
 *   dialog the first time; that is the system asking on the user's behalf, and
 *   it is the right thing to happen.
 *
 *   HEIC. An iPhone writes HEIC. It cannot go into a PDF, and no browser but
 *   Safari will draw one, so a chosen photograph is converted with `sips`,
 *   which is part of macOS. Only the CHOSEN ones: converting twenty pictures
 *   is a second, converting nine thousand is an afternoon, and that asymmetry
 *   is the whole reason the index exists.
 *
 *   SPOTLIGHT. For a plain folder — an export, a NAS, a camera card — `mdls`
 *   answers faster than opening the files would, because it has already read
 *   them. That path reaches HEIC too, and needs no permission beyond the
 *   folder itself.
 *
 * WHAT IS TESTED WHERE. Spawning `osascript` and `sips` cannot be tested off a
 * Mac, so this file is written so that the part that CAN be wrong on any
 * machine — parsing what those tools print — is pure and tested: `--self-test`
 * feeds recorded output through the parsers and checks the records that come
 * out. The process calls around them are deliberately thin.
 */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "../../..");

// --- what the tools print, turned into records -------------------------------
//
// Both parsers answer the same shape, which is one entry of the index format
// PhotoIndex.rgr reads. Keeping them pure is what makes them testable here.

/** A field separator no file name, album name or caption will contain. */
const SEP = "";

/**
 * One line per photograph, as the AppleScript below prints them:
 *
 *   id ␟ filename ␟ date ␟ lat ␟ lon ␟ favorite ␟ album ␟ description
 *
 * Photos gives a date in the machine's own locale, which is not something to
 * parse — so the AppleScript does the arithmetic and prints SECONDS since the
 * Unix epoch instead. A missing value prints as an empty field, and an empty
 * field means "not known", never zero: a photograph at 0,0 and a photograph
 * with no position must not become the same record.
 */
export function parsePhotosLine(line) {
  const f = line.split(SEP);
  if (f.length < 3) return null;
  const [id, filename, secs, lat, lon, fav, album, caption] = f;
  if (!filename) return null;
  const rec = { path: id ? `photos://${id}` : filename, name: filename };
  const t = Number(secs);
  if (secs !== "" && Number.isFinite(t) && t > 0) rec.date = isoFromUnix(t);
  if (lat !== "" && lon !== "" && lat !== undefined && lon !== undefined) {
    const la = Number(lat);
    const lo = Number(lon);
    if (Number.isFinite(la) && Number.isFinite(lo)) {
      rec.lat = la;
      rec.lon = lo;
    }
  }
  if (fav === "true") rec.favorite = true;
  if (album) rec.album = album;
  if (caption) rec.caption = caption;
  return rec;
}

/**
 * `mdls` output for one file, as it prints it:
 *
 *   kMDItemContentCreationDate = 2019-06-23 10:12:33 +0000
 *   kMDItemLatitude            = 61.5084
 *   kMDItemPixelWidth          = 4032
 *   kMDItemAcquisitionModel    = "iPhone 12"
 *   kMDItemLatitude            = (null)
 *
 * Values are bare, quoted, or `(null)`, and a key that is absent altogether is
 * the same as `(null)`. Dates are printed with a UTC offset already applied,
 * which is why they can be taken as written.
 */
export function parseMdls(text, filePath) {
  const out = { path: filePath, name: path.basename(filePath) };
  const fields = {};
  for (const line of text.split("\n")) {
    const eq = line.indexOf("=");
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (value === "(null)" || value === "") continue;
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    fields[key] = value;
  }
  const created = fields.kMDItemContentCreationDate || fields.kMDItemFSCreationDate;
  if (created) {
    // "2019-06-23 10:12:33 +0000" is not ISO; the offset is already applied.
    const iso = created.replace(" ", "T").replace(/ ([+-]\d{4})$/, "Z");
    const when = Date.parse(iso);
    if (Number.isFinite(when)) out.date = isoFromUnix(when / 1000);
  }
  const la = Number(fields.kMDItemLatitude);
  const lo = Number(fields.kMDItemLongitude);
  if (Number.isFinite(la) && Number.isFinite(lo) && fields.kMDItemLatitude && fields.kMDItemLongitude) {
    out.lat = la;
    out.lon = lo;
  }
  const w = Number(fields.kMDItemPixelWidth);
  const h = Number(fields.kMDItemPixelHeight);
  if (w > 0 && h > 0) {
    // Spotlight reports the stored size. A quarter turn in the EXIF means the
    // picture is on its side, and the size a layout needs is the size after
    // the turn — the same correction the Ranger side makes.
    const turned = /^[5-8]$/.test(fields.kMDItemOrientation || "");
    out.w = turned ? h : w;
    out.h = turned ? w : h;
  }
  const make = fields.kMDItemAcquisitionMake || "";
  const model = fields.kMDItemAcquisitionModel || "";
  const camera = model.includes(make) ? model : [make, model].filter(Boolean).join(" ");
  if (camera) out.camera = camera;
  return out;
}

function isoFromUnix(seconds) {
  return new Date(Math.round(seconds) * 1000).toISOString().replace(/\.\d{3}Z$/, "Z");
}

// --- talking to macOS --------------------------------------------------------

function isMac() {
  return os.platform() === "darwin";
}

function run(cmd, args, input) {
  const res = spawnSync(cmd, args, {
    encoding: "utf8",
    input,
    maxBuffer: 256 * 1024 * 1024,
  });
  if (res.error) throw new Error(`${cmd}: ${res.error.message}`);
  if (res.status !== 0) {
    throw new Error(`${cmd} exited ${res.status}: ${(res.stderr || "").trim().slice(0, 400)}`);
  }
  return res.stdout;
}

/**
 * Every photograph Photos.app knows about, one per line.
 *
 * `date` is converted to Unix seconds inside AppleScript rather than printed
 * as text: Photos prints a date in the machine's locale, and parsing that back
 * is a bug per language. `location` is a list of two reals or `missing value`.
 *
 * Album membership costs a second pass — a media item does not know which
 * albums hold it — so it is collected album-first and joined by id.
 */
const PHOTOS_SCRIPT = `
on join(sep, items)
	set out to ""
	repeat with i from 1 to count of items
		if i > 1 then set out to out & sep
		set out to out & (item i of items)
	end repeat
	return out
end join

set sep to (ASCII character 31)
set epoch to (current date)
set year of epoch to 1970
set month of epoch to January
set day of epoch to 1
set time of epoch to 0

tell application "Photos"
	set out to {}
	repeat with m in every media item
		set theId to id of m
		set theName to filename of m
		try
			set secs to (round ((date of m) - epoch)) as string
		on error
			set secs to ""
		end try
		set la to ""
		set lo to ""
		try
			set loc to location of m
			if loc is not missing value then
				set la to (item 1 of loc) as string
				set lo to (item 2 of loc) as string
			end if
		end try
		set fav to "false"
		try
			if favorite of m then set fav to "true"
		end try
		set cap to ""
		try
			if (description of m) is not missing value then set cap to description of m
		end try
		set end of out to join(sep, {theId, theName, secs, la, lo, fav, "", cap})
	end repeat
end tell
return join(linefeed, out)
`;

/** Album name per media item id, so a record can say which album it is in. */
const ALBUMS_SCRIPT = `
on join(sep, items)
	set out to ""
	repeat with i from 1 to count of items
		if i > 1 then set out to out & sep
		set out to out & (item i of items)
	end repeat
	return out
end join

set sep to (ASCII character 31)
tell application "Photos"
	set out to {}
	repeat with a in albums
		set aName to name of a
		repeat with m in (media items of a)
			set end of out to join(sep, {id of m, aName})
		end repeat
	end repeat
end tell
return join(linefeed, out)
`;

function indexFromPhotosApp() {
  const albums = new Map();
  try {
    const text = run("osascript", ["-e", ALBUMS_SCRIPT]);
    for (const line of text.split("\n")) {
      const [id, name] = line.split(SEP);
      if (id && name && !albums.has(id)) albums.set(id, name);
    }
  } catch (e) {
    console.error("  (could not list albums: " + e.message + ")");
  }
  const text = run("osascript", ["-e", PHOTOS_SCRIPT]);
  const photos = [];
  for (const line of text.split("\n")) {
    const rec = parsePhotosLine(line.replace(/\r$/, ""));
    if (!rec) continue;
    const id = rec.path.startsWith("photos://") ? rec.path.slice(9) : "";
    if (id && albums.has(id)) rec.album = albums.get(id);
    photos.push(rec);
  }
  return photos;
}

/** Every file under `dir` with an extension a camera writes. */
function pictureFiles(dir) {
  const wanted = new Set([".jpg", ".jpeg", ".heic", ".heif", ".png", ".tif", ".tiff", ".dng"]);
  const out = [];
  const walk = (at) => {
    let entries = [];
    try {
      entries = fs.readdirSync(at, { withFileTypes: true });
    } catch (_) {
      return;
    }
    for (const e of entries) {
      const full = path.join(at, e.name);
      if (e.isDirectory()) {
        // A .photoslibrary is a package; its originals are inside it, and
        // walking into one is how a folder scan reaches a Photos library
        // without asking Photos.app anything.
        walk(full);
      } else if (wanted.has(path.extname(e.name).toLowerCase())) {
        out.push(full);
      }
    }
  };
  walk(dir);
  return out;
}

const MD_KEYS = [
  "kMDItemContentCreationDate",
  "kMDItemFSCreationDate",
  "kMDItemLatitude",
  "kMDItemLongitude",
  "kMDItemPixelWidth",
  "kMDItemPixelHeight",
  "kMDItemOrientation",
  "kMDItemAcquisitionMake",
  "kMDItemAcquisitionModel",
];

function indexFromFolder(dir) {
  const files = pictureFiles(dir);
  console.log(`  ${files.length} picture file(s) under ${dir}`);
  const photos = [];
  // `mdls` takes many files at once and separates them with a line of dashes;
  // one process per file would spend all its time on process starts.
  const BATCH = 200;
  for (let i = 0; i < files.length; i += BATCH) {
    const batch = files.slice(i, i + BATCH);
    const args = [];
    for (const k of MD_KEYS) args.push("-name", k);
    args.push(...batch);
    let text = "";
    try {
      text = run("mdls", args);
    } catch (e) {
      console.error("  (mdls failed on a batch: " + e.message + ")");
      continue;
    }
    const blocks = text.split(/^-+$/m);
    batch.forEach((file, n) => {
      photos.push(parseMdls(blocks[n] || "", path.relative(dir, file)));
    });
  }
  return photos;
}

// --- converting the chosen ones ---------------------------------------------

/**
 * The chosen photographs as JPEGs the rest of the pipeline can use.
 *
 * `sips` is macOS's own converter and handles HEIC; a picture that is already
 * a JPEG is copied rather than re-encoded, because a second JPEG generation
 * costs quality for nothing. Photos-library items are exported by Photos
 * first, since their originals are inside a package.
 */
function exportSelection(selection, outDir, maxPx) {
  fs.mkdirSync(outDir, { recursive: true });
  const done = [];
  for (const rec of selection.photos || []) {
    const src = rec.path || "";
    const base = (rec.name || path.basename(src)).replace(/\.[^.]+$/, "");
    const dest = path.join(outDir, base + ".jpg");
    try {
      if (src.startsWith("photos://")) {
        exportFromPhotosApp(src.slice(9), outDir);
        const exported = newestIn(outDir, base);
        if (exported && exported !== dest) convert(exported, dest, maxPx);
      } else if (/\.jpe?g$/i.test(src)) {
        fs.copyFileSync(src, dest);
      } else {
        convert(src, dest, maxPx);
      }
      done.push({ ...rec, export: path.basename(dest) });
    } catch (e) {
      console.error(`  could not convert ${rec.name}: ${e.message}`);
    }
  }
  return done;
}

function convert(src, dest, maxPx) {
  const args = ["-s", "format", "jpeg", "-s", "formatOptions", "high"];
  if (maxPx > 0) args.push("-Z", String(maxPx));
  args.push(src, "--out", dest);
  run("sips", args);
}

function exportFromPhotosApp(id, outDir) {
  const script = `
tell application "Photos"
	set m to media item id "${id.replace(/"/g, '\\"')}"
	export {m} to POSIX file "${outDir.replace(/"/g, '\\"')}" using originals false
end tell`;
  run("osascript", ["-e", script]);
}

function newestIn(dir, base) {
  let best = null;
  let bestTime = 0;
  for (const name of fs.readdirSync(dir)) {
    if (!name.startsWith(base)) continue;
    const full = path.join(dir, name);
    const t = fs.statSync(full).mtimeMs;
    if (t > bestTime) {
      bestTime = t;
      best = full;
    }
  }
  return best;
}

// --- the Ranger side ---------------------------------------------------------

function rangerCli(args) {
  const built = path.join(REPO, "gallery/book/bin/book_photos.js");
  if (!fs.existsSync(built)) {
    throw new Error("run `npm run book:photos` once first, so book_photos.js exists");
  }
  const res = spawnSync(process.execPath, [built, ...args], {
    encoding: "utf8",
    cwd: REPO,
    stdio: ["ignore", "inherit", "inherit"],
  });
  if (res.status !== 0) throw new Error("the book engine exited " + res.status);
}

// --- self test ---------------------------------------------------------------

const SAMPLE_PHOTOS_LINES = [
  ["8F4A1C2E-0001/L0/001", "IMG_4021.HEIC", "1561284753", "61.5084", "25.0217", "true", "", "Metsa"].join(SEP),
  ["8F4A1C2E-0002/L0/001", "IMG_4022.HEIC", "1561362062", "", "", "false", "", ""].join(SEP),
  ["8F4A1C2E-0003/L0/001", "scan.tif", "", "", "", "false", "", ""].join(SEP),
  "",
].join("\n");

const SAMPLE_MDLS = `kMDItemAcquisitionMake         = "Apple"
kMDItemAcquisitionModel        = "iPhone 12"
kMDItemContentCreationDate     = 2019-06-23 10:12:33 +0000
kMDItemLatitude                = 61.5084
kMDItemLongitude               = 25.0217
kMDItemOrientation             = 6
kMDItemPixelHeight             = 3024
kMDItemPixelWidth              = 4032`;

const SAMPLE_MDLS_BARE = `kMDItemAcquisitionMake         = (null)
kMDItemAcquisitionModel        = (null)
kMDItemContentCreationDate     = (null)
kMDItemLatitude                = (null)
kMDItemLongitude               = (null)
kMDItemPixelHeight             = 1600
kMDItemPixelWidth              = 2400`;

function selfTest() {
  const results = [];
  const check = (name, ok) => results.push((ok ? "ok   " : "FAIL ") + name);

  const lines = SAMPLE_PHOTOS_LINES.split("\n").map(parsePhotosLine);
  check("a blank line is not a photograph", lines[3] === null);
  const a = lines[0];
  check("the file name is read", a.name === "IMG_4021.HEIC");
  check("the id becomes the path", a.path === "photos://8F4A1C2E-0001/L0/001");
  check("the date is UTC ISO", a.date === "2019-06-23T10:12:33Z");
  check("the position is read", a.lat === 61.5084 && a.lon === 25.0217);
  check("a favourite is marked", a.favorite === true);
  check("the description becomes the caption", a.caption === "Metsa");

  const b = lines[1];
  // The trap this exists to catch: an empty field must not become 0,0, which
  // is a real place off the coast of Ghana and would put every unlocated
  // photograph inside a radius search centred there.
  check("no position is no position, not zero", b.lat === undefined && b.lon === undefined);
  check("and it is still a photograph", b.name === "IMG_4022.HEIC");
  const c = lines[2];
  check("no date is no date", c.date === undefined);

  const m = parseMdls(SAMPLE_MDLS, "/Users/me/Pictures/IMG_4021.HEIC");
  check("mdls: the name comes off the path", m.name === "IMG_4021.HEIC");
  check("mdls: the date is converted", m.date === "2019-06-23T10:12:33Z");
  check("mdls: the position is read", m.lat === 61.5084 && m.lon === 25.0217);
  // Orientation 6 is a quarter turn, so the stored 4032x3024 is a PORTRAIT
  // picture — and orientation is what chooses the page it goes on.
  check("mdls: a turned picture is measured turned", m.w === 3024 && m.h === 4032);
  check("mdls: the make is not repeated", m.camera === "Apple iPhone 12");

  const bare = parseMdls(SAMPLE_MDLS_BARE, "scan.tif");
  check("mdls: (null) is absent, not zero", bare.lat === undefined && bare.date === undefined);
  check("mdls: an untagged picture keeps its size", bare.w === 2400 && bare.h === 1600);

  for (const line of results) console.log("  " + line);
  const passed = results.filter((r) => r.startsWith("ok")).length;
  console.log(`\n  ${passed}/${results.length} parser checks`);
  return passed === results.length;
}

// --- main --------------------------------------------------------------------

function argVal(flag, dflt) {
  const i = process.argv.indexOf(flag);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : dflt;
}
function hasArg(flag) {
  return process.argv.includes(flag);
}

function writeIndex(photos, outDir, root) {
  fs.mkdirSync(outDir, { recursive: true });
  const file = path.join(outDir, "photo-index.json");
  const dated = photos.filter((p) => p.date).length;
  const located = photos.filter((p) => p.lat !== undefined).length;
  fs.writeFileSync(
    file,
    JSON.stringify({ version: 1, root, count: photos.length, photos }, null, 2) + "\n"
  );
  console.log(`  ${photos.length} photograph(s), ${dated} dated, ${located} with a position`);
  console.log("  wrote " + file);
  return file;
}

function main() {
  if (hasArg("--self-test")) {
    console.log("mac_photos.mjs — parser self test (no Mac needed)\n");
    process.exit(selfTest() ? 0 : 1);
  }

  const outDir = path.resolve(argVal("--out", path.join(os.homedir(), "book-photos")));
  const folder = argVal("--folder", "");

  if (!isMac() && !folder) {
    console.error("This needs macOS: it asks Photos.app and Spotlight for the library.");
    console.error("Elsewhere, index a folder of JPEGs with `npm run book:photos` and PhotoScan,");
    console.error("or run --self-test to check the parsers.");
    process.exit(2);
  }

  if (hasArg("--index") || folder) {
    console.log(folder ? `Indexing ${folder}` : "Asking Photos.app for the library…");
    const photos = folder ? indexFromFolder(path.resolve(folder)) : indexFromPhotosApp();
    writeIndex(photos, outDir, folder ? path.resolve(folder) : "photos://");
    if (!hasArg("--book")) {
      console.log("\nNow choose some:");
      console.log(`  npm run book:photos -- -index ${path.join(outDir, "photo-index.json")} \\`);
      console.log("      -from 2019-06-01 -to 2019-08-31 -near 61.5,25.0 -radius 20 -summary");
      return;
    }
  }

  if (hasArg("--book")) {
    const indexFile = path.join(outDir, "photo-index.json");
    const selection = path.join(outDir, "selection.json");
    const jpegDir = path.join(outDir, "photos");
    const query = [];
    for (const flag of ["--from", "--to", "--near", "--radius", "--text", "--limit", "--place"]) {
      const v = argVal(flag, "");
      if (v) query.push("-" + flag.slice(2), v);
    }
    if (hasArg("--favorites")) query.push("-favorites");

    console.log("\nChoosing…");
    rangerCli(["-index", indexFile, ...query, "-select", selection]);

    console.log("\nConverting the chosen ones to JPEG…");
    const chosen = JSON.parse(fs.readFileSync(selection, "utf8"));
    const exported = exportSelection(chosen, jpegDir, parseInt(argVal("--max-px", "4000"), 10));
    // The index the book is built from names the JPEGs, not the originals —
    // and it holds only what was chosen, so nothing unconverted can be placed.
    const bookIndex = path.join(outDir, "selected-index.json");
    fs.writeFileSync(
      bookIndex,
      JSON.stringify({ version: 1, root: jpegDir, count: exported.length, photos: exported }, null, 2) + "\n"
    );
    console.log(`  ${exported.length} converted into ${jpegDir}`);

    console.log("\nLaying it out…");
    rangerCli(["-index", bookIndex, "-images", "photos", "-out", path.join(outDir, "book")]);
    console.log("\nThe book is in " + path.join(outDir, "book"));
    return;
  }

  console.error("Nothing to do. Try --index, --folder DIR, --book, or --self-test.");
  process.exit(2);
}

main();
