/**
 * browser.mjs — open the book editor in a real browser and use it.
 *
 *   npm run book:window:smoke
 *
 * The editor runs in Node and paints through WebGL 2 in the page, so neither
 * half can be checked alone: a display list that is right and a page that
 * never draws it look identical from the Node side. This starts the host,
 * loads the page in headless Chrome with `?selftest=1`, and reads the result
 * back out of the DOM — the same trick the deck viewer's smoke uses, because
 * dumping a DOM needs no browser-driver dependency.
 */
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../../..");

function argVal(flag, dflt) {
  const i = process.argv.indexOf(flag);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : dflt;
}
const PORT = parseInt(argVal("--port", "8769"), 10);
const SHOT = process.argv.includes("--shot");

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

function startHost() {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(HERE, "serve.mjs"), "--port", String(PORT)], {
      cwd: ROOT,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let out = "";
    const timer = setTimeout(() => reject(new Error("host did not start:\n" + out)), 90000);
    child.stdout.on("data", (d) => {
      out += d;
      if (out.includes("Book editor at")) {
        clearTimeout(timer);
        resolve(child);
      }
    });
    child.stderr.on("data", (d) => (out += d));
    child.on("exit", (code) => {
      clearTimeout(timer);
      reject(new Error("host exited with " + code + "\n" + out));
    });
  });
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
  const chrome = findChrome();
  if (!chrome) {
    console.error("no Chrome found — set CHROME_PATH to one");
    process.exit(1);
  }
  const host = await startHost();
  try {
    const run = await runChrome(chrome, [
      ...GL_ARGS,
      "--virtual-time-budget=30000",
      "--dump-dom",
      `http://127.0.0.1:${PORT}/?selftest=1`,
    ]);
    const dom = run.stdout || "";
    if (process.env.SMOKE_DEBUG) fs.writeFileSync("/tmp/book-dom.html", dom);
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
      const shot = path.join(HERE, "../artifacts/01_editor.png");
      fs.mkdirSync(path.dirname(shot), { recursive: true });
      await runChrome(chrome, [
        ...GL_ARGS,
        "--virtual-time-budget=20000",
        "--window-size=1220,940",
        "--screenshot=" + shot,
        `http://127.0.0.1:${PORT}/`,
      ]);
      console.log("  wrote " + path.relative(ROOT, shot));
    }
    console.log("\nthe book editor ran in a browser, on WebGL, and answered input");
  } finally {
    host.kill("SIGKILL");
  }
}

main().catch((e) => {
  console.error("browser smoke failed:", e && e.message ? e.message : e);
  process.exit(1);
});
