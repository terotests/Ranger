// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Running one script through each engine the benchmarks compare. Every
// engine gets the same text and prints through `print`; a script reports
// its own timings, so no engine's parse or setup is counted.
import fs from "fs";
import os from "os";
import path from "path";
import vm from "vm";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

export const CER = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const ROOT = path.resolve(CER, "../../../..");

export const PRINT_PRELUDE = `
function print() {
  var s = "";
  for (var i = 0; i < arguments.length; i++) {
    if (i) s += " ";
    s += String(arguments[i]);
  }
  console.log(s);
}
`;

export function has(cmd) {
  const r = spawnSync("sh", ["-c", cmd + " >/dev/null 2>&1"]);
  return r.status === 0;
}

function tmpFile(text) {
  const f = path.join(os.tmpdir(), "cer-bench-" + process.pid + "-" + Math.floor(Math.random() * 1e9) + ".js");
  fs.writeFileSync(f, text);
  return f;
}

function lines(text) {
  return String(text || "").split(/\r?\n/).filter((l) => l.length);
}

/** Node itself, in a fresh context. */
export function runNode(src) {
  const out = [];
  const ctx = { console: { log: (...a) => out.push(a.map(String).join(" ")) }, performance };
  vm.createContext(ctx);
  vm.runInContext(PRINT_PRELUDE + src, ctx);
  return out;
}

/** ComponentEngine compiled to JavaScript (gallery/game_engine/v2/interp),
 * in a process of its own with a time limit (CE_TIMEOUT_MS, default 300 s). */
export function runComponentEngine(src) {
  const f = tmpFile(PRINT_PRELUDE + src);
  const limit = Number(process.env.CE_TIMEOUT_MS || 300000);
  const r = spawnSync(process.execPath, ["--stack-size=8000", path.join(CER, "bench/ce_runner.cjs"), f], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    timeout: limit,
  });
  fs.unlinkSync(f);
  const out = lines(r.stdout);
  if (r.error) out.push("timeout: no result in " + limit / 1000 + " s");
  return out;
}

/** CEr built by cargo. */
export function runCerNative(src) {
  const bin = path.join(CER, "target/release/cer");
  const f = tmpFile(src);
  const r = spawnSync(bin, [f], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, timeout: 600000 });
  fs.unlinkSync(f);
  return lines(r.stdout).concat(lines(r.stderr));
}

/** CEr compiled to JavaScript by rgrc (bin/Cer.cjs), in a process of its
 * own with a time limit (CE_TIMEOUT_MS) and a 4 GB heap. */
export function runCerJs(src) {
  const f = tmpFile(src);
  const limit = Number(process.env.CE_TIMEOUT_MS || 300000);
  const r = spawnSync(process.execPath, ["--max-old-space-size=4096", path.join(CER, "bench/cer_js_runner.cjs"), f], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    timeout: limit,
  });
  fs.unlinkSync(f);
  const out = lines(r.stdout);
  if (r.error) out.push("timeout: no result in " + limit / 1000 + " s");
  else if (r.status !== 0) out.push("exited with " + (r.status ?? r.signal) + (/heap out of memory/.test(r.stderr) ? " (out of memory)" : ""));
  return out;
}

/** QuickJS (`qjs`, or the binary QJS names), for comparison. */
export function runQuickJs(src) {
  const f = tmpFile(PRINT_PRELUDE + src);
  const r = spawnSync(process.env.QJS || "qjs", [f], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, timeout: 600000 });
  fs.unlinkSync(f);
  const out = lines(r.stdout).concat(lines(r.stderr));
  if (r.error) out.push(String(r.error.message));
  return out;
}

/** CEr compiled by rgrc to C++ or Go (bin/cer_main_<target>). */
export function runCerBinary(target, src) {
  const bin = path.join(CER, "bin", "cer_main_" + target);
  const f = tmpFile(src);
  const r = spawnSync(bin, [path.dirname(f), path.basename(f)], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, timeout: 600000 });
  fs.unlinkSync(f);
  return lines(r.stdout).concat(lines(r.stderr));
}

export function engines(want) {
  const all = {
    node: runNode,
    "ce-js": runComponentEngine,
    "cer-rust": runCerNative,
    "cer-js": runCerJs,
    "cer-cpp": (s) => runCerBinary("cpp", s),
    "cer-go": (s) => runCerBinary("go", s),
    qjs: runQuickJs,
  };
  const out = {};
  for (const k of want) {
    if (all[k]) out[k] = all[k];
  }
  return out;
}

/** Builds what the chosen engines need. */
export function build(want) {
  const run = (cmd, args, cwd) => {
    const r = spawnSync(cmd, args, { cwd: cwd || ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
    const log = (r.stdout || "") + (r.stderr || "");
    if (r.status !== 0 || log.includes("[FAIL]")) {
      throw new Error(cmd + " " + args.join(" ") + "\n" + log.slice(-3000));
    }
  };
  if (want.includes("cer-rust")) {
    run("cargo", ["build", "--release", "--quiet", "--manifest-path", path.join(CER, "Cargo.toml")]);
  }
  if (want.includes("cer-js")) {
    run("node", ["dist/rgrc.js", "-es6", "-nodemodule", "gallery/game_engine/v2/cer/src/lib.rs", "-d=gallery/game_engine/v2/cer/bin", "-o=Cer.cjs"]);
  }
  if (want.includes("ce-js") && !fs.existsSync(path.join(ROOT, "gallery/game_engine/v2/interp/bin/engine_module.cjs"))) {
    run("bash", ["scripts/build-engine-module.sh"]);
  }
  for (const t of ["cpp", "go"]) {
    if (!want.includes("cer-" + t)) continue;
    const dir = path.join(os.tmpdir(), "cer-" + t);
    fs.mkdirSync(dir, { recursive: true });
    const srcName = "cer_main." + t;
    run("node", ["dist/rgrc.js", "-l=" + t, "gallery/game_engine/v2/cer/bench/CerMain.rgr", "-d=" + dir, "-o=" + srcName]);
    const bin = path.join(CER, "bin", "cer_main_" + t);
    if (t === "cpp") {
      run("g++", ["-std=c++17", "-O2", "-o", bin, path.join(dir, srcName)]);
    } else {
      run("go", ["build", "-o", bin, srcName], dir);
    }
  }
}
