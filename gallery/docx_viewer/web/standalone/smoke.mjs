/**
 * smoke.mjs — open the serverless document viewer in a real browser and use it.
 *
 * There is no host to drive, so the page drives itself: `?selftest=1` runs a
 * short script inside the page — type into a cell, copy, make a chart — and
 * writes the result into the DOM. Headless Chrome can dump a DOM without a
 * browser-driver library, so that is what is read back here.
 *
 * The static files are served by a few lines of Node rather than by anything
 * the page needs: the point of the build is that ANY file server will do.
 *
 *   node gallery/datagrid/web/standalone/smoke.mjs [--port 8878] [--keep]
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(HERE, "dist");
const PORT = parseInt(argVal("--port", "8868"), 10);

function argVal(flag, dflt) {
  const i = process.argv.indexOf(flag);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : dflt;
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".ttf": "font/ttf",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".png": "image/png",
};

/** Chrome, wherever this machine keeps it. */
function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/google-chrome",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ].filter(Boolean);
  for (const c of candidates) {
    try {
      if (fs.existsSync(c)) return c;
    } catch (_) {
      /* keep looking */
    }
  }
  // Playwright keeps its download under a versioned directory; take any.
  const pw = "/opt/pw-browsers";
  try {
    for (const dir of fs.readdirSync(pw)) {
      const c = path.join(pw, dir, "chrome-linux", "chrome");
      if (fs.existsSync(c)) return c;
    }
  } catch (_) {
    /* none */
  }
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

/** Chrome, run to completion, with its stdout collected. */
function runChrome(bin, args) {
  return new Promise((resolve) => {
    const child = spawn(bin, args, {
      env: {
        ...process.env,
        // The page is on loopback; a proxy in the environment must not be
        // consulted for it.
        HTTP_PROXY: "",
        HTTPS_PROXY: "",
        http_proxy: "",
        https_proxy: "",
        NO_PROXY: "*",
        no_proxy: "*",
      },
    });
    let out = "";
    let err = "";
    const kill = setTimeout(() => child.kill("SIGKILL"), 120000);
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));
    child.on("close", (status) => {
      clearTimeout(kill);
      resolve({ stdout: out, stderr: err, status });
    });
    child.on("error", (error) => {
      clearTimeout(kill);
      resolve({ stdout: out, stderr: err, status: -1, error });
    });
  });
}

async function main() {
  if (!fs.existsSync(path.join(DIST, "docx_web.js"))) {
    console.error("no build in " + DIST + " — run: npm run docx_viewer:web");
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
    const shot = process.argv.includes("--shot")
      ? path.resolve(HERE, "../../../datagrid/artifacts/21_docx_browser_only.png")
      : "";
    // NOT spawnSync: the file server is in this process, and a synchronous
    // spawn blocks the event loop — Chrome would sit waiting for a page this
    // process could not serve until the timeout killed it.
    const run = await runChrome(chrome, [
        "--headless=new",
        "--no-sandbox",
        // This machine may have a proxy in the environment; the page is on
        // loopback and must not go near it.
        "--no-proxy-server",
        "--proxy-bypass-list=<-loopback>",
        "--disable-dev-shm-usage",
        "--use-gl=angle",
        "--use-angle=swiftshader",
        "--enable-unsafe-swiftshader",
        "--virtual-time-budget=20000",
        "--dump-dom",
        url,
      ]);
    const dom = run.stdout || "";
    if (process.env.SMOKE_DEBUG) {
      fs.writeFileSync("/tmp/smoke-dom.html", dom);
      console.log("  [debug] dom " + dom.length + " bytes, status " + run.status + " err " + (run.error || ""));
    }
    const line = (dom.match(/<pre id="selftest">([^<]*)/) || [])[1];
    const status = (dom.match(/<strong id="status">([^<]*)/) || [])[1];
    const backend = (dom.match(/<strong id="backend">([^<]*)/) || [])[1];
    const cmds = parseInt((dom.match(/<strong id="cmds">([^<]*)/) || [])[1] || "0", 10);

    console.log("  status  " + status);
    console.log("  backend " + backend);
    console.log("  cmds    " + cmds);
    const glinfo = (dom.match(/<pre id="glinfo">([^<]*)/) || [])[1];
    if (glinfo) console.log("  " + glinfo);
    if (line) console.log("  " + line.split(" :: ").join("\n  "));

    const problems = [];
    if (!status || /^could not|^error/.test(status)) problems.push("the document did not open (status: " + status + ")");
    if (backend !== "webgl2") problems.push("not drawing with WebGL 2 (got " + backend + ")");
    if (!(cmds > 40)) problems.push("the page has almost nothing in it (" + cmds + " commands)");
    if (!line) problems.push("the page ran no self test");
    else {
      const m = line.match(/selftest (\d+)\/(\d+)/);
      if (!m || m[1] !== m[2]) problems.push("self test failed: " + line);
    }
    if (problems.length) {
      for (const p of problems) console.error("  FAIL " + p);
      if (run.stderr && !status) console.error(run.stderr.split("\n").slice(-5).join("\n"));
      process.exit(1);
    }
    // `--shot` takes a picture of the page as it loads, which is the only
    // honest way to show "it runs in a browser" in a repository of PNGs. Its
    // own run, without the self test, so the picture is the workbook rather
    // than whatever the last scripted step left on screen.
    if (shot) {
      await runChrome(chrome, [
        "--headless=new",
        "--no-sandbox",
        "--disable-dev-shm-usage",
        "--use-gl=angle",
        "--use-angle=swiftshader",
        "--enable-unsafe-swiftshader",
        "--no-proxy-server",
        "--proxy-bypass-list=<-loopback>",
        "--virtual-time-budget=15000",
        "--window-size=1100,860",
        "--screenshot=" + shot,
        `http://127.0.0.1:${PORT}/index.html`,
      ]);
      console.log("  wrote " + path.relative(process.cwd(), shot));
    }

    console.log("\nthe document viewer ran in a browser with no host behind it");
  } finally {
    server.close();
  }
}

main().catch((e) => {
  console.error("smoke failed:", e && e.message ? e.message : e);
  process.exit(1);
});
