#!/usr/bin/env node
// Times `rgrc` on generated strict-Rust programs of growing size, per target.
//
//   node scripts/rust-compile-bench.mjs --sizes=10,50,200 --langs=es6,go --runs=1
//
// Each unit is two structs, an enum and a function (33 lines); main calls
// every unit. Results: docs/plans/RUST_COMPILE_BENCH.md.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? "1"];
  })
);
const sizes = (args.sizes ?? "10,50,200").split(",").map(Number);
const langs = (args.langs ?? "es6,go").split(",");
const runs = Number(args.runs ?? 1);
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const rgrc = path.join(root, "dist", "rgrc.js");
const work = fs.mkdtempSync(path.join(os.tmpdir(), "rgr-bench-"));

function unit(i) {
  return `
#[derive(Clone, Copy, Debug)]
struct P${i} { x: i64, y: i64 }
impl P${i} {
    fn new(x: i64, y: i64) -> P${i} { P${i} { x, y } }
    fn dist(&self, o: &P${i}) -> i64 { (self.x - o.x).abs() + (self.y - o.y).abs() }
    fn shift(&mut self, dx: i64) { self.x += dx; }
}
#[derive(Clone)]
struct Poly${i} { name: String, pts: Vec<P${i}> }
impl Poly${i} {
    fn perim(&self) -> i64 {
        let mut t = 0;
        let n = self.pts.len();
        for k in 0..n { let a = self.pts[k]; let b = self.pts[(k + 1) % n]; t += a.dist(&b); }
        t
    }
}
enum Sh${i} { Circle(f64), Rect { w: f64, h: f64 }, Empty }
impl Sh${i} {
    fn area(&self) -> f64 { match self { Sh${i}::Circle(r) => 3.0 * r * r, Sh${i}::Rect { w, h } => w * h, Sh${i}::Empty => 0.0 } }
}
fn unit${i}() -> i64 {
    let mut p = P${i}::new(3, ${i});
    p.shift(2);
    let q = Poly${i} { name: String::from("u${i}"), pts: vec![P${i}::new(0, 0), p, P${i}::new(2, 2)] };
    let s = Sh${i}::Rect { w: 2.0, h: 3.0 };
    let c = Sh${i}::Circle(1.0);
    let e = Sh${i}::Empty;
    println!("{} {} {} {} {}", q.name, q.perim(), s.area(), c.area(), e.area());
    q.perim()
}
`;
}

function program(n) {
  let s = "";
  for (let i = 0; i < n; i++) s += unit(i);
  s += "\nfn main() {\n    let mut t = 0;\n";
  for (let i = 0; i < n; i++) s += `    t += unit${i}();\n`;
  return s + '    println!("{}", t);\n}\n';
}

console.log("units  lines  " + langs.map((l) => l.padStart(8)).join(""));
for (const n of sizes) {
  const file = path.join(work, `gen${n}.rs`);
  const src = program(n);
  fs.writeFileSync(file, src);
  const cols = langs.map((lang) => {
    let best = Infinity;
    for (let r = 0; r < runs; r++) {
      const t0 = process.hrtime.bigint();
      execFileSync("node", [rgrc, `-l=${lang}`, file, `-d=${work}`, `-o=gen${n}.${lang}`], {
        stdio: "ignore",
      });
      best = Math.min(best, Number(process.hrtime.bigint() - t0) / 1e9);
    }
    return (best.toFixed(2) + "s").padStart(8);
  });
  console.log(`${String(n).padStart(5)} ${String(src.split("\n").length).padStart(6)}  ${cols.join("")}`);
}
fs.rmSync(work, { recursive: true, force: true });
