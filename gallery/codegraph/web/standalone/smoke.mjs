/**
 * smoke.mjs — open the CodeGraph page in headless Chrome and make it work.
 *
 *   node gallery/codegraph/web/standalone/smoke.mjs [--port 8898] [--shot FILE]
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(HERE, "dist");
const PORT = parseInt(argVal("--port", "8898"), 10);

function argVal(name, dflt) {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : dflt;
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".rgr": "text/plain; charset=utf-8",
  ".ttf": "font/ttf",
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
  if (!fs.existsSync(path.join(DIST, "codegraph_web.js"))) {
    console.error("no build in " + DIST + " — run: npm run codegraph:web");
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
      ...CHROME_FLAGS, "--virtual-time-budget=90000", "--dump-dom", url,
    ]);
    const dom = run.stdout || "";
    const selftest = (dom.match(/<pre id="selftest"[^>]*>([\s\S]*?)<\/pre>/) || [])[1] || "";
    const status = (dom.match(/<span id="status">([^<]*)/) || [])[1] || "";
    const backend = (dom.match(/<span id="backend">([^<]*)/) || [])[1] || "";
    const crumb = (dom.match(/<span class="crumb"[^>]*>([^<]*)/) || [])[1] || "";
    console.log("  status   " + status);
    console.log("  backend  " + backend);
    console.log("  crumb    " + crumb);
    for (const l of selftest.split("\n")) if (l.trim()) console.log("  " + l.trim());
    const problems = [];
    if (backend !== "webgl2") problems.push("not drawing with WebGL 2 (got '" + backend + "')");
    if (!selftest) problems.push("the page ran no self test");
    else if (!selftest.startsWith("PASS")) problems.push("self test failed: " + selftest.split("\n")[0]);
    if (!/nav ok/.test(selftest)) problems.push("click / back navigation did not run");
    if (!/vc ok/.test(selftest)) problems.push("VirtualCompiler did not analyse calls.rgr");
    if (problems.length) {
      for (const p of problems) console.error("  FAIL " + p);
      if (run.stderr) console.error(run.stderr.split("\n").slice(-6).join("\n"));
      process.exit(1);
    }
    const shot = argVal("--shot", "");
    if (shot) {
      fs.mkdirSync(path.dirname(path.resolve(shot)), { recursive: true });
      const shotDir = path.dirname(path.resolve(shot));
      const shots = [
        [path.resolve(shot), "http://127.0.0.1:" + PORT + "/index.html"],
        [path.join(shotDir, "codegraph_shop.png"), "http://127.0.0.1:" + PORT + "/index.html?sample=shop"],
        [path.join(shotDir, "codegraph_animals.png"), "http://127.0.0.1:" + PORT + "/index.html?example=animals.rgr"],
      ];
      for (const [file, url] of shots) {
        await runChrome(chrome, [
          ...CHROME_FLAGS, "--virtual-time-budget=15000",
          "--window-size=1440,900", "--screenshot=" + file,
          url,
        ]);
        console.log("  wrote " + file);
      }
    }
    console.log("  OK");
  } finally {
    server.close();
  }
}

main();
