/**
 * smoke.mjs — open the serverless build in a real browser and make it work.
 *
 * There is no host to drive, so the page drives itself: `?selftest=1` runs a
 * short script inside the page — check the context, type into the source,
 * scroll the drawing, build a PDF — and writes the verdict into the DOM.
 * Headless Chrome can dump a DOM without a browser-driver library, so that is
 * what is read back here.
 *
 * The checks that matter are the ones a screenshot cannot make:
 *
 *   - the document arrived as TEXT RUNS, not as one picture. A page that
 *     rasterized on a server and shipped a PNG would also have draw commands.
 *   - a ```mermaid fence arrived as GEOMETRY. The HTML exporter cannot draw a
 *     scene's paths at all, so "it looked right in the preview" is not
 *     evidence about a diagram; path and stroke commands are.
 *   - the PDF was built IN THE TAB, starts with %PDF-, has page objects and
 *     embeds its faces. A PDF with no embedded face looks right on the
 *     machine that made it and wrong everywhere else.
 *
 *   node gallery/markdown/web/standalone/smoke.mjs [--port 8908] [--shot FILE]
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
const PORT = parseInt(argVal("--port", "8908"), 10);
const SHOT = argVal("--shot", "");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".ttf": "font/ttf",
  ".md": "text/markdown; charset=utf-8",
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
    try {
      if (fs.existsSync(c)) return c;
    } catch (_) { /* keep looking */ }
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
    const kill = setTimeout(() => child.kill("SIGKILL"), 180000);
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
  for (const need of ["index.html", "markdown_web.js", "standalone.mjs", "gl/evg-webgl.js"]) {
    if (!fs.existsSync(path.join(DIST, need))) {
      console.error(`${DIST}/${need} is missing — run: npm run markdown:web`);
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
    ...CHROME_FLAGS, "--virtual-time-budget=40000", "--dump-dom", url,
  ]);
  const dom = run.stdout || "";
  if (process.env.SMOKE_DEBUG) {
    fs.writeFileSync("/tmp/markdown-dom.html", dom);
    console.log("  [debug] dom " + dom.length + " bytes, status " + run.status);
  }

  const status = (dom.match(/<span id="status">([^<]*)/) || [])[1] || "";
  const result = (dom.match(/<div id="selftest-result"[^>]*>([\s\S]*?)<\/div>/) || [])[1] || "";

  console.log("  status   " + status);
  const problems = [];
  if (!dom.includes("__pageStarted") && !result) {
    // The page writes nothing when the module itself failed to load.
  }
  if (!result) {
    problems.push("the page ran no self test — the module did not load");
  } else {
    for (const note of result.replace(/^SELFTEST (OK|FAILED) /, "").split(" | ")) {
      console.log("    " + note);
    }
    if (!result.startsWith("SELFTEST OK")) {
      problems.push("the page's own checks failed");
    }
  }

  if (SHOT) {
    await runChrome(chrome, [
      ...CHROME_FLAGS,
      "--virtual-time-budget=40000",
      "--hide-scrollbars",
      "--window-size=1280,900",
      `--screenshot=${SHOT}`,
      `http://127.0.0.1:${PORT}/index.html`,
    ]);
    if (fs.existsSync(SHOT)) console.log("  shot     " + SHOT);
  }

  server.close();
  if (problems.length > 0) {
    console.error("");
    for (const p of problems) console.error("  " + p);
    process.exit(1);
  }
  console.log("");
  console.log("the page works.");
}

main();
