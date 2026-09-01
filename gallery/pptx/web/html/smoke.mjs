/**
 * smoke.mjs — open the DOM-painted slide viewer in a real browser and use it.
 *
 * Modelled on the WebGL page's smoke test next door, with one difference that
 * is the whole point: there, a headless Chrome dumps a DOM and the DOM is a
 * `<canvas>` plus whatever the page wrote about itself. Here the DOM IS the
 * picture, so `--dump-dom` carries the drawing out and the assertions can be
 * about the slide rather than about the app's opinion of it.
 *
 * No GPU flags either. The WebGL page needs `--use-angle=swiftshader` and a
 * software rasteriser to run headless at all; this one needs nothing.
 *
 *   node gallery/pptx/web/html/smoke.mjs [--port 8886] [--shot]
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));

function argVal(flag, dflt) {
  const i = process.argv.indexOf(flag);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : dflt;
}

const DIST = path.resolve(argVal("--dist", path.join(HERE, "dist")));
const PORT = parseInt(argVal("--port", "8886"), 10);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".odp": "application/vnd.oasis.opendocument.presentation",
  ".png": "image/png",
};

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/google-chrome",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ].filter(Boolean);
  for (const c of candidates) {
    try { if (fs.existsSync(c)) return c; } catch (_) { /* keep looking */ }
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
  return new Promise((resolve) => server.listen(PORT, "127.0.0.1", () => resolve(server)));
}

function runChrome(bin, args) {
  return new Promise((resolve) => {
    const child = spawn(bin, args, {
      env: {
        ...process.env,
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

async function main() {
  if (!fs.existsSync(path.join(DIST, "pptx_web.js"))) {
    console.error("no build in " + DIST + " — run: npm run pptx:html");
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
      "--headless=new",
      "--no-sandbox",
      "--no-proxy-server",
      "--proxy-bypass-list=<-loopback>",
      "--disable-dev-shm-usage",
      "--virtual-time-budget=25000",
      "--dump-dom",
      url,
    ]);
    const dom = run.stdout || "";
    if (process.env.SMOKE_DEBUG) {
      fs.writeFileSync("/tmp/pptx-html-dom.html", dom);
      console.log("  [debug] dom " + dom.length + " bytes, status " + run.status + " err " + (run.error || ""));
    }

    const line = (dom.match(/<pre id="selftest">([^<]*)/) || [])[1];
    const info = (dom.match(/<pre id="svginfo">([^<]*)/) || [])[1];
    const status = (dom.match(/<strong id="status">([^<]*)/) || [])[1];
    const backend = (dom.match(/<strong id="backend">([^<]*)/) || [])[1];
    const cmds = parseInt((dom.match(/<strong id="cmds">([^<]*)/) || [])[1] || "0", 10);
    const nodes = parseInt((dom.match(/<strong id="nodes">([^<]*)/) || [])[1] || "0", 10);
    const paint = (dom.match(/<strong id="paint">([^<]*)/) || [])[1];

    console.log("  status  " + status);
    console.log("  backend " + backend);
    console.log("  cmds    " + cmds);
    console.log("  nodes   " + nodes);
    console.log("  paint   " + paint);
    if (info) console.log("  " + info);
    if (line) console.log("  " + line.split(" :: ").join("\n  "));

    const problems = [];
    if (!/slides$/.test(status || "")) problems.push("the deck did not open (status: " + status + ")");
    if (backend !== "svg/dom") problems.push("not drawing as DOM (got " + backend + ")");
    if (!(cmds > 5)) problems.push("the slide has almost nothing in it (" + cmds + " commands)");
    // The heart of it: commands went in and ELEMENTS came out. A page that
    // reported a healthy command count and an empty <svg> is exactly the
    // failure this file exists to catch, and it is invisible in a screenshot
    // of a white slide.
    if (!(nodes > 5)) problems.push("the display list did not become elements (" + nodes + " nodes)");
    if (/<canvas/i.test(dom)) problems.push("there is a <canvas> on the page");
    if (!line) problems.push("the page ran no self test");
    else {
      const m = line.match(/selftest (\d+)\/(\d+)/);
      if (!m || m[1] !== m[2]) problems.push("self test failed: " + line);
    }
    if (problems.length) {
      for (const p of problems) console.error("  FAIL " + p);
      if (run.stderr && !status) console.error(run.stderr.split("\n").slice(-8).join("\n"));
      process.exit(1);
    }

    if (process.argv.includes("--shot")) {
      // `artifacts/` is the one place under gallery/pptx where a PNG is not
      // gitignored, so a screenshot the README links to has to live there.
      const shot = path.resolve(HERE, "../../artifacts/pptx-html-dom.png");
      await runChrome(chrome, [
        "--headless=new", "--no-sandbox", "--disable-dev-shm-usage",
        "--no-proxy-server", "--proxy-bypass-list=<-loopback>",
        "--virtual-time-budget=15000", "--window-size=1180,900",
        "--screenshot=" + shot, `http://127.0.0.1:${PORT}/index.html`,
      ]);
      console.log("  wrote " + path.relative(process.cwd(), shot));
    }

    console.log("\nthe slide editor ran in a browser with no canvas and no GPU");
  } finally {
    server.close();
  }
}

main().catch((e) => {
  console.error("smoke failed:", e && e.message ? e.message : e);
  process.exit(1);
});
