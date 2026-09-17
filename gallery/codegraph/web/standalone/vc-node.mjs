/**
 * vc-node.mjs — run VirtualCompiler from the built CodeGraph bundle, in Node.
 *
 *   node gallery/codegraph/web/standalone/vc-node.mjs [dist]
 *
 * Loads compileEnv.json, analyses examples/calls.rgr, and checks that Order
 * and LineItem landed in the class list. Does not need a browser.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(process.argv[2] || path.join(HERE, "dist"));

function mustRead(rel) {
  const p = path.join(DIST, rel);
  if (!fs.existsSync(p)) {
    throw new Error("missing " + p + " — run: npm run codegraph:web");
  }
  return fs.readFileSync(p, "utf8");
}

async function main() {
  const shim = fs.readFileSync(path.join(HERE, "node-shim.js"), "utf8");
  const bundle = mustRead("codegraph_web.js");
  const env = JSON.parse(mustRead("compileEnv.json"));
  const source = mustRead("examples/calls.rgr");

  (0, eval)(shim);
  (0, eval)(bundle);
  const Cls = globalThis.CodeGraphWeb;
  if (typeof Cls !== "function") {
    console.error("CodeGraphWeb missing after loading the bundle");
    process.exit(1);
  }
  const app = new Cls();
  for (const f of env.filesystem.files || []) {
    app.setRootFile(f.name, f.data);
  }
  const lib = (env.filesystem.folders || []).find((x) => x.name === "lib");
  if (lib) {
    for (const f of lib.files || []) {
      app.setLibFile(f.name, f.data);
    }
  }
  if (!app.hasCompiler()) {
    console.error("Lang.rgr did not install");
    process.exit(1);
  }
  const ok = await Promise.resolve(app.analyzeSource(source, "calls.rgr"));
  const classes = (app.classList() || "").split("\n").filter(Boolean);
  console.log("  vc-node classes: " + classes.join(", "));
  console.log("  vc-node status:  " + app.statusText());
  if (!ok) {
    console.error("analyzeSource returned false");
    process.exit(1);
  }
  if (!classes.includes("Order") || !classes.includes("LineItem") || !classes.includes("Checkout")) {
    console.error("expected Order, LineItem, Checkout from calls.rgr");
    process.exit(1);
  }
  const gallery = JSON.parse(mustRead("gallerySources.json"));
  const packed = gallery.files || gallery;
  for (const name of Object.keys(packed)) {
    app.setGalleryFile(name, packed[name]);
  }
  if (!app.hasGalleryTree()) {
    console.error("gallerySources.json did not install CssCore.rgr");
    process.exit(1);
  }
  const libs = [
    ["css", "CssSheet"],
    ["zip", "ZipReader"],
    ["evg", "EVGElement"],
  ];
  for (const [lib, want] of libs) {
    const lok = await Promise.resolve(app.analyzeGallery(lib));
    const names = (app.classList() || "").split("\n").filter(Boolean);
    console.log("  vc-node " + lib + ": " + names.slice(0, 8).join(", ") + (names.length > 8 ? "…" : ""));
    if (!lok) {
      console.error("analyzeGallery(" + lib + ") failed: " + app.statusText());
      process.exit(1);
    }
    if (!names.includes(want)) {
      console.error("expected " + want + " from " + lib);
      process.exit(1);
    }
    const page = app.pageId();
    if (page !== "class:" + want) {
      console.error("expected page class:" + want + " from " + lib + ", got " + page);
      process.exit(1);
    }
  }
  // The compiler sample, which is how this file would have caught PkgFetch.rgr
  // reaching into pkg/src without the packer following it: the gallery libs
  // all resolve without it, so nothing here failed until the page was opened.
  const compiler = JSON.parse(mustRead("compilerSources.json"));
  for (const [name, data] of Object.entries(compiler.files || compiler)) {
    app.setCompilerFile(name, data);
  }
  if (!app.hasCompilerTree()) {
    console.error("compilerSources.json did not install VirtualCompiler.rgr");
    process.exit(1);
  }
  const cok = await Promise.resolve(app.analyzeCompiler());
  const cnames = (app.classList() || "").split("\n").filter(Boolean);
  console.log("  vc-node compiler: " + cnames.length + " classes");
  if (!cok) {
    console.error("analyzeCompiler failed: " + app.statusText());
    process.exit(1);
  }
  for (const want of ["VirtualCompiler", "PkgFetch", "GitPackIO"]) {
    if (!cnames.includes(want)) {
      console.error("expected " + want + " from the compiler sample");
      process.exit(1);
    }
  }

  console.log("  vc-node OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
