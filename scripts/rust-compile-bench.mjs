#!/usr/bin/env node
// rust-compile-bench.mjs — how long rgrc takes to compile a Rust (.rs)
// source compared with rustc.
//
//   node scripts/rust-compile-bench.mjs [--sizes=1,10,50,200] [--runs=3]
//        [--native=tmp/selfhost/rangerc] [--no-fixtures]
//
// --native is rgrc built as a C++ program (the default path is where the
// steps below put it; the column is left out when the file is missing):
//   node dist/rgrc.js -l=cpp compiler/Compiler.rgr -nodecli -d=tmp/selfhost -o=ranger_compiler.cpp
//   g++ -std=c++17 -O2 -o tmp/selfhost/rangerc tmp/selfhost/ranger_compiler.cpp
//   cp compiler/Lang.rgr lib/stdops.rgr tmp/selfhost/ && cp -r lib tmp/selfhost/
//
// Two sets of inputs:
//   1. tests/fixtures/rust_strict/*.rs (small programs, rustc-checked)
//   2. a generated program of N "units" (traits, dyn dispatch, generic
//      struct, enum + match, closures, Vec/HashMap loops), about 110 lines
//      per unit, to see how each compiler scales with source size.
//
// Measured per input (wall time, best of --runs):
//   node es6        dist/rgrc.js, .rs -> JavaScript (parse, lower, type check, write)
//   native es6      the C++ build of rgrc, .rs -> JavaScript
//   native go       the C++ build of rgrc, .rs -> Go source
//   native go+build .rs -> Go -> native binary (go build), end to end
// (the C++ build of rgrc fails writing -l=cpp for a .rs input, so the
// native-binary path goes through Go)
//   rustc check     rustc --emit=metadata (parse, type/borrow check, no codegen)
//   rustc debug     rustc (no -O): a native binary
//   rustc -O        rustc -O: an optimised native binary
// Results: docs/plans/RUST_COMPILE_BENCH.md.
// The generated program's output is compared between the rustc build and the
// rgrc es6 build, so the two compile the same program.

import { spawnSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? "1"];
  }),
);
const SIZES = (args.sizes ?? "1,10,50,200").split(",").map(Number);
const RUNS = Number(args.runs ?? 3);
const NODE_RGRC = ["node", path.join(ROOT, "dist/rgrc.js")];
const NATIVE = path.resolve(ROOT, args.native ?? "tmp/selfhost/rangerc");
const HAS_NATIVE = fs.existsSync(NATIVE);
const OUT = fs.mkdtempSync(path.join(os.tmpdir(), "rgr-rs-bench-"));

function time(cmd, argv, cwd = OUT, before) {
  let best = Infinity;
  let last;
  for (let i = 0; i < RUNS; i++) {
    if (before) before(i);
    const t0 = process.hrtime.bigint();
    last = spawnSync(cmd, argv, { cwd, encoding: "utf8", maxBuffer: 1 << 28 });
    const ms = Number(process.hrtime.bigint() - t0) / 1e6;
    const log = (last.stdout ?? "") + (last.stderr ?? "");
    if (last.status !== 0 || log.includes("[FAIL]")) {
      return { ms: NaN, err: log.split("\n").slice(0, 6).join("\n") };
    }
    best = Math.min(best, ms);
  }
  return { ms: best };
}

function rgrc(cmd, file, lang, name) {
  return time(cmd[0], [...cmd.slice(1), `-l=${lang}`, file, `-d=${OUT}`, `-o=${name}`]);
}

function measure(file, tag) {
  const r = {};
  r["node es6"] = rgrc(NODE_RGRC, file, "es6", `${tag}_node.js`);
  const rg = HAS_NATIVE ? [NATIVE] : NODE_RGRC;
  if (HAS_NATIVE) r["native es6"] = rgrc(rg, file, "es6", `${tag}.js`);
  const gdir = path.join(OUT, `${tag}_go`);
  fs.mkdirSync(gdir, { recursive: true });
  const go = time(rg[0], [...rg.slice(1), "-l=go", file, `-d=${gdir}`, "-o=main.go"]);
  r["native go"] = go;
  if (!isNaN(go.ms)) {
    if (!fs.existsSync(path.join(gdir, "go.mod"))) fs.writeFileSync(path.join(gdir, "go.mod"), "module bench\n\ngo 1.21\n");
    // the standard library comes from the cache (as rustc's std is prebuilt);
    // a comment added before each run makes go compile the program itself again
    const main = path.join(gdir, "main.go");
    const gb = time("go", ["build", "-o", "prog", "."], gdir, (i) =>
      fs.appendFileSync(main, `\n// run ${i} ${Date.now()}\n`));
    r["native go+build"] = { ms: go.ms + gb.ms, err: gb.err };
  } else r["native go+build"] = { ms: NaN };
  r["rustc check"] = time("rustc", ["--edition", "2021", "--emit=metadata", "-A", "warnings", file, "-o", `${tag}.rmeta`]);
  r["rustc debug"] = time("rustc", ["--edition", "2021", "-A", "warnings", file, "-o", `${tag}_rs`]);
  r["rustc -O"] = time("rustc", ["--edition", "2021", "-O", "-A", "warnings", file, "-o", `${tag}_rsO`]);
  return r;
}

// One unit of the generated program. Everything is suffixed with the unit
// number so N units are N times the declarations, not repeats.
function unit(i) {
  return `
trait Animal${i} {
    fn name(&self) -> String;
    fn sound(&self) -> String;
    fn speak(&self) -> String {
        format!("{} says {}", self.name(), self.sound())
    }
}

struct Dog${i} {
    name: String,
    age: i64,
}

struct Cat${i} {
    lives: i64,
}

impl Animal${i} for Dog${i} {
    fn name(&self) -> String {
        format!("{}{}", self.name, self.age)
    }
    fn sound(&self) -> String {
        String::from("woof")
    }
}

impl Animal${i} for Cat${i} {
    fn name(&self) -> String {
        format!("cat{}", self.lives)
    }
    fn sound(&self) -> String {
        String::from("meow")
    }
}

#[derive(Debug, Clone, PartialEq)]
enum Shape${i} {
    Circle(f64),
    Rect { w: f64, h: f64 },
    Empty,
}

impl Shape${i} {
    fn area(&self) -> f64 {
        match self {
            Shape${i}::Circle(r) => 3.0 * r * r,
            Shape${i}::Rect { w, h } => w * h,
            Shape${i}::Empty => 0.0,
        }
    }
}

struct Stack${i}<T> {
    items: Vec<T>,
}

impl<T: Clone> Stack${i}<T> {
    fn new() -> Self {
        Stack${i} { items: Vec::new() }
    }
    fn push(&mut self, x: T) {
        self.items.push(x);
    }
    fn pop(&mut self) -> Option<T> {
        self.items.pop()
    }
}

fn largest${i}<T: PartialOrd + Copy>(items: &[T]) -> T {
    let mut best = items[0];
    for &x in items {
        if x > best {
            best = x;
        }
    }
    best
}

fn run${i}() -> i64 {
    let zoo: Vec<Box<dyn Animal${i}>> = vec![
        Box::new(Dog${i} { name: String::from("rex"), age: ${i} }),
        Box::new(Cat${i} { lives: 9 }),
    ];
    let mut total: i64 = 0;
    for a in &zoo {
        total += a.speak().chars().count() as i64;
    }
    let shapes = vec![Shape${i}::Circle(1.0), Shape${i}::Rect { w: 2.0, h: ${i + 1}.0 }, Shape${i}::Empty];
    let mut area = 0.0;
    for s in &shapes {
        area += s.area();
    }
    let mut st: Stack${i}<i64> = Stack${i}::new();
    for k in 0..10 {
        st.push(k * ${i + 1});
    }
    while let Some(top) = st.pop() {
        if top % 2 == 0 {
            total += top;
        }
    }
    let add = |a: i64, b: i64| a + b;
    let mut counts: HashMap<String, i64> = HashMap::new();
    for w in vec!["a", "b", "a"] {
        let c = counts.entry(w.to_string()).or_insert(0);
        *c += 1;
    }
    total = add(total, largest${i}(&[3, 9, ${i}, 7]));
    total = add(total, counts.len() as i64);
    total + area as i64
}
`;
}

function program(n) {
  let s = "use std::collections::HashMap;\n";
  for (let i = 0; i < n; i++) s += unit(i);
  s += "\nfn main() {\n    let mut sum: i64 = 0;\n";
  for (let i = 0; i < n; i++) s += `    sum += run${i}();\n`;
  s += '    println!("{}", sum);\n}\n';
  return s;
}

const COLS = ["node es6", ...(HAS_NATIVE ? ["native es6"] : []), "native go", "native go+build",
  "rustc check", "rustc debug", "rustc -O"];
if (!HAS_NATIVE) console.log(`${NATIVE} not found: the "native" columns use dist/rgrc.js`);
const fmt = (x) => (isNaN(x.ms) ? "fail" : `${Math.round(x.ms)} ms`);
const row = (name, lines, r) => `| ${name} | ${lines} | ${COLS.map((c) => fmt(r[c])).join(" | ")} |`;
const header = `| input | lines | ${COLS.join(" | ")} |\n|---|---:|${COLS.map(() => "---:").join("|")}|`;

console.log(`rgrc: ${NODE_RGRC.join(" ")}${HAS_NATIVE ? `, native ${NATIVE}` : ""}`);
console.log(spawnSync("rustc", ["--version"], { encoding: "utf8" }).stdout.trim());
console.log(`node ${process.version}, ${os.cpus().length} cpus, best of ${RUNS} runs\n`);

// Floor: an empty program shows the fixed cost of starting each compiler.
const empty = path.join(OUT, "empty.rs");
fs.writeFileSync(empty, "fn main() {}\n");
console.log("### Startup (fn main() {})\n");
console.log(header);
console.log(row("empty", 1, measure(empty, "empty")));

console.log("\n### Generated program\n");
console.log(header);
const failures = [];
for (const n of SIZES) {
  const file = path.join(OUT, `gen${n}.rs`);
  const src = program(n);
  fs.writeFileSync(file, src);
  const r = measure(file, `gen${n}`);
  console.log(row(`${n} units`, src.split("\n").length, r));
  for (const c of COLS) if (r[c].err) failures.push(`${n} units / ${c}:\n${r[c].err}`);
  // same program: compare the output of the rustc build with the es6 one
  const a = spawnSync(path.join(OUT, `gen${n}_rs`), { encoding: "utf8" }).stdout;
  const b = spawnSync("node", [path.join(OUT, `gen${n}_node.js`)], { encoding: "utf8" }).stdout;
  const c = spawnSync(path.join(OUT, `gen${n}_go`, "prog"), { encoding: "utf8" }).stdout;
  if (a !== b || a !== c)
    failures.push(`${n} units: rustc ${JSON.stringify(a)}, rgrc es6 ${JSON.stringify(b)}, rgrc go ${JSON.stringify(c)}`);
}

if (!args["no-fixtures"]) {
  console.log("\n### tests/fixtures/rust_strict\n");
  console.log(header);
  const dir = path.join(ROOT, "tests/fixtures/rust_strict");
  const tot = Object.fromEntries(COLS.map((c) => [c, { ms: 0 }]));
  let lines = 0;
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".rs")).sort()) {
    const file = path.join(dir, f);
    const src = fs.readFileSync(file, "utf8");
    if (src.includes("use ranger::")) continue; // needs the prelude crate
    const r = measure(file, f.replace(/\.rs$/, ""));
    const n = src.split("\n").length;
    lines += n;
    console.log(row(f, n, r));
    for (const c of COLS) tot[c].ms += r[c].ms;
  }
  console.log(row("**total**", lines, tot));
}

if (failures.length) console.log("\nFailures:\n" + failures.join("\n\n"));
fs.rmSync(OUT, { recursive: true, force: true });
