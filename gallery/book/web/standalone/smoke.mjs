/**
 * smoke.mjs — open the serverless book editor in a real browser and use it.
 *
 *   npm run book:web:test
 *
 * There is no host to drive, so the page drives itself: `?selftest=1` runs a
 * short script inside the page — arm editing, turn the spread, select, nudge,
 * undo, click, save a spread as SVG — and writes the result into the DOM.
 * Headless Chrome can dump a DOM without a browser-driver library, so that is
 * what is read back here.
 *
 * The static files are served by a few lines of Node rather than by anything
 * the page needs: the point of the build is that ANY file server will do.
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(HERE, "dist");

function argVal(flag, dflt) {
  const i = process.argv.indexOf(flag);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : dflt;
}
const PORT = parseInt(argVal("--port", "8879"), 10);
const SHOT = process.argv.includes("--shot");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".ttf": "font/ttf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".xml": "text/xml; charset=utf-8",
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
    if (fs.existsSync(c)) return c;
  }
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
    const kill = setTimeout(() => child.kill("SIGKILL"), 180000);
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
  if (!fs.existsSync(path.join(DIST, "book_web.js"))) {
    console.error("no build in " + DIST + " — run: npm run book:web");
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
      "--virtual-time-budget=30000",
      "--dump-dom",
      `http://127.0.0.1:${PORT}/index.html?selftest=1`,
    ]);
    const dom = run.stdout || "";
    if (process.env.SMOKE_DEBUG) fs.writeFileSync("/tmp/book-standalone-dom.html", dom);
    const backend = (dom.match(/<strong id="backend">([^<]*)/) || [])[1];
    const cmds = parseInt((dom.match(/<strong id="cmds">([^<]*)/) || [])[1] || "0", 10);
    const line = (dom.match(/<pre id="selftest">([^<]*)/) || [])[1];

    console.log("  backend " + backend);
    console.log("  cmds    " + cmds);
    if (line) console.log("  " + line.split(" :: ").join("\n  "));

    const problems = [];
    if (backend !== "webgl2") problems.push("not drawing with WebGL 2 (got " + backend + ")");
    if (!(cmds > 50)) problems.push("the spread has almost nothing in it (" + cmds + " commands)");
    if (!line) problems.push("the page ran no self test");
    else {
      const m = line.match(/selftest (\d+)\/(\d+)/);
      if (!m || m[1] !== m[2]) problems.push("self test failed");
    }
    if (problems.length) {
      for (const p of problems) console.error("  FAIL " + p);
      if (run.stderr) console.error(run.stderr.split("\n").slice(-6).join("\n"));
      process.exit(1);
    }

    if (SHOT) {
      const shots = [
        ["01_editor.png", "?spread=2&edit=1"],
        // The same editor with an Apple photo album open in it, read from the
        // library index that ships in the build.
        ["02_album.png", "?album=1&spread=1"],
      ];
      for (const [name, query] of shots) {
        const shot = path.resolve(HERE, "../../artifacts/" + name);
        fs.mkdirSync(path.dirname(shot), { recursive: true });
        await runChrome(chrome, [
          ...GL_ARGS,
          "--virtual-time-budget=20000",
          "--window-size=1220,940",
          "--screenshot=" + shot,
          `http://127.0.0.1:${PORT}/index.html${query}`,
        ]);
        console.log("  wrote " + path.relative(process.cwd(), shot));
      }
    }
    console.log("\nthe book editor ran in a browser with no host behind it");
  } finally {
    server.close();
  }
}

main().catch((e) => {
  console.error("smoke failed:", e && e.message ? e.message : e);
  process.exit(1);
});
