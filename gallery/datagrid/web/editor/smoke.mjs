/**
 * smoke.mjs — open the code editor page in a real browser and type into it.
 *
 * There is no host to drive, so the page drives itself: `?selftest=1` runs a
 * short script inside the page — click, type, Enter, undo, Ctrl+K — and writes
 * the result into the DOM, which headless Chrome will dump without a driver
 * library. What it checks that a unit test cannot: that the scene reaching
 * WebGL has text in it, in more than one colour.
 *
 *   node gallery/datagrid/web/editor/smoke.mjs [--port 8899] [--shot]
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
  ".png": "image/png",
};

/** Chrome, wherever this machine keeps it. */
function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
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
  const pw = "/opt/pw-browsers";
  try {
    for (const dir of fs.readdirSync(pw)) {
      for (const rel of ["chrome-linux/chrome", "chrome-linux64/chrome", "chrome"]) {
        const c = path.join(pw, dir, rel);
        if (fs.existsSync(c)) return c;
      }
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

function runChrome(bin, args) {
  return new Promise((resolve) => {
    const child = spawn(bin, args, {
      env: {
        ...process.env,
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

const GL_ARGS = [
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
  if (!fs.existsSync(path.join(DIST, "code_editor_web.js"))) {
    console.error("no build in " + DIST + " — run: npm run datagrid:editor:web");
    process.exit(1);
  }
  const chrome = findChrome();
  if (!chrome) {
    console.error("no Chrome found — set CHROME_PATH to one");
    process.exit(1);
  }
  const server = await serve();
  try {
    const run = await runChrome(chrome, [
      ...GL_ARGS,
      "--virtual-time-budget=20000",
      "--dump-dom",
      `http://127.0.0.1:${PORT}/index.html?selftest=1`,
    ]);
    const dom = run.stdout || "";
    if (process.env.SMOKE_DEBUG) {
      fs.writeFileSync("/tmp/editor-smoke-dom.html", dom);
      console.log("  [debug] dom " + dom.length + " bytes, status " + run.status);
    }
    const line = (dom.match(/<pre id="selftest"[^>]*>([^<]*)/) || [])[1];
    const status = (dom.match(/<strong id="status">([^<]*)/) || [])[1];
    const backend = (dom.match(/<strong id="backend">([^<]*)/) || [])[1];
    const cmds = parseInt((dom.match(/<strong id="cmds">([^<]*)/) || [])[1] || "0", 10);

    console.log("  status  " + status);
    console.log("  backend " + backend);
    console.log("  cmds    " + cmds);
    if (line) console.log("  " + line.split(" :: ").join("\n  "));

    const problems = [];
    if (status !== "live") problems.push("the page did not reach 'live' (got " + status + ")");
    if (backend !== "webgl2") problems.push("not drawing with WebGL 2 (got " + backend + ")");
    if (!(cmds > 100)) problems.push("the scene has almost nothing in it (" + cmds + " commands)");
    if (!line) problems.push("the page ran no self test");
    else {
      const m = line.match(/selftest (\d+)\/(\d+)/);
      if (!m || m[1] !== m[2]) problems.push("self test failed");
    }
    if (problems.length) {
      for (const p of problems) console.error("  FAIL " + p);
      if (run.stderr && !status) console.error(run.stderr.split("\n").slice(-8).join("\n"));
      process.exit(1);
    }

    if (process.argv.includes("--shot")) {
      const shot = path.resolve(HERE, "../../artifacts/code_editor_web.png");
      await runChrome(chrome, [
        ...GL_ARGS,
        "--virtual-time-budget=15000",
        "--window-size=1040,880",
        "--screenshot=" + shot,
        `http://127.0.0.1:${PORT}/index.html`,
      ]);
      console.log("  wrote " + path.relative(process.cwd(), shot));
    }

    console.log("\nthe code editor ran in a browser, on WebGL, with no host behind it");
  } finally {
    server.close();
  }
}

main().catch((e) => {
  console.error("smoke failed:", e && e.message ? e.message : e);
  process.exit(1);
});
