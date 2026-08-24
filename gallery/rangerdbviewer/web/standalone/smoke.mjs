/**
 * smoke.mjs — open the serverless build in a real browser and make it work.
 *
 * There is no host to drive, so the page drives itself: `?selftest=1` runs
 * `selftest.mjs` inside the tab — open the in-tab database, read the schema
 * from SQL, draw the diagram, narrow it to a subject area, export an SVG — and
 * writes the verdict into the DOM. Headless Chrome dumps a DOM without a
 * browser-driver library, so that is what is read back here.
 *
 * "webgl2" is a label the page writes about itself, so the checks below look
 * under it: the scene left GL draw calls behind, and no fill was skipped.
 *
 *   node gallery/rangerdbviewer/web/standalone/smoke.mjs [--port 8901] [--shot FILE]
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(HERE, "dist");
const PORT = parseInt(argVal("--port", "8901"), 10);

function argVal(name, dflt) {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : dflt;
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".ttf": "font/ttf",
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

function textOf(dom, id) {
  const m = new RegExp(`<pre id="${id}"[^>]*>([\\s\\S]*?)</pre>`).exec(dom);
  return m ? m[1].replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">") : "";
}

async function main() {
  if (!fs.existsSync(path.join(DIST, "rangerdbviewer_web.js"))) {
    console.error("no build in " + DIST + " — run:  npm run rangerdbviewer:web");
    process.exit(1);
  }
  const chrome = findChrome();
  if (!chrome) {
    console.error("no Chrome found — set CHROME_PATH to one");
    process.exit(1);
  }
  const server = await serve();
  const url = `http://127.0.0.1:${PORT}/?selftest=1`;
  const run = await runChrome(chrome, [...CHROME_FLAGS, "--virtual-time-budget=30000", "--dump-dom", url]);
  const dom = run.stdout || "";

  let failed = 0;
  const say = (good, line) => {
    if (!good) failed = failed + 1;
    console.log((good ? "  ok   " : "  FAIL ") + line);
  };

  // Did the page even start? A 404 on the module leaves a DOM with nothing in
  // it and every check below would report a confusing absence instead.
  const started = dom.indexOf("__pageStarted") >= 0 || dom.indexOf("selftest") >= 0;
  say(started, "the page loaded its module");

  const verdict = textOf(dom, "selftest");
  const glinfo = textOf(dom, "glinfo");
  if (!verdict) {
    console.log("  FAIL the page wrote no verdict");
    if (run.stderr) console.log(run.stderr.split("\n").slice(0, 12).join("\n"));
    server.close();
    process.exit(1);
  }
  const head = /selftest (\d+)\/(\d+)/.exec(verdict);
  const passed = head ? parseInt(head[1], 10) : 0;
  const total = head ? parseInt(head[2], 10) : 0;
  say(total > 0 && passed === total, `the page's own checks: ${passed}/${total}`);
  for (const part of verdict.split(" | ")) {
    if (part.startsWith("FAIL")) console.log("       " + part);
  }

  const drawn = /draws (\d+)/.exec(glinfo);
  const skipped = /skipped (\d+)/.exec(glinfo);
  const paths = /paths (\d+)/.exec(glinfo);
  say(drawn && parseInt(drawn[1], 10) > 0, "the GPU actually drew something");
  say(paths && parseInt(paths[1], 10) > 0, "including filled paths (the tables and edges)");
  say(!skipped || parseInt(skipped[1], 10) === 0, "and skipped nothing");
  console.log("  " + glinfo.trim());

  server.close();
  console.log(failed === 0 ? "ALL PASS" : "FAILURES");
  process.exit(failed === 0 ? 0 : 1);
}

main();
