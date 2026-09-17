// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Getting a browser that actually has WebGPU in it, on a machine that has no
// GPU. Shared by `bench.mjs` and `parity.mjs`.
//
// This took longer to find than the painter did, so it is written down.
//
//   * `navigator.gpu` is undefined on an `about:blank` page under Playwright —
//     it is not a secure context there — and present as soon as the page is
//     served over http://127.0.0.1 or file://. A probe that asks on the blank
//     page concludes "no WebGPU in this browser" and is wrong.
//   * With no flags the adapter request resolves to NULL: Chromium finds no
//     Vulkan. The SwiftShader ICD ships beside the binary but is not used
//     unless asked for, and `--use-gl=swiftshader` — which the WebGL checks in
//     this directory pass — is about GL and does nothing for WebGPU.
//   * `--enable-features=Vulkan --use-vulkan=swiftshader --enable-unsafe-webgpu`
//     is the set that works. The adapter then reports itself as
//     "google / swiftshader".
//
// What that gets is a CPU rasteriser behind a real WebGPU implementation:
// every validation rule, every driver call and every byte of upload is the
// genuine article, and only the pixels are drawn by the CPU.

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import { findChromium } from "../../../ui/conformance/dom-adapter.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(HERE, "../../../..");
export const PAGE = "gallery/evg/gl/webgpu/page.html";

export const WEBGPU_ARGS = [
  "--no-sandbox",
  "--disable-gpu-sandbox",
  "--enable-features=Vulkan",
  "--use-vulkan=swiftshader",
  "--enable-unsafe-webgpu",
];

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".ttf": "font/ttf",
  ".png": "image/png",
};

/** Serve the repository: ES modules are fetched, and a fetch needs an origin. */
export function serve(port = 0) {
  const server = http.createServer((req, res) => {
    const rel = decodeURIComponent(req.url.split("?")[0]).replace(/^\/+/, "");
    const file = path.join(ROOT, rel);
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404); res.end("not found"); return;
    }
    res.writeHead(200, { "content-type": MIME[path.extname(file)] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((ok) => server.listen(port, "127.0.0.1", () => ok({ server, port: server.address().port })));
}

/**
 * Open `url` in a Chromium that has WebGPU, wait for the page to set
 * `window[flag]`, and hand back what it set along with everything it logged.
 *
 * `readFrom` names a DIFFERENT global to read, so a page can publish its
 * results as it goes and flip a separate flag when it is finished. What that
 * buys is a partial answer instead of none: under SwiftShader a 50 000-quad
 * scene takes minutes, and a suite that runs out of time used to come back
 * with nothing at all rather than the six scenes it had already measured.
 */
export async function drive(pathAndQuery, flag, { timeout = 900000, readFrom = null } = {}) {
  const { server, port } = await serve();
  const browser = await chromium.launch({ executablePath: findChromium(), args: WEBGPU_ARGS });
  const page = await browser.newPage();
  const log = [];
  page.on("console", (m) => log.push(m.text()));
  page.on("pageerror", (e) => log.push("pageerror: " + String(e)));
  page.on("crash", () => log.push("THE PAGE CRASHED"));
  let result = null;
  try {
    await page.goto(`http://127.0.0.1:${port}/${pathAndQuery}`);
    await page.waitForFunction((f) => !!window[f], flag, { timeout }).catch(() => {});
    result = await page.evaluate((f) => window[f], readFrom || flag).catch(() => null);
  } finally {
    await browser.close();
    server.close();
  }
  return { result, log };
}

export const argOf = (argv) => (name, dflt) => {
  const i = argv.indexOf("--" + name);
  if (i < 0) return dflt;
  return argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : true;
};
