/**
 * smoke.mjs — open the serverless build in a real browser and make it work.
 *
 * There is no host to drive, so the page drives itself: `?selftest=1` runs a
 * short script inside the page — select a table, drag it, undo, select all —
 * and writes the verdict into the DOM. Headless Chrome can dump a DOM without
 * a browser-driver library, so that is what is read back here.
 *
 * "webgl2" is a label the page writes about itself, so the checks below look
 * under it: the context really is a WebGL2RenderingContext, it has the stencil
 * buffer a filled path needs, the scene left GL draw calls behind, and no fill
 * was skipped.
 *
 *   node gallery/rangerflow/web/standalone/smoke.mjs [--port 8899] [--shot FILE]
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(HERE, "dist");
const PORT = parseInt(argVal("--port", "8899"), 10);

function argVal(flag, dflt) {
  const i = process.argv.indexOf(flag);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : dflt;
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".ttf": "font/ttf",
  ".sql": "text/plain; charset=utf-8",
  ".png": "image/png",
};

/** Chrome, wherever this machine keeps it. */
function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    "/opt/pw-browsers/chromium/chrome-linux/chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/google-chrome",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ].filter(Boolean);
  for (const c of candidates) {
    try {
      if (fs.existsSync(c)) return c;
    } catch (_) { /* keep looking */ }
  }
  const pw = "/opt/pw-browsers";
  try {
    for (const dir of fs.readdirSync(pw)) {
      const c = path.join(pw, dir, "chrome-linux", "chrome");
      if (fs.existsSync(c)) return c;
    }
  } catch (_) { /* none */ }
  return null;
}

function serve() {
  const server = http.createServer((req, res) => {
    const rel = decodeURIComponent((req.url || "/").split("?")[0]);
    const file = path.join(DIST, rel === "/" ? "index.html" : rel);
    if (!file.startsWith(DIST) || !fs.existsSync(file)) {
      res.writeHead(404);
      res.end("no");
      return;
    }
    res.writeHead(200, {
      "content-type": MIME[path.extname(file)] || "application/octet-stream",
      "cache-control": "no-store",
    });
    res.end(fs.readFileSync(file));
  });
  return new Promise((r) => server.listen(PORT, "127.0.0.1", () => r(server)));
}

/** Chrome, run to completion, with its stdout collected. */
function runChrome(bin, args) {
  return new Promise((resolve) => {
    const child = spawn(bin, args, {
      env: {
        ...process.env,
        // The page is on loopback; a proxy in the environment must not be
        // consulted for it.
        HTTP_PROXY: "", HTTPS_PROXY: "", http_proxy: "", https_proxy: "",
        NO_PROXY: "*", no_proxy: "*",
      },
    });
    let out = "", err = "";
    const kill = setTimeout(() => child.kill("SIGKILL"), 120000);
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));
    child.on("close", (status) => { clearTimeout(kill); resolve({ stdout: out, stderr: err, status }); });
    child.on("error", (error) => { clearTimeout(kill); resolve({ stdout: out, stderr: err, status: -1, error }); });
  });
}

const CHROME_FLAGS = [
  "--headless=new",
  "--no-sandbox",
  "--no-proxy-server",
  "--proxy-bypass-list=<-loopback>",
  "--disable-dev-shm-usage",
  "--use-gl=angle",
  "--use-angle=swiftshader",
  "--enable-unsafe-swiftshader",
];

async function main() {
  if (!fs.existsSync(path.join(DIST, "rangerflow_web.js"))) {
    console.error("no build in " + DIST + " — run: npm run rangerflow:web");
    process.exit(1);
  }
  const chrome = findChrome();
  if (!chrome) {
    console.error("no Chrome found — set CHROME_PATH to one");
    process.exit(1);
  }
  const server = await serve();
  try {
    const url = `http://127.0.0.1:${PORT}/index.html?selftest=1`;
    const run = await runChrome(chrome, [
      ...CHROME_FLAGS, "--virtual-time-budget=25000", "--dump-dom", url,
    ]);
    const dom = run.stdout || "";
    if (process.env.SMOKE_DEBUG) {
      fs.writeFileSync("/tmp/rangerflow-dom.html", dom);
      console.log("  [debug] dom " + dom.length + " bytes, status " + run.status);
    }
    const selftest = (dom.match(/<pre id="selftest"[^>]*>([\s\S]*?)<\/pre>/) || [])[1] || "";
    const status = (dom.match(/<span id="status">([^<]*)/) || [])[1] || "";
    const backend = (dom.match(/<span id="backend">([^<]*)/) || [])[1] || "";
    const cmds = (dom.match(/<span id="cmds">([^<]*)/) || [])[1] || "";

    console.log("  status   " + status);
    console.log("  backend  " + backend);
    console.log("  cmds     " + cmds);
    for (const l of selftest.split("\n")) if (l.trim()) console.log("  " + l.trim());

    const num = (re) => parseInt((selftest.match(re) || [])[1] || "-1", 10);
    const problems = [];
    if (backend !== "webgl2") problems.push("not drawing with WebGL 2 (got '" + backend + "')");
    if (!selftest) problems.push("the page ran no self test");
    if (!selftest.startsWith("PASS")) problems.push("self test failed: " + selftest.split("\n")[0]);
    if (!/webgl2=true/.test(selftest)) problems.push("the context is not a WebGL2RenderingContext");
    if (!/stencil=true/.test(selftest)) problems.push("no stencil buffer — filled paths cannot be drawn");
    if (!(num(/quads=(\d+)/) > 50)) problems.push("almost nothing was drawn (quads=" + num(/quads=(\d+)/) + ")");
    if (!(num(/paths=(\d+)/) > 0)) problems.push("no vector path was drawn — the edges are missing");
    if (num(/skippedFills=(\d+)/) !== 0) problems.push("fills were skipped: " + num(/skippedFills=(\d+)/));
    if (!/nodes=9/.test(selftest)) problems.push("the fixture schema did not load (expected 9 tables)");

    if (problems.length) {
      for (const p of problems) console.error("  FAIL " + p);
      if (run.stderr) console.error(run.stderr.split("\n").slice(-8).join("\n"));
      process.exit(1);
    }

    const shot = argVal("--shot", "");
    if (shot) {
      await runChrome(chrome, [
        ...CHROME_FLAGS, "--virtual-time-budget=15000",
        "--window-size=1440,900", "--screenshot=" + path.resolve(shot),
        `http://127.0.0.1:${PORT}/index.html`,
      ]);
      console.log("  wrote " + shot);
    }
    console.log("  OK");
  } finally {
    server.close();
  }
}

main();
