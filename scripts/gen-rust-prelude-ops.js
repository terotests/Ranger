#!/usr/bin/env node
// SPDX-License-Identifier: MIT
//
// Generates runtime/rust/ranger/src/ops.rs, the operator layer of the `ranger`
// prelude crate (PLAN_RUST_SYNTAX.md §3.2, stage R4), from the `rust`
// templates in compiler/Lang.rgr, so it cannot drift from what the Rust
// target writes.
//
// An operator is taken when
//   - its name has one signature (Rust has no overloading),
//   - every argument and the return value is int / double / boolean / string
//     (or void for the return),
//   - its rust template is text and (e N) only, plus polyfills.
// Each becomes `pub fn <name>(…) -> …`. The file is then built with rustc and
// any function rustc rejects is dropped, so the output always compiles; the
// dropped and skipped names are listed at the end of the file.
//
// Usage: node scripts/gen-rust-prelude-ops.js [--check]
//   --check   exit 1 when the committed ops.rs differs from a fresh run

const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const LANG = path.join(ROOT, "compiler", "Lang.rgr");
const OUT = path.join(ROOT, "runtime", "rust", "ranger", "src", "ops.rs");
// the same names for the lowering, which turns a call of one into the operator
const NAMES = path.join(ROOT, "compiler", "frontend", "rust", "lower", "RustPreludeOps.rgr");

// ---------------------------------------------------------------- reader

function tokenize(src) {
  const toks = [];
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    if (c === ";") {
      while (i < n && src[i] !== "\n") i++;
      continue;
    }
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    if (c === "(" || c === ")" || c === "{" || c === "}") {
      toks.push({ t: c });
      i++;
      continue;
    }
    if (c === '"' || c === "'") {
      let j = i + 1;
      let s = "";
      while (j < n && src[j] !== c) {
        if (src[j] === "\\" && j + 1 < n) {
          const e = src[j + 1];
          s += e === "n" ? "\n" : e === "t" ? "\t" : e;
          j += 2;
          continue;
        }
        s += src[j];
        j++;
      }
      toks.push({ t: "str", v: s });
      i = j + 1;
      continue;
    }
    let j = i;
    while (j < n && !/[\s(){};"']/.test(src[j])) j++;
    toks.push({ t: "word", v: src.slice(i, j) });
    i = j;
  }
  return toks;
}

// Nested groups: { kind: "(" | "{", items: [...] }; tokens stay tokens.
function group(toks) {
  const root = { kind: "{", items: [] };
  const stack = [root];
  for (const tk of toks) {
    const top = stack[stack.length - 1];
    if (tk.t === "(" || tk.t === "{") {
      const g = { kind: tk.t, items: [] };
      top.items.push(g);
      stack.push(g);
    } else if (tk.t === ")" || tk.t === "}") {
      if (stack.length > 1) stack.pop();
    } else {
      top.items.push(tk);
    }
  }
  return root;
}

const isWord = (x, v) => x && x.t === "word" && (v === undefined || x.v === v);

// Every operator: { name, ret, args: [{name, type}], rust: group | null }
function operators(root) {
  const out = [];
  const walk = (g) => {
    const it = g.items;
    for (let k = 0; k < it.length; k++) {
      const x = it[k];
      if (!x.kind) continue;
      if (x.kind === "{") {
        const ti = x.items.findIndex((y) => isWord(y, "templates"));
        const tg = ti >= 0 ? x.items[ti + 1] : null;
        if (tg && tg.kind === "{") {
          // header: name sig ( args ) [annotations] — the words before this
          // brace group back to the previous group-ending item
          let a = k - 1;
          while (a >= 0 && !(it[a].kind === "(" && isWord(it[a - 1]) && isWord(it[a - 2]))) a--;
          if (a >= 2) {
            const name = it[a - 2].v;
            const sig = it[a - 1].v;
            const ci = sig.lastIndexOf(":");
            const ret = ci >= 0 ? sig.slice(ci + 1) : "void";
            const retOptional = sig.includes("@(optional)");
            const args = [];
            const ag = it[a].items;
            let bad = false;
            for (const w of ag) {
              if (!isWord(w)) {
                bad = true;
                continue;
              }
              const p = w.v.indexOf(":");
              args.push({ name: p >= 0 ? w.v.slice(0, p) : w.v, type: p >= 0 ? w.v.slice(p + 1) : "" });
            }
            let rust = null;
            for (let q = 0; q < tg.items.length; q++) {
              if (isWord(tg.items[q], "rust") && tg.items[q + 1] && tg.items[q + 1].kind === "(") {
                rust = tg.items[q + 1];
              }
            }
            out.push({ name, ret, retOptional, args, rust, bad });
          }
          continue;
        }
      }
      walk(x);
    }
  };
  walk(root);
  return out;
}

// ---------------------------------------------------------------- writer

const RTYPE = { int: "i64", double: "f64", boolean: "bool", string: "&str" };
const RRET = { int: "i64", double: "f64", boolean: "bool", string: "String", void: "()" };

// std prelude names and Rust keywords a glob import must not shadow, and
// operators the §3.4 subset spells with Rust's own syntax
const RESERVED = new Set(
  (
    "drop Some None Ok Err Box Vec String Option Result Default Clone Copy " +
    "as break const continue crate else enum extern false fn for if impl in let loop match mod move mut " +
    "pub ref return self Self static struct super trait true type unsafe use where while async await dyn " +
    "abstract become box do final macro override priv typeof unsized virtual yield try union " +
    "print println format panic assert"
  ).split(/\s+/)
);

// operators whose answer is in the target's own string unit (UTF-16 on
// JavaScript, bytes on Rust): a strict module counts in the unit it names
// (D7, §5), so these are not offered
const UNIT_DEPENDENT = new Set(["strlen", "rawbytechar"]);

function body(op, polys) {
  let s = "";
  for (const x of op.rust.items) {
    if (x.t === "str") {
      s += x.v;
      continue;
    }
    if (isWord(x, "nl")) {
      s += "\n";
      continue;
    }
    if (x.kind === "(") {
      const h = x.items[0];
      if (isWord(h, "e") && isWord(x.items[1])) {
        const i = parseInt(x.items[1].v, 10);
        if (!(i >= 1 && i <= op.args.length)) return null;
        s += op.args[i - 1].rname;
        continue;
      }
      if (isWord(h, "create_polyfill") && x.items[1] && x.items[1].t === "str") {
        polys.push(x.items[1].v);
        continue;
      }
      if (isWord(h, "polyfill") && x.items[2] && x.items[2].t === "str") {
        polys.push(x.items[2].v);
        continue;
      }
      if (isWord(h, "imp")) continue;
      return null;
    }
    return null;
  }
  return s;
}

function generate() {
  const ops = operators(group(tokenize(fs.readFileSync(LANG, "utf8"))));
  const byName = new Map();
  for (const op of ops) {
    if (!byName.has(op.name)) byName.set(op.name, []);
    byName.get(op.name).push(op);
  }
  const fns = [];
  const skipped = [];
  for (const [name, list] of [...byName.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1))) {
    if (!/^[a-z_][a-z0-9_]*$/.test(name) || RESERVED.has(name) || UNIT_DEPENDENT.has(name)) continue;
    if (list.length !== 1) {
      skipped.push(`${name} (overloaded)`);
      continue;
    }
    const op = list[0];
    if (!op.rust) continue;
    if (op.bad || op.retOptional || !(op.ret in RRET) || op.args.some((a) => !(a.type in RTYPE))) {
      continue;
    }
    op.args.forEach((a, i) => (a.rname = `a${i + 1}_${a.name.replace(/[^A-Za-z0-9_]/g, "")}`));
    const polys = [];
    let b = body(op, polys);
    if (b === null) {
      skipped.push(`${name} (template)`);
      continue;
    }
    b = b.trim();
    const params = op.args.map((a) => `${a.rname}: ${RTYPE[a.type]}`).join(", ");
    const ret = op.ret === "void" ? "" : ` -> ${RRET[op.ret]}`;
    let text;
    if (op.ret === "void") {
      text = `pub fn ${name}(${params}) {\n    ${b.replace(/;?$/, ";")}\n}\n`;
    } else if (op.ret === "string") {
      text = `pub fn ${name}(${params})${ret} {\n    (${b}).to_string()\n}\n`;
    } else {
      text = `pub fn ${name}(${params})${ret} {\n    ${b}\n}\n`;
    }
    fns.push({ name, text, polys, arity: op.args.length, ret: op.ret });
  }
  return { fns, skipped };
}

function render(fns, dropped, skipped) {
  const polys = [];
  for (const f of fns) for (const p of f.polys) if (!polys.includes(p)) polys.push(p);
  let s =
    "// SPDX-License-Identifier: MIT\n" +
    "// GENERATED by scripts/gen-rust-prelude-ops.js from compiler/Lang.rgr -- do not edit.\n" +
    "//\n" +
    "// The Ranger operators as Rust functions: the body of each is the operator's\n" +
    "// `rust` template. A strict module calls them by name; Ranger lowers the call\n" +
    "// to the operator itself, so every target runs its own template.\n" +
    "#![allow(dead_code, unused_parens, unused_imports, non_snake_case, clippy::all)]\n\n";
  for (const f of fns) s += f.text + "\n";
  if (polys.length) {
    s += "// ---- helpers the templates call (their polyfills)\n\n";
    for (const p of polys) s += p.trim() + "\n\n";
  }
  s += "// Not generated: rustc rejected the template as a function:\n";
  s += wrap(dropped);
  s += "// Not generated: overloaded, or a template that is not plain text:\n";
  s += wrap(skipped);
  return s;
}

function renderNames(fns) {
  let s =
    "; SPDX-License-Identifier: MIT\n" +
    "; GENERATED by scripts/gen-rust-prelude-ops.js from compiler/Lang.rgr -- do not edit.\n" +
    ";\n" +
    "; The operators runtime/rust/ranger/src/ops.rs offers to a strict module, with\n" +
    "; their argument counts and return types. A call `name(a, b)` of one of them\n" +
    "; is lowered to the operator `(name a b)`.\n\n" +
    "class RustPreludeOps {\n" +
    "  sfn arities:[string:int] () {\n" +
    "    def m:[string:int]\n";
  for (const f of fns) s += `    set m "${f.name}" ${f.arity}\n`;
  s += "    return m\n  }\n\n  sfn returns:[string:string] () {\n    def m:[string:string]\n";
  for (const f of fns) s += `    set m "${f.name}" "${f.ret}"\n`;
  return s + "    return m\n  }\n}\n";
}

function wrap(names) {
  if (!names.length) return "//   (none)\n";
  let s = "";
  let line = "//  ";
  for (const n of names) {
    if (line.length + n.length > 76) {
      s += line + "\n";
      line = "//  ";
    }
    line += " " + n;
  }
  return s + line + "\n";
}

// Names of the functions rustc reports errors in.
function rejected(file, fns) {
  const r = spawnSync("rustc", ["--edition", "2021", "--crate-type", "lib", "--emit=metadata", "-o", file + ".rmeta", file], {
    encoding: "utf8",
  });
  if (r.status === 0) return [];
  const lines = fs.readFileSync(file, "utf8").split("\n");
  const owner = (ln) => {
    for (let i = ln - 1; i >= 0; i--) {
      const m = /^pub fn ([a-z0-9_]+)\(/.exec(lines[i]);
      if (m) return m[1];
      if (/^\/\/ ---- helpers/.test(lines[i])) return null;
    }
    return null;
  };
  const bad = new Set();
  const re = /--> [^:]+:(\d+):\d+/g;
  let m;
  const errText = r.stderr.split(/\n(?=error|warning)/).filter((b) => b.startsWith("error"));
  for (const block of errText) {
    re.lastIndex = 0;
    while ((m = re.exec(block))) {
      const o = owner(parseInt(m[1], 10));
      if (o) bad.add(o);
    }
  }
  if (bad.size === 0) {
    throw new Error("rustc rejected the generated helpers:\n" + r.stderr.slice(0, 4000));
  }
  return [...bad].filter((n) => fns.some((f) => f.name === n));
}

function main() {
  const { fns, skipped } = generate();
  const dropped = [];
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "rgr-ops-"));
  const file = path.join(tmp, "ops.rs");
  let live = fns;
  for (let round = 0; round < 50; round++) {
    fs.writeFileSync(file, render(live, dropped, skipped));
    const bad = rejected(file, live);
    if (!bad.length) break;
    dropped.push(...bad);
    live = live.filter((f) => !bad.includes(f.name));
  }
  dropped.sort();
  const text = render(live, dropped, skipped);
  const names = renderNames(live);
  if (process.argv.includes("--check")) {
    const cur = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8") : "";
    const curN = fs.existsSync(NAMES) ? fs.readFileSync(NAMES, "utf8") : "";
    if (cur !== text || curN !== names) {
      console.error("runtime/rust/ranger/src/ops.rs is stale: run node scripts/gen-rust-prelude-ops.js");
      process.exit(1);
    }
    console.log(`ops.rs up to date (${live.length} operators)`);
    return;
  }
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, text);
  fs.writeFileSync(NAMES, names);
  console.log(`wrote ${path.relative(ROOT, OUT)}: ${live.length} operators, ${dropped.length} rejected by rustc, ${skipped.length} skipped`);
}

if (require.main === module) main();
module.exports = { tokenize, group, operators, generate };
