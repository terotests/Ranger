/**
 * smoke.mjs — open the r5 build in a real browser and make it work.
 *
 * There is no host to drive, so the page drives itself: `?selftest=1` runs a
 * script inside the page — press the rail, type into the editor, open a
 * sheet, change the mode, build a PDF, fold the chrome to a phone's width and
 * back — and writes the verdict into the DOM. Headless Chrome can dump a DOM
 * without a browser-driver library, so that is what is read back here.
 *
 *   node gallery/r5/web/smoke.mjs [--port 8909] [--shot FILE] [--width 1280]
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(HERE, "dist");

function argVal(name, dflt) {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : dflt;
}
const PORT = parseInt(argVal("--port", "8909"), 10);
const SHOT = argVal("--shot", "");
const WIDTH = argVal("--width", "1280");
const HEIGHT = argVal("--height", "900");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".ttf": "font/ttf",
  ".md": "text/markdown; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".png": "image/png",
};

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
    try { if (fs.existsSync(c)) return c; } catch (_) { /* keep looking */ }
  }
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
    const file = path.join(DIST, rel === "/" ? "index.html" : rel);
    if (!file.startsWith(DIST) || !fs.existsSync(file)) {
      res.writeHead(404);
      res.end("no");
      return;
    }
    res.writeHead(200, { "content-type": MIME[path.extname(file)] || "application/octet-stream", "cache-control": "no-store" });
    res.end(fs.readFileSync(file));
  });
  return new Promise((r) => server.listen(PORT, "127.0.0.1", () => r(server)));
}

function runChrome(bin, args) {
  return new Promise((resolve) => {
    const child = spawn(bin, args, {
      env: { ...process.env, HTTP_PROXY: "", HTTPS_PROXY: "", http_proxy: "", https_proxy: "", NO_PROXY: "*", no_proxy: "*" },
    });
    let out = "", err = "";
    const kill = setTimeout(() => child.kill("SIGKILL"), 420000);
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));
    child.on("close", (status) => { clearTimeout(kill); resolve({ stdout: out, stderr: err, status }); });
    child.on("error", (error) => { clearTimeout(kill); resolve({ stdout: out, stderr: err, status: -1, error }); });
  });
}

const CHROME_FLAGS = [
  "--headless=new", "--no-sandbox", "--no-proxy-server", "--proxy-bypass-list=<-loopback>",
  "--disable-dev-shm-usage", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
];

async function main() {
  for (const need of ["index.html", "r5_app.js", "main.js", "r5.css", "gl/evg-webgl.js", "gl/evg-a11y.js"]) {
    if (!fs.existsSync(path.join(DIST, need))) {
      console.error(`${DIST}/${need} is missing — run: npm run r5:web`);
      process.exit(1);
    }
  }
  const chrome = findChrome();
  if (!chrome) {
    console.log("no Chrome on this machine — skipping the browser check");
    process.exit(0);
  }
  const server = await serve();
  console.log(`serving ${DIST} on http://127.0.0.1:${PORT}`);

  const url = `http://127.0.0.1:${PORT}/index.html?selftest=1`;
  const run = await runChrome(chrome, [
    ...CHROME_FLAGS, `--window-size=${WIDTH},${HEIGHT}`, "--virtual-time-budget=40000", "--dump-dom", url,
  ]);
  const dom = run.stdout || "";
  if (process.env.SMOKE_DEBUG) {
    fs.writeFileSync("/tmp/r5-dom.html", dom);
    console.log("  [debug] dom " + dom.length + " bytes, status " + run.status);
  }
  const problems = [];
  const raw = (dom.match(/<pre id="selftest">([\s\S]*?)<\/pre>/) || [])[1] || "";
  const err = (dom.match(/<div id="err">([\s\S]*?)<\/div>/) || [])[1] || "";
  if (err.trim()) console.log("  page error: " + err.trim().split("\n")[0]);
  if (!raw) {
    problems.push("the page ran no self test — the module did not load" + (err.trim() ? ": " + err.trim().split("\n")[0] : ""));
  } else {
    const verdict = JSON.parse(raw.replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">"));
    for (const r of verdict.results) console.log(`    ${r.ok ? "ok  " : "FAIL"} ${r.name}${r.note ? " — " + r.note : ""}`);
    if (!verdict.ok) {
      problems.push("the page's own checks failed:\n    " + verdict.results.filter((r) => !r.ok).map((r) => r.name).join("\n    "));
    }
  }

  if (SHOT) {
    await runChrome(chrome, [
      ...CHROME_FLAGS, "--virtual-time-budget=40000", "--hide-scrollbars", `--window-size=${WIDTH},${HEIGHT}`,
      `--force-device-scale-factor=${argVal("--shot-scale", "1")}`, `--screenshot=${SHOT}`,
      `http://127.0.0.1:${PORT}/index.html?${argVal("--shot-query", "sample=deck")}`,
    ]);
    if (fs.existsSync(SHOT)) console.log("  shot     " + SHOT);
  }

  server.close();
  if (problems.length > 0) {
    console.error("");
    for (const p of problems) console.error("  " + p);
    process.exit(1);
  }
  console.log("\nALL PASS\n\nthe page works.");
}

main().catch((e) => { console.error(e); process.exit(1); });
