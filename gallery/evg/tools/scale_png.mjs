#!/usr/bin/env node
// Resample a PNG with Chromium, so the speed benchmark has larger inputs
// without committing them.  scale_png.mjs in.png out.png W H
import fs from "node:fs";
import { createRequire } from "node:module";
const [, , src, out, W, H] = process.argv;
const req = createRequire("/opt/node22/lib/node_modules/x");
let chromium;
try { ({ chromium } = req("playwright")); } catch { ({ chromium } = createRequire(import.meta.url)("playwright")); }
const exe = process.env.PLAYWRIGHT_CHROMIUM || "/opt/pw-browsers/chromium";
const b = await chromium.launch(fs.existsSync(exe) ? { executablePath: exe, args: ["--no-sandbox"] } : { args: ["--no-sandbox"] });
const p = await b.newPage({ viewport: { width: +W, height: +H }, deviceScaleFactor: 1 });
await p.setContent(`<style>html,body{margin:0}img{display:block;width:${W}px;height:${H}px}</style>` +
  `<img src="data:image/png;base64,${fs.readFileSync(src).toString("base64")}">`);
await p.waitForTimeout(200);
fs.writeFileSync(out, await p.screenshot({ type: "png", clip: { x: 0, y: 0, width: +W, height: +H } }));
await b.close();
