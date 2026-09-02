// ISSUES.md #76 — a PR-level gate for the parser rewrite that makes
// `recv.call(args).field = value` store instead of compiling to nothing.
//
// `tests/compiler-issue-76.test.ts` covers the same three fixtures, but no CI
// job on a pull request runs the full vitest suite: `test:es6` runs
// `compiler.test.ts` alone, and `test:publish` — which does run everything —
// only fires on a release. An unrun test is not a gate, and this fix is
// exactly the kind that fails silently. So the fixtures are checked here too,
// from the runner CI actually executes on every push.
//
// The assertion is the program's OUTPUT, not the emitted source. Grepping for
// `__rgr_recv_` would pass on a rewrite that stored the wrong thing, and fail
// on a future fix that reached the same result another way.

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// RELATIVE for `-d=`: the compiler resolves that flag against its own working
// directory, so an absolute path comes back concatenated onto itself and the
// file lands somewhere nobody looks. Absolute for everything this script does
// itself.
const OUT_REL = "./tests/.output-issue76";
const OUT = path.join(ROOT, "tests", ".output-issue76");

let passed = 0;
let failed = 0;

function ok(name, cond, detail) {
  if (cond) {
    passed += 1;
    console.log(`  PASS ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

// Returns { compiled, output }. `compiled` is false when the compiler printed
// [FAIL] or exited non-zero — the compiler exits 0 on a parse error, which is
// the whole reason the runner at scripts/run-gallery-editor-tests.sh exists,
// so the text is what decides. The emitted FILE has to be there too: a check
// that trusts the banner and then cannot find the artifact is the stale-build
// failure this runner exists to prevent.
function compile(fixture, outName) {
  let out = "";
  let code = 0;
  try {
    out = execFileSync(
      process.execPath,
      [
        path.join(ROOT, "bin", "output.js"),
        "-es6",
        `./tests/fixtures/${fixture}`,
        "-nodecli",
        `-d=${OUT_REL}`,
        `-o=${outName}`,
      ],
      {
        cwd: ROOT,
        encoding: "utf8",
        env: {
          ...process.env,
          RANGER_LIB: "./compiler/Lang.rgr:./lib/stdops.rgr",
        },
      }
    );
  } catch (e) {
    out = `${e.stdout || ""}${e.stderr || ""}`;
    code = e.status ?? 1;
  }
  const emitted = path.join(OUT, outName);
  const clean = code === 0 && !out.includes("[FAIL]");
  if (clean && !existsSync(emitted)) {
    return { compiled: false, output: `${out}\n(no file at ${emitted})` };
  }
  return { compiled: clean, output: out };
}

function run(outName) {
  return execFileSync(process.execPath, [path.join(OUT, outName)], {
    encoding: "utf8",
  });
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

console.log("the store lands, in every spelling");

const main = compile("issue_76_call_result_field.rgr", "i76.js");
ok("the fixture compiles", main.compiled, main.output.slice(-600));

if (main.compiled) {
  const lines = run("i76.js")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const has = (s) => lines.some((l) => l === s);

  // b.at(0).name = "zero", b.first().n = 42, b.at(0).inner.tag = "deep"
  ok("a call with an argument, a zero-arg call and a nested path all store",
    has("zero|42|deep"), lines.join(" / "));
  // b.at(1).self().n = 7 — a chained receiver
  ok("a chained receiver stores", has("one|7|unset"), lines.join(" / "));
  // b.at(k).n / b.at(k).inner.tag inside a while block, twice per iteration
  ok("two rewrites per iteration inside a block store",
    has("zero|100|in-loop-0") && has("one|101|in-loop-1"), lines.join(" / "));
  // (b.at(0)).name = "paren" and (b.at(0)).n= 5 — parenthesised, and with no
  // space before the `=`
  ok("the parenthesised spelling stores", has("paren|5|in-loop-0"),
    lines.join(" / "));
  // (b.at(1)).inner.tag = "paren-deep"
  ok("a nested path on a parenthesised receiver stores",
    has("one|101|paren-deep"), lines.join(" / "));
  // reads must be untouched by all of the above
  ok("reads of a call result are left alone",
    has("read|paren") && has("cmp|ok"), lines.join(" / "));
}

console.log("and the two shapes the rewrite must refuse");

// The rewrite reaches BEHIND the statement for its receiver in the
// parenthesised case. These two are why that is safe; without them, widening
// the lookahead later would quietly start storing into an unrelated
// statement's return value.
const dangling = compile("issue_76_dangling_dot.rgr", "i76_dangling.js");
ok("a `.field =` line after an unrelated statement is refused, not stolen",
  dangling.compiled === false, "it compiled");

const parenCall = compile("issue_76_paren_receiver_call.rgr", "i76_call.js");
ok("`(expr).method()` at statement level is still refused",
  parenCall.compiled === false, "it compiled");

rmSync(OUT, { recursive: true, force: true });

console.log(`\npassed=${passed} failed=${failed}`);
if (failed > 0) {
  console.log("SOME FAILED");
  process.exit(1);
}
console.log("ALL PASS");
