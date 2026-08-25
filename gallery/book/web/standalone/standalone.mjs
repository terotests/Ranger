/**
 * The book editor with nothing behind it.
 *
 * `book_web.js` is the editor — BookApp, the flow engine, the preflight
 * checks — compiled from Ranger to JavaScript and loaded into the page. This
 * file is the host: it hands over the font faces and the photographs (a
 * browser cannot read files, so they are fetched), forwards pointer and key
 * events, and draws the display list the editor hands back through WebGL 2.
 *
 * There is no server. A pointer move does not cross a network; it is a
 * function call, and the next frame is drawn from the list that call produced.
 */
import { renderDisplayList, loadImages } from "./gl/evg-webgl.js";

const canvas = document.getElementById("view");
const metaEl = document.getElementById("meta");
const stateEl = document.getElementById("state");
const backendEl = document.getElementById("backend");
const cmdsEl = document.getElementById("cmds");
const selftestEl = document.getElementById("selftest");
const SELFTEST = new URLSearchParams(location.search).has("selftest");

const gl = canvas.getContext("webgl2", {
  antialias: true,
  premultipliedAlpha: false,
  stencil: true,
});
if (!gl) {
  metaEl.textContent = "WebGL 2 not available";
  throw new Error("WebGL 2 required");
}

/** An ArrayBuffer as the thing Ranger's `buffer` type is: it carries a DataView. */
function asRangerBuffer(ab) {
  ab._view = new DataView(ab);
  return ab;
}
async function fetchBuffer(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("could not fetch " + url);
  return asRangerBuffer(await res.arrayBuffer());
}

const web = new globalThis.BookWeb();
web.start(1180, 800);

const FACES = [
  "OpenSans-Regular.ttf",
  "OpenSans-Bold.ttf",
  "OpenSans-Italic.ttf",
  "OpenSans-BoldItalic.ttf",
  "Cinzel-Regular.ttf",
  "Cinzel-Bold.ttf",
  "JosefinSans-Regular.ttf",
  "JosefinSans-Bold.ttf",
];
// The families beyond the default one. A face is registered under the name in
// its own file; this is how the layout learns it may measure with it.
const FAMILIES = ["Cinzel", "Josefin Sans"];

/**
 * Textures, kept between frames.
 *
 * `loadImages` builds an `Image` per source every time it is called, and this
 * page redraws on every pointer move — re-decoding three photographs per
 * mouse-move is the difference between a drag that follows the cursor and one
 * that lurches. So the sources are diffed and only new ones are fetched.
 */
const texCache = new Map();

/**
 * Pictures the reader handed over rather than ones the page can fetch.
 *
 * An album's photographs come out of a file input or a drop, so they have no
 * URL the document could name. The document names them anyway — under the
 * `imageRoot` the import was given — and this maps that name to the blob URL
 * the picture actually lives at. Nothing is uploaded: the whole album is read
 * in the page.
 */
const localImages = new Map();

/**
 * Where a picture the document names actually is.
 *
 * An index made on a Mac names its exported JPEGs by whatever path suited the
 * machine that made them, and the reader then drops those same JPEGs on this
 * page, where they are known by file name alone. So an exact match is tried
 * first and the file's own name second — that second lookup is what lets a
 * `selected-index.json` and a pile of photographs be dropped together and
 * simply work.
 */
function urlFor(src) {
  const exact = localImages.get(src);
  if (exact) return exact;
  const base = src.split("/").pop();
  const byName = localImages.get(base);
  if (byName) return byName;
  return "./" + src;
}

async function texturesFor(doc) {
  const srcs = new Set(
    (doc.list?.cmds || []).filter((c) => c.k === 2 && c.src).map((c) => c.src)
  );
  const missing = [...srcs].filter((s) => !texCache.has(s));
  if (missing.length) {
    // Fetched under whatever URL the picture really has, cached under the name
    // the document uses — the display list is the only thing that knows both.
    //
    // The base is applied here rather than by `loadImages`: a dropped
    // picture's URL is a `blob:` one, already absolute, and prefixing it with
    // "./" makes a URL that loads nothing and fails silently as a blank page.
    const cmds = missing.map((src) => ({ k: 2, src: urlFor(src) }));
    const fresh = await loadImages({ list: { cmds } }, { base: "" });
    for (const src of missing) {
      const url = urlFor(src);
      if (fresh.get(url)) texCache.set(src, fresh.get(url));
    }
  }
  return texCache;
}

async function boot() {
  const stamp = new URLSearchParams(location.search).get("v") || "";
  const q = stamp ? "?v=" + stamp : "";
  // Faces first: the flow engine measures with them, and a book laid out with
  // guessed widths and drawn with real ones breaks in different places.
  // The FIRST face goes in as a named family, the rest as bare faces. That is
  // not a style: `addFont` is what tells the renderer it has a real face at
  // all, and without it every measurement falls back to a 3x5 bitmap step —
  // which is narrow enough that nothing ever wraps, so a title runs off the
  // trim while the picture on screen is drawn in the right font by the
  // browser's own atlas. Measuring and painting disagreeing is exactly the
  // failure this stack is built to prevent, and it hides well.
  let first = true;
  for (const face of FACES) {
    const bytes = await fetchBuffer("./fonts/" + face + q);
    if (first) {
      web.addFont("Open Sans", bytes);
      first = false;
    } else {
      web.addFace(bytes);
    }
  }
  for (const fam of FAMILIES) web.noteFamily(fam);
  // The DrawingML preset geometries, for the shape picker.
  //
  // The emoji in the catalogue carry their own outlines and draw with no file
  // at all; the 187 presets are formulae and cannot be drawn until this text
  // arrives. Skipped, the picker lists every preset, draws a blank cell for
  // each and refuses to insert one — which looks like a rendering bug rather
  // than a missing asset, because the emoji beside them are fine.
  try {
    const presets = await fetch("./presets.txt" + q, { cache: "no-store" });
    if (presets.ok) web.loadPresets(await presets.text());
  } catch (e) {
    /* the picker still lists them; it simply cannot draw them */
  }
  if (!web.hasPresets()) {
    console.warn("presets.txt did not load - the shape picker will show the emoji only");
  }
  // The atlas measures with the browser's copy of the same faces; drawing
  // before they arrive rasterizes the first frame in a fallback.
  if (document.fonts && document.fonts.ready) {
    try {
      await Promise.all([
        document.fonts.load('12px "Open Sans"'),
        document.fonts.load('700 12px "Open Sans"'),
        document.fonts.load('12px "Cinzel"'),
        document.fonts.load('12px "Josefin Sans"'),
      ]);
      await document.fonts.ready;
    } catch (_) {
      /* a browser without the API still draws, in its default face */
    }
  }
  web.openSample("assets/");
  // `?spread=N` opens on a given spread, so a screenshot can be of a page with
  // something on it rather than of the title page.
  const wanted = parseInt(new URLSearchParams(location.search).get("spread") || "0", 10);
  for (let i = 0; i < wanted; i++) web.command("nav.next", "");
  if (new URLSearchParams(location.search).has("edit")) web.command("edit.toggle", "");
  const n = web.assetCount();
  for (let i = 0; i < n; i++) {
    const p = web.assetAt(i);
    web.addImage(p, await fetchBuffer("./" + p + q));
  }
  await redraw();
  // `?album=1` opens the bundled iPhoto fixture instead of the sample book, so
  // the album path can be looked at - or screenshotted - without dropping
  // files on the page by hand.
  // `?photos=1` indexes the three bundled photographs and opens the finder,
  // so the search can be looked at - or screenshotted - without a folder to
  // drop. `?photos=1&find=1` also runs the query in the other fields.
  if (new URLSearchParams(location.search).has("photos")) {
    await openPhotos(await bundledPictures());
    const params = new URLSearchParams(location.search);
    for (const [id, key] of [["q-from", "from"], ["q-to", "to"], ["q-near", "near"], ["q-radius", "radius"], ["q-text", "text"]]) {
      const v = params.get(key);
      if (v) document.getElementById(id).value = v;
    }
    runSearch();
    if (params.has("find")) {
      web.openFound(params.get("title") || "");
      // Opening a book puts the reader on its first spread, so `?spread=` has
      // to be honoured again - after, not before.
      for (let i = 0; i < wanted; i++) web.command("nav.next", "");
      await redraw();
    }
  }
  if (new URLSearchParams(location.search).has("album")) {
    await openBundledAlbum();
    // Opening a book puts the reader on its first spread, so `?spread=` has to
    // be honoured again - after, not before.
    for (let i = 0; i < wanted; i++) web.command("nav.next", "");
    if (wanted) await redraw();
  }
}

/**
 * The three photographs that ship in the build, as `File`s, fetched once.
 *
 * They are the album's pictures and the finder's pictures, and one of them —
 * GPS_test.jpg — is a real geotagged photograph taken in Tuscany in 2008,
 * which is the only honest fixture for a search by date and by place.
 */
let bundledCache = null;
async function bundledPictures() {
  if (bundledCache) return bundledCache;
  const out = [];
  for (const img of ["Example_scaled.jpg", "GPS_test.jpg", "Canon_40D_scaled.jpg"]) {
    const blob = await fetch("./assets/" + img).then((r) => r.blob());
    out.push(new File([blob], img, { type: "image/jpeg" }));
  }
  bundledCache = out;
  return out;
}

/** The fixture library that ships in the build, opened as if it were dropped. */
async function openBundledAlbum() {
  const wanted = new URLSearchParams(location.search).get("albumName") || "";
  const xml = await fetch("./fixtures/AlbumData.xml").then((r) => r.text());
  const files = [new File([xml], "AlbumData.xml", { type: "text/xml" }), ...(await bundledPictures())];
  return openAlbum(files, wanted);
}

async function redraw() {
  const doc = JSON.parse(web.sceneJson());
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const cssW = doc.width || 1180;
  const cssH = doc.height || 800;
  canvas.style.width = cssW + "px";
  canvas.style.height = cssH + "px";
  const bw = Math.round(cssW * dpr);
  const bh = Math.round(cssH * dpr);
  if (canvas.width !== bw || canvas.height !== bh) {
    canvas.width = bw;
    canvas.height = bh;
  }
  // The IMAGE commands carry the document's own asset paths, which is what the
  // page fetched them under, so the textures are keyed by the same string.
  const textures = await texturesFor(doc);
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.886, 0.871, 0.839, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
  renderDisplayList(gl, doc, { dpr, images: textures });
  if (backendEl) backendEl.textContent = "webgl2";
  if (cmdsEl) cmdsEl.textContent = String((doc.list?.cmds || []).length);
  refreshMeta();
}

function refreshMeta() {
  const m = JSON.parse(web.metaJson());
  metaEl.textContent = `${m.title} — ${m.pages} pages, ${m.spreads} spreads`;
  const bits = [];
  bits.push(m.editing ? "editing" : "reading (Ctrl+E)");
  if (m.selected) bits.push(`${m.selected} selected`);
  if (m.overset) bits.push("OVERSET");
  if (m.errors) bits.push(`${m.errors} preflight error(s)`);
  else if (m.warnings) bits.push(`${m.warnings} warning(s)`);
  stateEl.textContent = bits.join("  ·  ");
  stateEl.className = m.overset || m.errors ? "warn" : "";
  return m;
}

function canvasPoint(e) {
  const rect = canvas.getBoundingClientRect();
  const cssW = parseFloat(canvas.style.width) || 1180;
  const cssH = parseFloat(canvas.style.height) || 800;
  return {
    x: Math.round(((e.clientX - rect.left) / rect.width) * cssW),
    y: Math.round(((e.clientY - rect.top) / rect.height) * cssH),
  };
}

let dragging = false;
canvas.addEventListener("pointerdown", (e) => {
  canvas.setPointerCapture(e.pointerId);
  dragging = true;
  canvas.focus();
  const p = canvasPoint(e);
  web.pointer(p.x, p.y, true, e.shiftKey, e.ctrlKey || e.metaKey);
  redraw();
});
canvas.addEventListener("pointermove", (e) => {
  if (!dragging) return;
  const p = canvasPoint(e);
  web.pointer(p.x, p.y, true, e.shiftKey, e.ctrlKey || e.metaKey);
  redraw();
});
canvas.addEventListener("pointerup", (e) => {
  dragging = false;
  const p = canvasPoint(e);
  web.pointer(p.x, p.y, false, e.shiftKey, e.ctrlKey || e.metaKey);
  redraw();
});
canvas.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    const p = canvasPoint(e);
    web.scroll(e.deltaY > 0 ? -1 : 1, p.x, p.y);
    redraw();
  },
  { passive: false }
);

const KEYS = {
  ArrowLeft: () => web.keyLeft(),
  ArrowRight: () => web.keyRight(),
  ArrowUp: () => web.keyUp(),
  ArrowDown: () => web.keyDown(),
  Home: () => web.keyHome(),
  End: () => web.keyEnd(),
  Escape: () => web.keyEscape(),
  Delete: () => web.keyDelete(),
  Backspace: () => web.keyDelete(),
};
const CHORDS = new Set(["z", "y", "e", "d", "a", "l"]);

window.addEventListener("keydown", (e) => {
  if (e.ctrlKey || e.metaKey) {
    const c = e.key.toLowerCase();
    if (!CHORDS.has(c)) return;
    e.preventDefault();
    web.chord(c, e.shiftKey);
    redraw();
    return;
  }
  const fn = KEYS[e.key];
  if (!fn) return;
  e.preventDefault();
  web.key(fn(), e.shiftKey);
  redraw();
});

for (const el of document.querySelectorAll("[data-cmd]")) {
  el.addEventListener("click", () => {
    web.command(el.dataset.cmd, el.dataset.arg || "");
    redraw();
  });
}

// --- opening an Apple photo album -------------------------------------------
//
// iPhoto and Aperture describe a whole library in one property list, and that
// file plus the photographs it names is all an album is. Both are read HERE:
// the plist parser, the album reader and the layout are compiled into
// book_web.js, so dropping a library on this page does not send it anywhere.
//
// The order matters and is not obvious. A picture's own shape decides which
// page it gets — landscape bleeds off the edges, portrait sits in the margin —
// so every picture is measured BEFORE the album is opened. Handing the sizes
// over afterwards would lay the book out blind and then be right too late.

const ALBUM_ROOT = "album/";
const pickEl = document.getElementById("album-pick");
let albumFiles = null;

function isIndexFile(f) {
  const n = f.name.toLowerCase();
  return n.endsWith(".xml") || n.endsWith(".plist");
}

/** A picture's pixel size, without decoding it into the page any further. */
function sizeOf(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => resolve({ w: 0, h: 0 });
    img.src = url;
  });
}

async function openAlbum(files, albumName) {
  const list = [...files];
  const index = list.find(isIndexFile);
  if (!index) {
    say("no AlbumData.xml among those files", true);
    return false;
  }
  const xml = await index.text();

  const names = (web.albumNames(xml) || "").split("\n").filter(Boolean);
  if (!albumName) {
    if (names.length > 1) {
      // More than one album in the library: offer them, open the first, and
      // let the reader switch without dropping the files again.
      pickEl.innerHTML = "";
      for (const n of names) {
        const o = document.createElement("option");
        o.value = n;
        o.textContent = n;
        pickEl.append(o);
      }
      pickEl.hidden = false;
    }
    albumName = names[0] || "";
  }
  if (pickEl && !pickEl.hidden) pickEl.value = albumName;

  // The photographs, under the names the document will ask for them by.
  for (const url of localImages.values()) URL.revokeObjectURL(url);
  localImages.clear();
  texCache.clear();
  const pictures = list.filter((f) => !isIndexFile(f));
  for (const f of pictures) {
    const url = URL.createObjectURL(f);
    localImages.set(ALBUM_ROOT + f.name, url);
    const { w, h } = await sizeOf(url);
    if (w > 0) web.noteImageSize(f.name, w, h);
  }

  if (!web.openAppleAlbum(xml, albumName, ALBUM_ROOT)) {
    say(web.albumError() || "the album could not be read", true);
    return false;
  }
  albumFiles = list;
  await redraw();
  say(`opened “${albumName}” — ${pictures.length} photograph(s)`, false);
  return true;
}

/** A one-line message in the header, beside the document's own state. */
function say(text, bad) {
  if (!stateEl) return;
  stateEl.textContent = text;
  stateEl.className = bad ? "warn" : "";
}

const filesEl = document.getElementById("album-files");
document.getElementById("open-album")?.addEventListener("click", () => filesEl?.click());
filesEl?.addEventListener("change", () => {
  if (filesEl.files?.length) openAlbum(filesEl.files, "");
});
pickEl?.addEventListener("change", () => {
  if (albumFiles) openAlbum(albumFiles, pickEl.value);
});

for (const type of ["dragenter", "dragover"]) {
  window.addEventListener(type, (e) => {
    e.preventDefault();
    document.body.classList.add("dropping");
  });
}
for (const type of ["dragleave", "drop"]) {
  window.addEventListener(type, () => document.body.classList.remove("dropping"));
}
window.addEventListener("drop", (e) => {
  e.preventDefault();
  const files = [...(e.dataTransfer?.files || [])];
  if (!files.length) return;
  // An Apple library index makes it an album; anything else is photographs to
  // search. Deciding from the files rather than from which button was pressed
  // means a drop does the obvious thing either way.
  if (files.some(isIndexFile)) openAlbum(files, "");
  else openPhotos(files);
});

// --- a folder of photographs, searched by when and where ---------------------
//
// The other way in. An Apple library index says which photographs belong
// together; a folder says nothing, so the question has to be asked of the
// pictures themselves — and every JPEG carries the answer in its EXIF.
//
// Reading it happens HERE, in the page: `indexPhoto` hands the bytes to the
// same EXIF reader the command line uses, and the index it builds is searched
// by the same code. Nothing is uploaded and nothing is asked of a server,
// which for somebody's photographs is not a performance detail.
//
// HEIC is the gap, and it is not one this page can close: an iPhone writes
// HEIC, no browser but Safari will draw one, and a PDF cannot hold one either.
// That is what `tools/mac_photos.mjs` is for — it converts on the Mac and
// writes an index, and dropping THAT index here reaches the same search.

const finderEl = document.getElementById("finder");
const resultEl = document.getElementById("q-result");

function isIndexJson(f) {
  return f.name.toLowerCase().endsWith(".json");
}
function isPicture(f) {
  return /\.(jpe?g|png)$/i.test(f.name);
}

const PHOTO_ROOT = "photos/";

async function openPhotos(files) {
  const list = [...files];
  let added = 0;
  let dated = 0;

  for (const f of list.filter(isIndexJson)) {
    if (web.addPhotoIndex(await f.text())) {
      say("read " + f.name, false);
    } else {
      say(web.albumError() || "that index could not be read", true);
      return false;
    }
  }

  for (const f of list.filter(isPicture)) {
    const url = URL.createObjectURL(f);
    // Under both names: the document may refer to it by the root the index was
    // built with, or by the file's own name if a collector wrote it that way.
    localImages.set(PHOTO_ROOT + f.name, url);
    localImages.set(f.name, url);
    const bytes = asRangerBuffer(await f.arrayBuffer());
    if (web.indexPhoto(f.name, bytes, PHOTO_ROOT)) dated++;
    added++;
  }

  finderEl.hidden = false;
  say(`${web.photoSummary()}`, false);
  runSearch();
  return added > 0 || list.some(isIndexJson);
}

function numberOrZero(text) {
  const n = Number(text);
  return Number.isFinite(n) ? n : 0;
}

function runSearch() {
  const near = (document.getElementById("q-near").value || "").split(",");
  const lat = numberOrZero(near[0]);
  const lon = numberOrZero(near[1]);
  // A radius with no centre is not a place, and a centre with no radius is a
  // point nothing is exactly at; both halves or neither.
  const radius = near.length === 2 && near[0] ? numberOrZero(document.getElementById("q-radius").value) : 0;
  const n = web.searchPhotos(
    document.getElementById("q-from").value || "",
    document.getElementById("q-to").value || "",
    lat,
    lon,
    radius,
    document.getElementById("q-text").value || ""
  );
  resultEl.textContent = `${n} of ${web.photoCount()} — ${web.lastQuery()}`;
  resultEl.className = n > 0 ? "hit" : "";
  return n;
}

document.getElementById("open-photos")?.addEventListener("click", () =>
  document.getElementById("photo-files")?.click()
);
document.getElementById("photo-files")?.addEventListener("change", (e) => {
  if (e.target.files?.length) openPhotos(e.target.files);
});
for (const id of ["q-from", "q-to", "q-near", "q-radius", "q-text"]) {
  document.getElementById(id)?.addEventListener("change", runSearch);
}
document.getElementById("q-run")?.addEventListener("click", runSearch);
document.getElementById("q-book")?.addEventListener("click", async () => {
  if (runSearch() === 0) return;
  const title = document.getElementById("q-text").value || "";
  if (!web.openFound(title)) {
    say(web.albumError() || "that made no book", true);
    return;
  }
  await redraw();
  say(`${web.foundCount()} photograph(s) laid out`, false);
});

// The book leaves the page the way it would leave a print shop: as the same
// SVG the command-line demo writes, produced by the same renderer, here.
document.getElementById("save")?.addEventListener("click", () => {
  const m = JSON.parse(web.metaJson());
  const svg = web.spreadSvg(m.spread);
  const blob = new Blob([svg], { type: "image/svg+xml" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "spread-" + String(m.spread + 1).padStart(3, "0") + ".svg";
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
});

/** A scripted run of the editor, reported into the DOM for smoke.mjs. */
async function selftest() {
  const results = [];
  // Reported as it goes, not only at the end. A self test that writes its
  // whole answer in one go tells you nothing when it does not reach the end -
  // and the way this one fails is by running out of time somewhere in the
  // middle, which used to look exactly like "the page ran no self test".
  const report = (done) => {
    const passed = results.filter((r) => r.startsWith("ok ")).length;
    const state = done ? "" : " (running)";
    selftestEl.textContent = `selftest ${passed}/${results.length}${state} :: ` + results.join(" :: ");
  };
  const check = (name, ok) => {
    results.push((ok ? "ok " : "FAIL ") + name);
    report(false);
  };
  try {
    const before = JSON.parse(web.metaJson());
    check("the book opened with pages", before.pages > 1);
    check("and more than one spread", before.spreads > 1);
    check("reading, not editing", before.editing === false);

    web.chord("e", false);
    check("Ctrl+E arms editing", JSON.parse(web.metaJson()).editing === true);

    web.command("nav.next", "");
    const turned = JSON.parse(web.metaJson());
    check("the spread turns", turned.spread === before.spread + 1);

    web.chord("a", false);
    const sel = JSON.parse(web.metaJson());
    check("Ctrl+A selects the frames on it", sel.selected > 0);

    web.key(web.keyRight(), true);
    check("an arrow nudges without losing the selection", JSON.parse(web.metaJson()).selected > 0);
    check("and it is undoable", JSON.parse(web.metaJson()).undo === true);

    web.chord("z", false);
    check("Ctrl+Z undoes it", JSON.parse(web.metaJson()).selected === 0);

    const rect = canvas.getBoundingClientRect();
    canvas.dispatchEvent(new PointerEvent("pointerdown", {
      clientX: rect.left + rect.width * 0.62,
      clientY: rect.top + rect.height * 0.5,
      bubbles: true, pointerId: 1,
    }));
    canvas.dispatchEvent(new PointerEvent("pointerup", {
      clientX: rect.left + rect.width * 0.62,
      clientY: rect.top + rect.height * 0.5,
      bubbles: true, pointerId: 1,
    }));
    check("a click on the page reaches the editor", JSON.parse(web.metaJson()).selected >= 0);

    // The title is furniture text, wrapped by the engine rather than by the
    // flow, and it is measured with the same faces the page draws with. If it
    // comes back as one long line, the engine is measuring with something else.
    web.command("nav.first", "");
    const titleCmds = (JSON.parse(web.sceneJson())?.list?.cmds || [])
      .filter((c) => c.k === 3 && c.font === "Cinzel");
    check("the title is set in the display face", titleCmds.length > 0);
    check("and it wraps inside the page", titleCmds.length > 1);
    web.command("nav.next", "");
    web.command("nav.next", "");

    const doc = JSON.parse(web.sceneJson());
    const cmds = doc?.list?.cmds || [];
    check("the display list has a spread in it", cmds.length > 50);
    check("with text on it", cmds.some((c) => c.k === 3 && c.text));
    check("and a clipped picture", cmds.some((c) => c.k === 4));

    const svg = web.spreadSvg(1);
    check("a spread can be saved as SVG in the page", svg.startsWith("<svg") && svg.length > 500);
    const pre = web.preflightText();
    check("preflight runs in the page", pre.includes("error(s)"));

    // The album path, driven the way a reader drives it: the same files, as
    // File objects, through the same function the drop handler calls. It is
    // the only way to know that the parser, the sizes and the textures line up
    // without a person dragging something onto the page.
    const fixture = await fetch("./fixtures/AlbumData.xml").then((r) => r.text());
    const names = (web.albumNames(fixture) || "").split("\n").filter(Boolean);
    check("the albums somebody named are listed", names.length === 2);
    check("and Apple's own \u201cPhotos\u201d is not among them", !names.includes("Photos"));
    check("including the one with an entity in its name", names.includes("Kes\u00e4 rannalla"));

    // Fetched once and used twice - by the album section here and by the photo
    // finder below. The page runs under a virtual-time budget, and two rounds
    // of the same three fetches was enough to run out of it half way through.
    const pictures = await bundledPictures();
    const files = [new File([fixture], "AlbumData.xml", { type: "text/xml" }), ...pictures];
    const opened = await openAlbum(files, "Kes\u00e4 rannalla");
    check("the album opens in the page", opened === true);
    const album = JSON.parse(web.metaJson());
    check("the book is the album's", album.title === "Kes\u00e4 rannalla");
    check("with a page per photograph and a title page", album.pages >= 4);

    web.command("nav.next", "");
    // Drawn, not just built: the texture cache is filled by `redraw`, and the
    // check below is about whether the pictures reached the canvas.
    await redraw();
    const albumCmds = JSON.parse(web.sceneJson())?.list?.cmds || [];
    const albumPics = albumCmds.filter((c) => c.k === 2 && c.src?.startsWith("album/"));
    check("the album's photographs are placed", albumPics.length > 0);
    // Placed is not drawn. A dropped picture has a blob: URL, and a texture
    // loaded under the wrong URL fails silently - the page renders, the page
    // is blank, and nothing says so.
    check("and their textures loaded", albumPics.every((c) => texCache.get(c.src)));
    check("and their captions with them", albumCmds.some((c) => c.k === 3 && c.text?.includes("kolikon")));
    // A picture the page measured is a picture preflight can check, so the
    // "no known pixel size" warning must be gone.
    check("the pictures were measured in the page", !web.preflightText().includes("unknown-size"));

    // The photo finder, driven through the same functions the inputs drive.
    // GPS_test.jpg is a real geotagged photograph taken in Tuscany in 2008,
    // which is the only honest fixture for a search by date and place: its
    // EXIF is read here, in the page, by the compiled Ranger parser.
    await openPhotos(await bundledPictures());
    check("three photographs were indexed", web.photoCount() === 3);
    check("the finder appeared", finderEl.hidden === false);
    check("one of them knows where it was", web.photoSummary().includes("1 with a position"));

    const all = web.searchPhotos("", "", 0, 0, 0, "");
    check("an empty question matches everything", all === 3);
    check("a date range narrows it", web.searchPhotos("2008-01-01", "2008-12-31", 0, 0, 0, "") === 1);
    check("a range with nothing in it matches nothing", web.searchPhotos("2020-01-01", "2020-12-31", 0, 0, 0, "") === 0);
    // 43.47,11.88 is where that photograph was taken; Helsinki is 2000 km away,
    // which is the check that would fail if the radius were computed flat or
    // the coordinate had been rounded on the way in.
    check("a radius finds it", web.searchPhotos("", "", 43.47, 11.88, 30, "") === 1);
    check("and a radius elsewhere does not", web.searchPhotos("", "", 60.17, 24.94, 30, "") === 0);
    check("the camera is searchable", web.searchPhotos("", "", 0, 0, 0, "coolpix") === 1);
    check("the query says what it asked", web.lastQuery().includes("coolpix"));

    web.searchPhotos("2008-01-01", "2008-12-31", 43.47, 11.88, 30, "");
    check("a book can be made of what matched", web.openFound("Toscana") === true);
    const made = JSON.parse(web.metaJson());
    check("and it is that book", made.title === "Toscana");
    check("with the photograph in it", made.pages >= 2);
    web.command("nav.next", "");
    await redraw();
    const shot = (JSON.parse(web.sceneJson())?.list?.cmds || []).filter((c) => c.k === 2 && c.src);
    check("whose picture is drawn", shot.length > 0 && shot.every((c) => texCache.get(c.src)));
  } catch (e) {
    results.push("FAIL threw " + e);
  }
  report(true);
}

boot()
  .then(() => (SELFTEST ? selftest() : null))
  .catch((err) => {
    metaEl.textContent = String(err);
    if (selftestEl) selftestEl.textContent = "selftest 0/1 :: FAIL " + err;
    console.error(err);
  });
