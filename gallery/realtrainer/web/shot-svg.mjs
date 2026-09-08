#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The display list as an SVG — a picture of a frame on a machine with no GPU.
//
//   node gallery/realtrainer/web/shot-svg.mjs --out shots/ --theme ocean
//   node gallery/realtrainer/web/shot-svg.mjs --themes            (all three)
//   node gallery/realtrainer/web/shot-svg.mjs --section rt-nav-home,rt-nav-more
//   node gallery/realtrainer/web/shot-svg.mjs --section rt-nav-settings --keys Tab,Tab,Tab,Tab
//
// The WebGL backend is what draws this app for real, and it needs a browser.
// The display list does not: it is the whole frame as data — rects, borders,
// paths, clips and text runs, in paint order — and every one of those has an
// SVG element behind it. So this is a second backend, deliberately a naive
// one, whose only job is to be LOOKED AT.
//
// It is not a conformance oracle and must not be used as one: text is placed
// by the run's line box rather than by real face metrics, and a stroke is
// SVG's stroke rather than the triangles the GL path builder makes. What it
// gets right is what a picture is for — what is where, in what colour.
//
// Kinds are `EVGCommands`: 0 rect, 1 border, 2 image, 3 text, 4 push clip,
// 5 pop clip, 6 path, 7 stroke.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..");
const require_ = createRequire(import.meta.url);
const BIN = path.join(ROOT, "bin", "RealTrainerDemo.cjs");
if (!fs.existsSync(BIN)) {
  console.error("compiled app missing — run `npm run rt:build` first");
  process.exit(3);
}
const { RealTrainerDemo } = require_(BIN);
const rd = (...p) => fs.readFileSync(path.join(ROOT, ...p), "utf8");

const arg = (name, fallback) => {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const rgba = (c) => {
  const [r, g, b, a] = c || [0, 0, 0, 1];
  return a >= 1 ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},${a})`;
};
const n2 = (v) => Math.round((v || 0) * 100) / 100;

/** `rot` is degrees about (x+rox, y+roy) — the same origin the shader uses. */
const spin = (c) => {
  if (!c.rot) return "";
  const ox = c.x + (c.rox || 0);
  const oy = c.y + (c.roy || 0);
  return ` transform="rotate(${n2(c.rot)} ${n2(ox)} ${n2(oy)})"`;
};

const ringsOf = (c) => {
  const out = [];
  const pts = c.pts || [];
  let start = 0;
  for (const end of c.ends || []) {
    if (end - start >= 4) out.push(pts.slice(start, end));
    start = end;
  }
  return out;
};
const pathData = (rings) =>
  rings
    .map((r) => {
      let d = `M${n2(r[0])} ${n2(r[1])}`;
      for (let i = 2; i + 1 < r.length; i += 2) d += `L${n2(r[i])} ${n2(r[i + 1])}`;
      return d + "Z";
    })
    .join(" ");

function svgOf(cmds, w, h) {
  const out = [];
  const defs = [];
  let clipId = 0;
  // A clip is a group in SVG, so PUSH/POP become <g> open and close. The
  // engine nests them; so does this.
  let open = 0;
  for (const c of cmds) {
    if (c.k === 4) {
      clipId += 1;
      const id = `clip${clipId}`;
      defs.push(
        `<clipPath id="${id}"><rect x="${n2(c.x)}" y="${n2(c.y)}" width="${n2(c.w)}" height="${n2(c.h)}"${c.r ? ` rx="${n2(c.r)}"` : ""}/></clipPath>`,
      );
      out.push(`<g clip-path="url(#${id})">`);
      open += 1;
      continue;
    }
    if (c.k === 5) {
      if (open > 0) { out.push("</g>"); open -= 1; }
      continue;
    }
    if (c.k === 6 || c.k === 7) {
      const rings = ringsOf(c);
      if (!rings.length) continue;
      const d = pathData(rings);
      if (c.k === 7) {
        out.push(`<path d="${d}" fill="none" stroke="${rgba(c.c)}" stroke-width="${n2(c.t || 1)}"${spin(c)}/>`);
      } else {
        out.push(`<path d="${d}" fill="${rgba(c.c)}"${c.eo ? ' fill-rule="evenodd"' : ""}${spin(c)}/>`);
      }
      continue;
    }
    if (c.k === 3) {
      // EVG's y is the top of the LINE BOX and h its height, so the middle of
      // the box is where a central baseline goes. The GL backend uses the real
      // face ascent; this is the approximation named at the top.
      const weight = /bold/i.test(c.font || "") || c.bold ? ' font-weight="bold"' : "";
      const fam = (c.font || "Arial").replace(/\s*bold\s*/i, "").trim() || "Arial";
      out.push(
        `<text x="${n2(c.x)}" y="${n2(c.y + (c.h || 0) / 2)}" fill="${rgba(c.c)}"` +
          ` font-family="${esc(fam)}" font-size="${n2(c.size || 12)}"${weight}` +
          ` dominant-baseline="central" xml:space="preserve"${spin(c)}>${esc(c.text || "")}</text>`,
      );
      continue;
    }
    if (c.k === 2) {
      // No photos in these shots; a placeholder rather than a hole.
      out.push(`<rect x="${n2(c.x)}" y="${n2(c.y)}" width="${n2(c.w)}" height="${n2(c.h)}" fill="rgba(255,255,255,0.06)"${c.r ? ` rx="${n2(c.r)}"` : ""}/>`);
      continue;
    }
    const r = c.r ? ` rx="${n2(c.r)}" ry="${n2(c.r)}"` : "";
    if (c.k === 1) {
      const t = c.t || 1;
      out.push(
        `<rect x="${n2(c.x + t / 2)}" y="${n2(c.y + t / 2)}" width="${n2(Math.max(0, c.w - t))}" height="${n2(Math.max(0, c.h - t))}"${r}` +
          ` fill="none" stroke="${rgba(c.c)}" stroke-width="${n2(t)}"${spin(c)}/>`,
      );
      continue;
    }
    let fill = rgba(c.c);
    if (c.c2) {
      const id = `g${defs.length}`;
      const across = c.gd === 1;
      defs.push(
        `<linearGradient id="${id}" x1="0" y1="0" x2="${across ? 1 : 0}" y2="${across ? 0 : 1}">` +
          `<stop offset="0" stop-color="${rgba(c.c)}"/><stop offset="1" stop-color="${rgba(c.c2)}"/></linearGradient>`,
      );
      fill = `url(#${id})`;
    }
    out.push(`<rect x="${n2(c.x)}" y="${n2(c.y)}" width="${n2(c.w)}" height="${n2(c.h)}"${r} fill="${fill}"${spin(c)}/>`);
  }
  while (open > 0) { out.push("</g>"); open -= 1; }
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
    `<defs>${defs.join("")}</defs>${out.join("")}</svg>`
  );
}

function boot(theme, route, section, w, h) {
  const app = new RealTrainerDemo();
  app.init(rd("web", "realtrainer.css"), rd("fixtures", "session.compact"));
  app.loadPlanMachine(rd("fixtures", "machines", "planDialog.machine.json"));
  app.loadChatMachine(rd("fixtures", "machines", "chat.machine.json"));
  app.loadReference(rd("fixtures", "reference", "seed.json"));
  app.setPageSize(w, h);
  app.openRoute(route);
  if (theme) app.setPalette(theme);
  for (const id of section.split(",")) if (id) app.press(id);
  let spun = 0;
  while (app.building() && spun < 400) { app.tick(16.7); spun += 1; }
  // Keys AFTER the screen has settled, because an arrow is decided from the
  // boxes and a feed that is still arriving has none yet: --keys Tab,Tab
  app.display();
  for (const k of arg("--keys", "").split(",")) if (k) app.keyWith(k, false, false);
  app.display();
  return app;
}

const W = Number(arg("--width", 390));
const H = Number(arg("--height", 844));
const outDir = path.resolve(arg("--out", path.join(HERE, "shots")));
fs.mkdirSync(outDir, { recursive: true });

const wanted = process.argv.includes("--themes")
  ? ["", "ocean", "sunrise"]
  : [arg("--theme", "")];
const section = arg("--section", "rt-nav-home");
const route = arg("--route", "/calendar/cal-train");

for (const theme of wanted) {
  const app = boot(theme, route, section, W, H);
  const cmds = JSON.parse(app.displayListJson()).cmds;
  const name = (theme || "night") + ".svg";
  fs.writeFileSync(path.join(outDir, name), svgOf(cmds, W, H));
  console.log(`  ${path.join(outDir, name)}  ${cmds.length} commands`);
}
