#!/usr/bin/env node
// Run javascript-zoo's Kangax compat-table suite through Ranger ComponentEngine
// and report the same weighted ES6 / ES2016+ scores zoo.js.org publishes.
//
//   node zoo-compat-score.cjs [--root=/tmp/javascript-zoo/conformance]
//                             [--suite=compat-table/es6,compat-table/es2016,...]
//                             [--jobs=N] [--limit=N]
//
// Pass/fail matching and weights follow harness/run.py in ivankra/javascript-zoo.
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { Worker, isMainThread, parentPort, workerData } = require("worker_threads");

const ROOT_DEFAULT = "/tmp/javascript-zoo/conformance";
const MODULE = path.resolve(
  __dirname,
  "..",
  "..",
  "bin",
  "engine_module.cjs",
);

const HEADER_RE = /^\/\/ compat-table: (.*)/;
const GROUP_RE = /^(.*) \((tiny|small|medium|large)\) > .*/;
const GROUP_SIZE = { tiny: 1, small: 2, medium: 4, large: 8 };

function parseArgs(argv) {
  const o = {
    root: ROOT_DEFAULT,
    suites: null,
    jobs: Math.max(1, (os.cpus() || []).length || 2),
    limit: Infinity,
    json: null,
  };
  for (const a of argv) {
    if (a.startsWith("--root=")) o.root = a.slice(7);
    else if (a.startsWith("--suite=")) {
      o.suites = a
        .slice(8)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (a.startsWith("--jobs=")) o.jobs = Number(a.slice(7));
    else if (a.startsWith("--limit=")) o.limit = Number(a.slice(8));
    else if (a.startsWith("--json=")) o.json = a.slice(7);
    else if (a === "--json") o.json = "-";
    else {
      console.error("unknown arg", a);
      process.exit(2);
    }
  }
  if (!o.suites) {
    o.suites = [
      "compat-table/es6",
      "compat-table/es2016",
      "compat-table/es2017",
      "compat-table/es2018",
      "compat-table/es2019",
      "compat-table/es2020",
      "compat-table/es2021",
      "compat-table/es2022",
      "compat-table/es2023",
      "compat-table/es2024",
      "compat-table/es2025",
      "compat-table/next",
      "compat-table/intl",
    ];
  }
  return o;
}

function walkJs(dir, out) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walkJs(p, out);
    else if (e.name.endsWith(".js")) out.push(p);
  }
  return out;
}

function readHeader(abs) {
  const text = fs.readFileSync(abs, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const hm = HEADER_RE.exec(line);
    if (hm) return hm[1];
    if (!line.startsWith("//") && !line.startsWith("#!")) break;
  }
  return null;
}

function computeWeights(rels, root) {
  const headers = new Map();
  for (const rel of rels) {
    if (!rel.startsWith("compat-table/")) continue;
    const h = readHeader(path.join(root, rel));
    if (h) headers.set(rel, h);
  }
  const groups = new Map();
  for (const [rel, header] of headers) {
    const m = GROUP_RE.exec(header);
    if (m) {
      const g = m[1];
      if (!groups.has(g)) groups.set(g, []);
      groups.get(g).push(rel);
    }
  }
  const weights = new Map();
  for (const [rel, header] of headers) {
    const m = GROUP_RE.exec(header);
    if (!m) weights.set(rel, 1);
    else weights.set(rel, GROUP_SIZE[m[2]] / groups.get(m[1]).length);
  }
  return weights;
}

function classify(out, basename) {
  const passRe = new RegExp(escapeRe(basename) + ": OK");
  const failRe = new RegExp(
    escapeRe(basename) + ": (?:failed|exception)",
  );
  if (passRe.test(out)) return "pass";
  if (failRe.test(out)) return "fail";
  return "fail";
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function runOne(mod, abs) {
  const ComponentEngine = mod.ComponentEngine;
  const EvalValue = mod.EvHandle || mod.EvalValue;
  const src = fs.readFileSync(abs, "utf8");
  const lines = [];
  const origLog = console.log;
  console.log = function () {
    const s = Array.prototype.map
      .call(arguments, (a) => String(a))
      .join(" ");
    // ComponentEngine prefixes with [tsx]; keep both forms searchable.
    lines.push(s.replace(/^\[tsx\]\s*/, ""));
  };
  try {
    const e = new ComponentEngine();
    e.quiet = true;
    e.liveClock = true;
    e.maxLoopIterations = 1000000000;
    try {
      e.loadScript(src + "\nfunction __zoo_done__() { return 'done'; }\n");
      e.callFunction("__zoo_done__", EvalValue.null());
    } catch (ex) {
      lines.push(
        "Uncaught exception: " +
          (ex && ex.message ? ex.message : String(ex)),
      );
    }
  } finally {
    console.log = origLog;
  }
  return lines.join("\n");
}

function bucketOf(rel) {
  // compat-table/es6/... → es6; compat-table/es2016/... → es2016; etc.
  const parts = rel.split("/");
  if (parts[0] !== "compat-table" || parts.length < 2) return "other";
  return parts[1];
}

function pct(n, d) {
  if (!d) return null;
  return Math.round((10000 * n) / d) / 100;
}

function finalize(acc) {
  const total = acc.pass + acc.fail + acc.skip;
  const wTotal = acc.wPass + acc.wFail + acc.wSkip;
  return {
    passed: acc.pass,
    failed: acc.fail,
    skipped: acc.skip,
    total,
    pass_percent: pct(acc.pass, total),
    weighted_passed: Math.round(acc.wPass * 1000) / 1000,
    weighted_total: Math.round(wTotal * 1000) / 1000,
    weighted_pass_percent: pct(acc.wPass, wTotal),
  };
}

function emptyAcc() {
  return { pass: 0, fail: 0, skip: 0, wPass: 0, wFail: 0, wSkip: 0 };
}

function add(acc, verdict, w) {
  const weight = w == null ? 1 : w;
  if (verdict === "pass") {
    acc.pass++;
    acc.wPass += weight;
  } else if (verdict === "skip") {
    acc.skip++;
    acc.wSkip += weight;
  } else {
    acc.fail++;
    acc.wFail += weight;
  }
}

if (!isMainThread) {
  const mod = require(workerData.module);
  parentPort.on("message", (task) => {
    if (task === null) {
      parentPort.postMessage(null);
      return;
    }
    const { abs, rel, weight } = task;
    let out = "";
    let verdict = "fail";
    try {
      out = runOne(mod, abs);
      verdict = classify(out, path.basename(abs));
    } catch (ex) {
      out = String(ex && ex.stack ? ex.stack : ex);
      verdict = "fail";
    }
    parentPort.postMessage({ rel, weight, verdict, out: out.slice(0, 400) });
  });
} else {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

async function main() {
  const opt = parseArgs(process.argv.slice(2));
  if (!fs.existsSync(opt.root)) {
    console.error("missing conformance root:", opt.root);
    process.exit(2);
  }
  if (!fs.existsSync(MODULE)) {
    console.error("missing engine module:", MODULE);
    console.error("build with: bash scripts/build-engine-module.sh");
    process.exit(2);
  }

  const files = [];
  for (const suite of opt.suites) {
    const dir = path.join(opt.root, suite);
    for (const abs of walkJs(dir, [])) {
      files.push({
        abs,
        rel: path.relative(opt.root, abs).split(path.sep).join("/"),
      });
    }
  }
  files.sort((a, b) => (a.rel < b.rel ? -1 : a.rel > b.rel ? 1 : 0));
  if (files.length > opt.limit) files.length = opt.limit;

  const weights = computeWeights(
    files.map((f) => f.rel),
    opt.root,
  );

  console.log("engine :", MODULE);
  console.log("root   :", opt.root);
  console.log("tests  :", files.length);
  console.log("jobs   :", opt.jobs);
  console.log("");

  const byBucket = new Map();
  const all = emptyAcc();
  const es2016plus = emptyAcc();
  const failures = [];
  let done = 0;

  const jobs = Math.min(opt.jobs, Math.max(1, files.length));
  const workers = [];
  const queue = files.map((f) => ({
    abs: f.abs,
    rel: f.rel,
    weight: weights.has(f.rel) ? weights.get(f.rel) : 1,
  }));

  await new Promise((resolve, reject) => {
    let remaining = queue.length;
    let next = 0;
    if (remaining === 0) return resolve();

    function onResult(msg) {
      if (msg == null) return;
      done++;
      remaining--;
      const bucket = bucketOf(msg.rel);
      if (!byBucket.has(bucket)) byBucket.set(bucket, emptyAcc());
      add(byBucket.get(bucket), msg.verdict, msg.weight);
      add(all, msg.verdict, msg.weight);
      if (/^es20\d\d$/.test(bucket)) {
        add(es2016plus, msg.verdict, msg.weight);
      }
      if (msg.verdict !== "pass") {
        failures.push({
          rel: msg.rel,
          weight: msg.weight,
          out: msg.out,
        });
      }
      if (done % 50 === 0 || remaining === 0) {
        process.stderr.write(
          `\rprogress ${done}/${files.length}  pass=${all.pass} fail=${all.fail}`,
        );
      }
      if (remaining === 0) {
        process.stderr.write("\n");
        resolve();
        return;
      }
    }

    function feed(w) {
      if (next >= queue.length) {
        w.postMessage(null);
        return;
      }
      w.postMessage(queue[next++]);
    }

    for (let i = 0; i < jobs; i++) {
      const w = new Worker(__filename, {
        workerData: { module: MODULE },
      });
      workers.push(w);
      w.on("message", (msg) => {
        if (msg === null) {
          w.terminate();
          return;
        }
        try {
          onResult(msg);
        } catch (e) {
          reject(e);
          return;
        }
        feed(w);
      });
      w.on("error", reject);
      feed(w);
    }
  });

  const summary = {
    es6: byBucket.has("es6") ? finalize(byBucket.get("es6")) : null,
    "es2016+": finalize(es2016plus),
    next: byBucket.has("next") ? finalize(byBucket.get("next")) : null,
    intl: byBucket.has("intl") ? finalize(byBucket.get("intl")) : null,
    all: finalize(all),
    by_edition: {},
  };
  for (const [b, acc] of [...byBucket.entries()].sort((a, c) =>
    a[0] < c[0] ? -1 : 1,
  )) {
    summary.by_edition[b] = finalize(acc);
  }

  console.log("");
  console.log("=== zoo.js.org-style weighted compat-table scores ===");
  console.log("(same suite + weights as https://zoo.js.org/ ES6 / ES2016+ columns)");
  console.log("");
  const row = (name, s) => {
    if (!s) {
      console.log(`${name.padEnd(12)}  (no tests)`);
      return;
    }
    console.log(
      `${name.padEnd(12)}  ${String(s.weighted_pass_percent).padStart(6)}%` +
        `  (weighted ${s.weighted_passed}/${s.weighted_total}` +
        `; raw ${s.passed}/${s.total})`,
    );
  };
  row("ES6", summary.es6);
  row("ES2016+", summary["es2016+"]);
  console.log("");
  console.log("--- per edition ---");
  for (const [b, s] of Object.entries(summary.by_edition)) {
    row(b, s);
  }
  console.log("");
  console.log(
    `failures: ${failures.length}  (showing up to 40)`,
  );
  for (const f of failures.slice(0, 40)) {
    const why = (f.out || "")
      .split(/\n/)
      .find((l) => /: (failed|exception)/.test(l) || /Uncaught/.test(l));
    console.log(
      `  ${f.rel}  w=${Math.round(f.weight * 1000) / 1000}` +
        (why ? `  — ${why.trim().slice(0, 120)}` : ""),
    );
  }

  if (opt.json) {
    const payload = {
      engine: "ranger-component-engine",
      branch_note: "claude/es6-builtins / cursor/zoo-compat-score-7fe2",
      suite: "javascript-zoo/conformance/compat-table",
      methodology:
        "weighted Kangax compat-table scores as published on zoo.js.org",
      summary,
      failure_count: failures.length,
      failures: failures.map((f) => ({
        rel: f.rel,
        weight: f.weight,
        out: f.out,
      })),
    };
    const text = JSON.stringify(payload, null, 2);
    if (opt.json === "-") console.log(text);
    else {
      fs.writeFileSync(opt.json, text);
      console.log("wrote", opt.json);
    }
  }
}
