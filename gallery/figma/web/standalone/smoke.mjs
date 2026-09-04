/**
 * Headless check that the compiled Fig viewer parses the sample and draws.
 */
import { pathToFileURL } from "node:url";
import { readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const dist = join(here, "dist");
const js = join(dist, "fig_web.js");
if (!existsSync(js)) {
  console.error("missing dist/fig_web.js — run the build first");
  process.exit(1);
}

const require = createRequire(import.meta.url);
// Node has require; the page does not. The bundle must still define FigWeb.
const src = readFileSync(js, "utf8");
const FigWeb = (0, eval)(src + "; FigWeb");
if (typeof FigWeb !== "function") {
  console.error("FigWeb is not a function");
  process.exit(1);
}

const web = new FigWeb();
if (!web.openSample()) {
  console.error("openSample failed:", web.error());
  process.exit(1);
}
if ((web.pageCount() | 0) < 2) {
  console.error("expected two sample pages, got", web.pageCount());
  process.exit(1);
}
const scene = JSON.parse(web.scene());
const cmds = scene.list?.cmds || [];
if (cmds.length < 4) {
  console.error("expected draw commands, got", cmds.length);
  process.exit(1);
}
const stats = JSON.parse(web.stats());
if (stats.ok !== true) {
  console.error("stats.ok is not true", stats);
  process.exit(1);
}
const tree = JSON.parse(web.tree());
if (!tree.children || tree.children.length < 1) {
  console.error("tree has no children");
  process.exit(1);
}
console.log("fig smoke ok — pages", web.pageCount(), "cmds", cmds.length, "nodes", stats.nodes);
