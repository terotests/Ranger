/**
 * parity.mjs — the two painters, given the same display list, compared as pixels.
 *
 * The claim this directory makes is that a backend is a SWAP: `evg-html.js`
 * and `evg-webgl.js` are handed the same `EVGDisplayList` output and are
 * supposed to put the same picture on the screen. Two screenshots side by side
 * are how that claim gets believed and not how it gets checked — the eye
 * forgives a border on the wrong side of an edge, a baseline a pixel high and
 * a gradient running the wrong way, and those are exactly the mistakes a second
 * painter makes.
 *
 *   scene ─┬─► evg-webgl.js ─► canvas A ─┐
 *          └─► evg-html.js  ─► canvas B ─┴─► |A - B|
 *
 * TWO SCENES, AND THE REASON FOR THE SECOND ONE. The first version of this file
 * ran over the deck alone and passed, at a budget of 3%, under three
 * deliberately broken versions of the painter:
 *
 *     baseline drawn without the half-leading    1.593%   passed
 *     border centred on its edge, not inset      0.483%   passed
 *     gradient direction flipped                 0.113%   passed — UNCHANGED
 *
 * Two lessons, and they are different lessons. The budget was picked out of the
 * air and was fourteen times the noise floor, so it forgave everything; that is
 * fixed by measuring the floor and setting the budget just above it. But the
 * gradient mutation moved the number by NOTHING, and no threshold can fix that:
 * the deck has no gradient-filled RECT in it, so that branch of the painter was
 * never executed and the check was not weak about it, it was blind to it.
 *
 * So `FEATURES` is a display list written by hand to touch every command kind
 * and every flag — per-corner radii, both gradient directions, a rotation about
 * a given origin, an even-odd path with a hole in it, nested clips, a mirrored
 * image — and the deck stays as the second scene, because a hand-written list
 * only exercises what its author remembered.
 *
 * WHY THE FONTS ARE EMBEDDED. The SVG is rasterised by loading it into an
 * `<img>`, and an image is a document of its own: it may not reach the page's
 * fonts, its stylesheets or the network. A face it cannot find is silently
 * substituted, and the diff then measures Chrome's default sans against Open
 * Sans rather than measuring the two painters. The faces travel inside the
 * markup as data URIs for that reason alone.
 *
 * WHAT THE THRESHOLD MEANS. A signed distance field and a browser's rasteriser
 * do not antialias identically and never will, so a per-pixel exact match is
 * not the goal and would be a worse test for pretending otherwise — it would
 * fail on every frame and therefore say nothing about any of them. A pixel
 * counts as different when a channel is off by more than 60, which is a shape
 * in the wrong place rather than a soft edge, and the budget is set from the
 * measured floor.
 *
 *   node gallery/pptx/web/html/parity.mjs [--port 8887] [--max 0.35]
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..", "..");
const DIST = path.join(HERE, "dist");

function argVal(flag, dflt) {
  const i = process.argv.indexOf(flag);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : dflt;
}
const PORT = parseInt(argVal("--port", "8887"), 10);
/**
 * The budget, per scene, over the whole eroded frame.
 *
 * Measured floor: 0.000% on every slide of the deck and 0.022% on the feature
 * sheet — and that last figure is not this painter's error. It is the GL
 * backend's PATH fill, which goes through a stencil with no antialiasing at
 * all, so the triangle in the feature sheet has stepped edges two pixels deep
 * where the SVG has smooth ones. The DOM painter is the better of the two
 * there, and the number counts it as a disagreement because a difference is
 * all it can see.
 *
 * 0.08% is four times the floor and half the smallest defect this file has been
 * shown to catch. The fourteen mutations run against it, worst scene each:
 *
 *     clip replaces instead of nesting        1.925%
 *     image stretched, not cover-cropped      1.868%
 *     gradient direction flipped              1.774%
 *     border centred, not inset               1.513%
 *     no half-leading on the baseline         1.165%
 *     rotation origin ignored                 0.996%
 *     mirrored image not mirrored             0.934%
 *     even-odd fill rule ignored              0.735%
 *     stroke width forced to 1                0.381%
 *     italic not written                      0.379%
 *     xml:space dropped                       0.356%
 *     font weight not written                 0.269%
 *     per-corner radii ignored                0.207%
 *     text pivot back to the line box         0.154%
 *
 * Three of those numbers are in the FIXTURE's history rather than the painter's,
 * and they are the ones worth remembering: per-corner radii, italic and
 * object-fit each escaped a first version of this file, not because the budget
 * was wrong but because the scene had nothing in it that could tell the two
 * apart. See `featureScene` in parity-page.html.
 */
const MAX_DIFF = parseFloat(argVal("--max", "0.08"));
// `--bench` times the two painters over the same frames. Timing needs REAL
// time, and the correctness run is driven by Chrome's virtual clock — which is
// why every duration this page reports under it is 0.0 ms. So the two modes
// cannot share a run, and the flag picks one.
const BENCH = process.argv.includes("--bench");

const REPORTED = [];

const MIME = {
  ".html": "text/html; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".js": "text/javascript; charset=utf-8", ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8", ".png": "image/png",
  ".pptx": "application/octet-stream", ".odp": "application/octet-stream",
};

/** Both painters and the built engine, without either page's dist carrying the
 *  other's renderer: the routes are assembled here instead. */
const ROUTES = {
  "/gl/evg-webgl.js": path.join(ROOT, "gallery/evg/gl/evg-webgl.js"),
  "/html/evg-html.js": path.join(ROOT, "gallery/evg/html/evg-html.js"),
};

function findChrome() {
  const candidates = [process.env.CHROME_PATH, "/usr/bin/chromium", "/usr/bin/chromium-browser",
    "/usr/bin/google-chrome"].filter(Boolean);
  for (const c of candidates) { try { if (fs.existsSync(c)) return c; } catch (_) { /* keep looking */ } }
  try {
    for (const dir of fs.readdirSync("/opt/pw-browsers")) {
      const c = path.join("/opt/pw-browsers", dir, "chrome-linux", "chrome");
      if (fs.existsSync(c)) return c;
    }
  } catch (_) { /* none */ }
  return null;
}

function serve() {
  const server = http.createServer((req, res) => {
    const rel = decodeURIComponent((req.url || "/").split("?")[0]);
    // `PARITY_DEBUG=1` makes the page post the two renders back so a
    // disagreement can be LOOKED at. A number tells you a check failed; only
    // the picture tells you which cell of the feature sheet did it.
    if (req.method === "POST" && rel === "/report") {
      let body = "";
      req.on("data", (d) => (body += d));
      req.on("end", () => { REPORTED.push(body); res.writeHead(200); res.end("ok"); });
      return;
    }
    if (req.method === "POST" && rel === "/save") {
      let body = "";
      req.on("data", (d) => (body += d));
      req.on("end", () => {
        try {
          const { name, png } = JSON.parse(body);
          const file = path.join("/tmp", "parity-" + String(name).replace(/[^\w.-]/g, "_") + ".png");
          fs.writeFileSync(file, Buffer.from(String(png).split(",")[1], "base64"));
          console.log("  [debug] wrote " + file);
        } catch (e) { console.error("  [debug] save failed: " + e.message); }
        res.writeHead(200); res.end("ok");
      });
      return;
    }
    if (rel === "/" || rel === "/index.html") {
      res.writeHead(200, { "content-type": MIME[".html"], "cache-control": "no-store" });
      res.end(PAGE);
      return;
    }
    const file = ROUTES[rel] || path.join(DIST, rel);
    if (!ROUTES[rel] && !file.startsWith(DIST)) { res.writeHead(403); res.end("no"); return; }
    if (!fs.existsSync(file)) { res.writeHead(404); res.end("no"); return; }
    res.writeHead(200, {
      "content-type": MIME[path.extname(file)] || "application/octet-stream",
      "cache-control": "no-store",
    });
    res.end(fs.readFileSync(file));
  });
  return new Promise((r) => server.listen(PORT, "127.0.0.1", () => r(server)));
}

/**
 * The comparison page.
 *
 * A file rather than a template literal in this module, which is where it
 * started. Every backtick and every `${` in it then had to be escaped, and
 * twice a comment containing an ordinary code quote — object-fit, `rc` — ended
 * the string early and the whole harness failed to parse. The page is real
 * JavaScript and real markup; keeping it as text inside other JavaScript buys
 * nothing and costs a class of bug that gives no useful error.
 */
const PAGE = fs.readFileSync(path.join(HERE, "parity-page.html"), "utf8");

/**
 * Chrome, left running until the page has posted what it was asked for.
 *
 * `--dump-dom` fires at the load event and the page's work is async, so in the
 * correctness run the virtual clock is what lets the whole thing finish before
 * the dump. The bench cannot use a virtual clock — it is measuring real
 * milliseconds — so it cannot use the dump either. It waits for the reports
 * instead and kills the browser once they are in.
 */
function runChromeUntil(bin, args, want, timeoutMs) {
  return new Promise((resolve) => {
    const child = spawn(bin, args, {
      env: { ...process.env, HTTP_PROXY: "", HTTPS_PROXY: "", http_proxy: "", https_proxy: "", NO_PROXY: "*", no_proxy: "*" },
    });
    let err = "";
    child.stderr.on("data", (d) => (err += d));
    const started = Date.now();
    const poll = setInterval(() => {
      if (want() || Date.now() - started > timeoutMs) {
        clearInterval(poll);
        child.kill("SIGKILL");
        resolve({ stderr: err });
      }
    }, 250);
  });
}

function runChrome(bin, args) {
  return new Promise((resolve) => {
    const child = spawn(bin, args, {
      env: { ...process.env, HTTP_PROXY: "", HTTPS_PROXY: "", http_proxy: "", https_proxy: "", NO_PROXY: "*", no_proxy: "*" },
    });
    let out = "", err = "";
    const kill = setTimeout(() => child.kill("SIGKILL"), 180000);
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));
    child.on("close", (status) => { clearTimeout(kill); resolve({ stdout: out, stderr: err, status }); });
    child.on("error", (error) => { clearTimeout(kill); resolve({ stdout: out, stderr: err, status: -1, error }); });
  });
}

async function main() {
  if (!fs.existsSync(path.join(DIST, "pptx_web.js"))) {
    console.error("no build in " + DIST + " — run: npm run pptx:html");
    process.exit(1);
  }
  const chrome = findChrome();
  if (!chrome) { console.error("no Chrome found — set CHROME_PATH to one"); process.exit(1); }
  const server = await serve();
  try {
    const args = [
      "--headless=new", "--no-sandbox", "--disable-dev-shm-usage",
      "--no-proxy-server", "--proxy-bypass-list=<-loopback>",
      // The GPU half needs a software rasteriser to run headless at all; the
      // DOM half needs nothing, which is itself part of the result.
      "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
      ...(BENCH ? [] : ["--virtual-time-budget=90000", "--dump-dom"]),
      `http://127.0.0.1:${PORT}/index.html?` +
        (process.env.PARITY_DEBUG ? "debug=1&" : "") + (BENCH ? "bench=1" : ""),
    ];
    if (BENCH) {
      // Six scenes go past; four reports is enough to print and keeps a slow
      // machine from sitting out the whole timeout.
      const run = await runChromeUntil(chrome, args, () => REPORTED.length >= 7, 180000);
      if (!REPORTED.length) {
        console.error("  the bench reported nothing");
        console.error(run.stderr.split("\n").slice(-8).join("\n"));
        process.exit(1);
      }
      console.log("  scene       cmds     DOM         GPU        ratio   nodes");
      for (const r of REPORTED) {
        const b = JSON.parse(r);
        console.log(`  ${b.name.padEnd(10)} ${String(b.cmds).padStart(5)}  ` +
                    `${b.dom.toFixed(2).padStart(7)} ms  ${b.gl.toFixed(2).padStart(7)} ms  ` +
                    `${(b.dom / b.gl).toFixed(1).padStart(5)}x  ${String(b.nodes).padStart(6)}`);
      }
      return;
    }
    const run = await runChrome(chrome, args);
    const dom = run.stdout || "";
    if (process.env.PARITY_DEBUG) fs.writeFileSync("/tmp/parity-dom.html", dom);
    const body = (dom.match(/<pre id="out">([\s\S]*?)<\/pre>/) || [])[1] || "";
    const text = body.replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
    const line = (text.match(/PARITY (\[.*\])/) || [])[1];
    for (const l of text.split("\n")) if (l.trim() && !l.startsWith("PARITY")) console.log("  " + l.trim());
    if (!line) {
      console.error("\nthe page produced no result");
      if (run.stderr) console.error(run.stderr.split("\n").slice(-8).join("\n"));
      process.exit(1);
    }
    const results = JSON.parse(line);
    // The feature sheet must be in there. A harness that silently skipped it
    // would report five green slides and cover none of the branches it exists
    // to cover — which is the failure this file already had once.
    if (!results.some((r) => r.name === "features")) {
      console.error("\n  FAIL the feature sheet did not render");
      process.exit(1);
    }
    if (results.length < 3) {
      console.error("\n  FAIL only " + results.length + " scenes ran — the deck did not open");
      process.exit(1);
    }
    const worst = results.reduce((a, r) => (r.pct > a.pct ? r : a), results[0]);
    console.log(`\n  ${results.length} scenes, worst ${worst.pct.toFixed(3)}% on ${worst.name}` +
                ` (budget ${MAX_DIFF}%)`);
    if (worst.pct > MAX_DIFF) {
      console.error(`  FAIL the two painters disagree on ${worst.pct.toFixed(3)}% of ${worst.name}`);
      process.exit(1);
    }
    console.log("\nthe DOM painter draws what the GPU painter draws");
  } finally {
    server.close();
  }
}

main().catch((e) => { console.error("parity failed:", e && e.message ? e.message : e); process.exit(1); });
