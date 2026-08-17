import { describe, it, expect } from "vitest";
import { execFileSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename2 = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename2), "..");

/**
 * lib/core/ — the same answers on every target, and the answers JavaScript gives.
 *
 * tests/native/core_vectors.rgr prints one `name=value` line per case. This suite
 * runs it two ways:
 *
 *   1. NODE AS ORACLE. The expected value for each case is computed here, in
 *      JavaScript, by the built-in the core function mirrors. A case whose
 *      expectation is hand-written would encode whatever misunderstanding the
 *      author had; CONFORMANCE.md records that happening three times in the JS
 *      engine, so nothing is hand-written that Node can be asked instead.
 *
 *   2. EVERY TARGET, BYTE FOR BYTE. The program is compiled to each target and,
 *      where the toolchain is on PATH, built, run, and compared against the es6
 *      run character for character. This is the leg that catches per-target
 *      divergence, and it has already earned its place: it is what found that
 *      the Python writer emits `def z:double 0.0` as `z = 0`, so negative zero
 *      was +0 on Python while es6, Go and C++ all agreed it was -0.
 *
 * Doubles are not printed directly. `to_string` on a double is each target's own
 * formatter and they disagree about trailing ".0", exponent spelling and digit
 * count, so core_vectors decomposes a double into sign, a 52-bit mantissa in two
 * halves, and a binary exponent (`showD`). `showDouble` below is the same
 * decomposition in JavaScript, which is what makes the oracle comparison exact
 * rather than approximate.
 */

const VECTORS = "tests/native/core_vectors.rgr";
const OUT = path.join(ROOT, "tmp", "core-targets");

type Target = { name: string; flag: string; ext: string; build?: (f: string) => string[]; run: (f: string) => string[] };

const TARGETS: Target[] = [
  { name: "es6", flag: "-es6", ext: "js", run: (f) => [process.execPath, f] },
  { name: "python", flag: "-l=python", ext: "py", run: (f) => ["python3", f] },
  { name: "go", flag: "-l=go", ext: "go", run: (f) => ["go", "run", f] },
  {
    name: "cpp",
    flag: "-l=cpp",
    ext: "cpp",
    build: (f) => ["g++", "-std=c++17", "-O2", "-o", f.replace(/\.cpp$/, ".bin"), f],
    run: (f) => [f.replace(/\.cpp$/, ".bin")],
  },
  {
    name: "rust",
    flag: "-l=rust",
    ext: "rs",
    build: (f) => ["rustc", "-O", "-o", f.replace(/\.rs$/, ".bin"), f],
    run: (f) => [f.replace(/\.rs$/, ".bin")],
  },
];

const SETS = ["num", "negzero", "u32", "str", "base"];

// Printed for the record but NOT compared: RgText.kind() is 0 on es6, 2 on
// python/go/rust and 1 on cpp. It is the one value that is supposed to differ,
// and the point of RgText is that nothing else does.
const DIAGNOSTIC_SETS = ["strmodel"];

function hasTool(name: string): boolean {
  try {
    execFileSync(process.platform === "win32" ? "where" : "which", [name], { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

function compile(t: Target): string {
  fs.mkdirSync(OUT, { recursive: true });
  const rel = path.relative(ROOT, OUT).replace(/\\/g, "/");
  const file = `core_vectors.${t.ext}`;
  execFileSync(process.execPath, ["bin/output.js", t.flag, VECTORS, `-d=${rel}`, `-o=${file}`, "-nodecli"], {
    cwd: ROOT,
    encoding: "utf8",
    env: { ...process.env, RANGER_LIB: "./compiler/Lang.rgr:./lib/stdops.rgr:./lib" },
    maxBuffer: 64 * 1024 * 1024,
  });
  return path.join(OUT, file);
}

function runSet(t: Target, file: string, set: string): string {
  const cmd = t.run(file);
  return execFileSync(cmd[0], [...cmd.slice(1), set], {
    cwd: OUT,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
}

function parse(out: string): Map<string, string> {
  const m = new Map<string, string>();
  for (const line of out.split("\n")) {
    const i = line.indexOf("=");
    if (i > 0) m.set(line.slice(0, i), line.slice(i + 1).trim());
  }
  return m;
}

/** The JavaScript side of core_vectors' showD. Same decomposition, same string. */
function showDouble(v: number): string {
  if (Number.isNaN(v)) return "NaN";
  if (v === Infinity) return "+Inf";
  if (v === -Infinity) return "-Inf";
  if (v === 0) return Object.is(v, -0) ? "-0" : "+0";
  const neg = v < 0;
  let m = Math.abs(v);
  let e = 0;
  while (m >= 2) {
    m = m / 2;
    e += 1;
  }
  while (m < 1) {
    m = m * 2;
    e -= 1;
  }
  const scaled = (m - 1) * 67108864;
  const hi = Math.floor(scaled);
  const lo = Math.floor((scaled - hi) * 67108864);
  return `${neg ? "-" : "+"}1.${hi}:${lo}p${e}`;
}

/** ToInt32, as the spec defines it — what RgU32's patterns are compared against. */
const i32 = (n: number) => n | 0;

/**
 * Expectations, computed by JavaScript rather than written down.
 *
 * `exp` and `log` are deliberately absent. They are Taylor/atanh series in pure
 * Ranger because no target has an `exp` or `log` operator at all, and they land
 * 1 ULP from each platform's libm. That is a real deviation and it is asserted
 * as a bounded one in the `exp/log` test below rather than hidden here. The
 * upside is in the cross-target leg: because the series is Ranger code, exp and
 * log are IDENTICAL on all five targets, which delegating to each libm would not
 * have been.
 */
function oracle(): Map<string, string> {
  const e = new Map<string, string>();
  const d = (k: string, v: number) => e.set(k, showDouble(v));
  const i = (k: string, v: number) => e.set(k, String(v));

  // ---- negzero: every signed-zero rule in the language ----
  e.set("negZero_is_neg", "true");
  e.set("posZero_is_neg", "false");
  d("abs_negzero", Math.abs(-0));
  d("floor_negzero", Math.floor(-0));
  d("ceil_negzero", Math.ceil(-0));
  d("trunc_negzero", Math.trunc(-0));
  d("round_negzero", Math.round(-0));
  d("sign_negzero", Math.sign(-0));
  d("ceil_m0p5", Math.ceil(-0.5));
  d("ceil_m0p9", Math.ceil(-0.9));
  d("trunc_m0p5", Math.trunc(-0.5));
  d("trunc_m0p9", Math.trunc(-0.9));
  d("round_m0p5", Math.round(-0.5));
  d("round_p0p5", Math.round(0.5));
  d("round_m0p6", Math.round(-0.6));
  d("round_m0p4", Math.round(-0.4));
  d("max_negzero_zero", Math.max(-0, 0));
  d("min_negzero_zero", Math.min(-0, 0));
  d("pow_negzero_3", Math.pow(-0, 3));
  d("pow_negzero_2", Math.pow(-0, 2));

  // ---- num: rounding, pow, sqrt, coercions, fround ----
  d("floor_m1p5", Math.floor(-1.5));
  d("floor_1p5", Math.floor(1.5));
  d("ceil_m1p5", Math.ceil(-1.5));
  d("ceil_1p5", Math.ceil(1.5));
  d("trunc_m1p9", Math.trunc(-1.9));
  d("round_m1p5", Math.round(-1.5));
  d("round_2p5", Math.round(2.5));
  d("floor_2p31", Math.floor(2147483648.5));
  d("floor_m2p31", Math.floor(-2147483648.5));
  d("floor_1e15", Math.floor(1000000000000000.5));
  d("trunc_1e15", Math.trunc(1000000000000000.5));
  d("floor_nan", Math.floor(NaN));
  d("floor_inf", Math.floor(Infinity));
  d("round_inf", Math.round(Infinity));
  d("abs_neginf", Math.abs(-Infinity));
  d("pow_2_10", Math.pow(2, 10));
  d("pow_2_m2", Math.pow(2, -2));
  d("pow_10_15", Math.pow(10, 15));
  d("pow10_15", Math.pow(10, 15));
  d("powInt_3_5", Math.pow(3, 5));
  d("pow_nan_0", Math.pow(NaN, 0));
  d("pow_1_inf", Math.pow(1, Infinity));
  d("pow_2_inf", Math.pow(2, Infinity));
  d("pow_0p5_inf", Math.pow(0.5, Infinity));
  d("pow_m1_0p5", Math.pow(-1, 0.5));
  d("pow_m2_3", Math.pow(-2, 3));
  d("pow_neginf_3", Math.pow(-Infinity, 3));
  d("sqrt_4", Math.sqrt(4));
  d("sqrt_negzero", Math.sqrt(-0));
  d("sqrt_m1", Math.sqrt(-1));
  d("exp_0", Math.exp(0));
  d("exp_neginf", Math.exp(-Infinity));
  d("log_1", Math.log(1));
  d("log_0", Math.log(0));
  d("log_m1", Math.log(-1));
  d("toInt32_max_u32", 4294967295 | 0);
  d("toUint32_m1", -1 >>> 0);
  d("toInt32_2p31", 2147483648 | 0);
  d("toInt32_1e10", 10000000000 | 0);
  d("toInt32_nan", NaN | 0);
  d("fround_1p1", Math.fround(1.1));
  d("fround_1", Math.fround(1));
  d("fround_negzero", Math.fround(-0));

  // ---- u32: every expression the raw operators get wrong somewhere ----
  i("signBit", i32(0x80000000));
  i("shl_1_31", 1 << 31);
  i("shl_1_30", 1 << 30);
  i("shl_1_40", 1 << 40); // count is mod 32, so this is 1 << 8
  i("shl_1_32", 1 << 32);
  i("shl_ffff_16", 0xffff << 16);
  i("shr_m1_4", -1 >>> 4);
  i("shr_m1_28", -1 >>> 28);
  i("shr_m1_31", -1 >>> 31);
  i("sar_m1_4", -1 >> 4);
  i("shr_signbit_1", i32(0x80000000) >>> 1);
  i("rotr_1_1", i32((1 >>> 1) | (1 << 31)));
  i("rotl_signbit_1", i32((i32(0x80000000) << 1) | (i32(0x80000000) >>> 31)));
  i("rotr_m1_7", i32((-1 >>> 7) | (-1 << 25)));
  i("rotr_2a_17", i32((707406378 >>> 17) | (707406378 << 15)));
  i("rotl_2a_17", i32((707406378 << 17) | (707406378 >>> 15)));
  i("add_max_1", i32(2147483647 + 1));
  i("add_m1_1", i32(-1 + 1));
  i("add_m1_m1", i32(-1 + -1));
  i("sub_0_1", i32(0 - 1));
  i("bnot_0", ~0);
  i("bxor_m1_ffff", -1 ^ 0xffff);
  i("band_m1_ffff", -1 & 0xffff);
  d("unsigned_m1", -1 >>> 0);
  d("unsigned_signbit", i32(0x80000000) >>> 0);
  i("fromUnsigned_4294967295", 4294967295 | 0);
  i("fromUnsigned_2147483648", 2147483648 | 0);
  i("clz_0", Math.clz32(0));
  i("clz_1", Math.clz32(1));
  i("clz_signbit", Math.clz32(i32(0x80000000)));
  i("clz_m1", Math.clz32(-1));
  i("popcount_m1", 32);
  i("popcount_0", 0);
  i("byte0_of_m1", 255);
  i("byte3_of_m1", 255);
  i("fromBytes_deadbeef", i32(0xdeadbeef));
  i("byte0_deadbeef", 0xde);
  i("wrap_of_2p32_plus5", 5);

  // ---- str: UTF-16 code-unit addressing over all three string models ----
  const emoji = "😀";
  const mixed = "a😀b";
  const acc = "héllo";
  const u8 = (t: string) => Buffer.from(t, "utf8");
  const S = (k: string, v: string | number) => e.set(k, String(v));
  S("len_empty", "".length);
  S("len_ascii", "abc".length);
  S("len_acute", acc.length);
  S("len_emoji", emoji.length);
  S("len_mixed", mixed.length);
  S("unit0_emoji", emoji.charCodeAt(0));
  S("unit1_emoji", emoji.charCodeAt(1));
  S("unit2_emoji", -1);
  S("unitm1_emoji", -1);
  S("unit1_acute", acc.charCodeAt(1));
  S("unit0_mixed", mixed.charCodeAt(0));
  S("unit3_mixed", mixed.charCodeAt(3));
  S("cp0_emoji", emoji.codePointAt(0)!);
  S("cp1_mixed", mixed.codePointAt(1)!);
  S("cpcount_mixed", [...mixed].length);
  S("cpcount_acute", [...acc].length);
  S("substr_mixed_1_3", mixed.slice(1, 3));
  S("substr_mixed_0_1", mixed.slice(0, 1));
  S("substr_mixed_3_4", mixed.slice(3, 4));
  S("substr_acute_1_3", acc.slice(1, 3));
  S("len_substr_mixed_1_3", mixed.slice(1, 3).length);
  S("utf8ByteOf_mixed_1", u8(mixed.slice(0, 1)).length);
  S("utf8ByteOf_mixed_3", u8(mixed.slice(0, 3)).length);
  S("utf8ByteOf_acute_2", u8(acc.slice(0, 2)).length);
  const unitOfByte = (t: string, bi: number) => {
    let b = 0;
    let u = 0;
    for (const ch of t) {
      if (b >= bi) return u;
      b += u8(ch).length;
      u += ch.length;
    }
    return u;
  };
  S("unitOfUtf8Byte_mixed_5", unitOfByte(mixed, 5));
  S("unitOfUtf8Byte_acute_3", unitOfByte(acc, 3));
  S("cps_len", [...mixed].length);
  S("cps_1", [...mixed][1].codePointAt(0)!);
  S("cps_roundtrip", mixed);
  S("units_len", mixed.length);
  S("units_roundtrip", mixed);
  S("fromCodePoint_astral", String.fromCodePoint(128512));
  S("fromCodePoint_astral_len", String.fromCodePoint(128512).length);
  S("utf8_len_mixed", u8(mixed).length);
  S("utf8_hex_mixed", u8(mixed).toString("hex"));
  S("utf8_hex_acute", u8(acc).toString("hex"));
  S("utf8_roundtrip", mixed);
  S("utf8_width_ascii", 1);
  S("utf8_width_acute", 2);
  S("utf8_width_astral", 4);

  // ---- base: RFC 4648 §10 in full, plus the validation cases ----
  const b64 = (t: string) => u8(t).toString("base64");
  const hx = (t: string) => u8(t).toString("hex");
  S("b64_empty", b64(""));
  S("b64_f", b64("f"));
  S("b64_fo", b64("fo"));
  S("b64_foo", b64("foo"));
  S("b64_foob", b64("foob"));
  S("b64_fooba", b64("fooba"));
  S("b64_foobar", b64("foobar"));
  S("hex_empty", hx(""));
  S("hex_f", hx("f"));
  S("hex_foobar", hx("foobar"));
  S("b64_utf8", b64("héllo 😀"));
  S("hex_utf8", hx("héllo 😀"));
  S("b64_text_roundtrip", "héllo 😀");
  const highBytes = Buffer.from([251, 255, 190]);
  S("b64_highbytes", highBytes.toString("base64"));
  S("b64url_highbytes", highBytes.toString("base64url"));
  S("hex_highbytes", highBytes.toString("hex"));
  const twoBytes = Buffer.from([1, 2]);
  S("b64_two", twoBytes.toString("base64"));
  S("b64url_two", twoBytes.toString("base64url"));
  S("dec_foobar", "ok:" + Buffer.from("Zm9vYmFy", "base64").toString("hex"));
  S("dec_f", "ok:" + Buffer.from("Zg==", "base64").toString("hex"));
  S("dec_hex", "ok:deadbeef");
  // Node's decoder is lenient about all of these; RgBase is not, deliberately.
  S("dec_hex_odd", "err:InvalidCharacterError");
  S("dec_hex_bad", "err:InvalidCharacterError");
  S("dec_b64_badchar", "err:InvalidCharacterError");
  S("dec_b64_unpadded", "err:InvalidCharacterError");
  S("dec_b64url_unpadded", "ok:66");
  S("dec_b64_lone", "err:InvalidCharacterError");
  S("dec_b64_dirty_tail", "err:InvalidCharacterError");
  S("dec_b64_after_pad", "err:InvalidCharacterError");
  return e;
}

describe("lib/core — Node as oracle", () => {
  const file = compile(TARGETS[0]);
  const got = new Map<string, string>();
  for (const s of SETS) for (const [k, v] of parse(runSet(TARGETS[0], file, s))) got.set(k, v);
  const want = oracle();

  it("prints every case the oracle knows about", () => {
    const missing = [...want.keys()].filter((k) => !got.has(k));
    expect(missing).toEqual([]);
  });

  // One test per case, so a failure names the function rather than the suite.
  for (const [name, expected] of oracle()) {
    it(`${name} matches JavaScript`, () => {
      expect(got.get(name)).toBe(expected);
    });
  }

  /**
   * exp and log are series in pure Ranger — no target has the operator. They are
   * held to 2 ULP of libm rather than to equality, and the bound is asserted so
   * a regression in the series cannot hide behind "it was never exact anyway".
   */
  it("exp and log are within 2 ULP of libm", () => {
    const ulps = (a: number, b: number) => {
      if (a === b) return 0;
      const exp = Math.floor(Math.log2(Math.abs(b)));
      return Math.abs(a - b) / Math.pow(2, exp - 52);
    };
    // showD is lossy past 52 bits, so the series values are re-derived from the
    // printed decomposition rather than re-measured here: what is asserted is
    // that the printed form is one of the two doubles adjacent to libm's answer.
    const near = (key: string, libm: number) => {
      const printed = got.get(key);
      const candidates = [libm, libm + Math.sign(libm) * Math.pow(2, Math.floor(Math.log2(Math.abs(libm))) - 52), libm - Math.sign(libm) * Math.pow(2, Math.floor(Math.log2(Math.abs(libm))) - 52)];
      const ok = candidates.some((c) => showDouble(c) === printed);
      expect(ok, `${key}: printed ${printed}, libm ${showDouble(libm)} (${ulps(libm, libm)} ulp window)`).toBe(true);
    };
    near("exp_1", Math.exp(1));
    near("exp_m1", Math.exp(-1));
    near("log_10", Math.log(10));
  });
});

describe("lib/core — identical on every target", () => {
  const baselineFile = compile(TARGETS[0]);
  const baseline: Record<string, string> = {};
  for (const s of SETS) baseline[s] = runSet(TARGETS[0], baselineFile, s);

  for (const t of TARGETS.slice(1)) {
    describe(t.name, () => {
      let file = "";
      let usable = false;
      try {
        file = compile(t);
        usable = true;
      } catch {
        usable = false;
      }

      it("compiles", () => {
        expect(usable, `the Ranger compiler could not write ${t.name}`).toBe(true);
      });

      const toolName = t.build ? t.build("x." + t.ext)[0] : t.run("x." + t.ext)[0];
      const runnable = usable && hasTool(toolName === process.execPath ? "node" : toolName);

      if (!runnable) {
        it.skip(`byte-identical output (${toolName} not on PATH)`, () => {});
        return;
      }

      it("builds and answers exactly as es6 does", () => {
        if (t.build) {
          const cmd = t.build(file);
          execFileSync(cmd[0], cmd.slice(1), { cwd: OUT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
        }
        for (const s of SETS) {
          expect(runSet(t, file, s), `set "${s}" on ${t.name}`).toBe(baseline[s]);
        }
      });

      // The diagnostic set is the one place a target is EXPECTED to differ, so
      // it is reported rather than compared. Seeing it in the output is what
      // makes the run above meaningful: es6 counted UTF-16 units, cpp counted
      // UTF-8 bytes, and they still agreed on every RgText answer.
      it("reports its native string model", () => {
        for (const s of DIAGNOSTIC_SETS) {
          const seen = parse(runSet(t, file, s));
          const kind = Number(seen.get("model_kind"));
          expect([0, 1, 2], `${t.name} reported an unknown string model`).toContain(kind);
          console.log(
            `    ${t.name}: model_kind=${kind} (native strlen "é"=${seen.get("native_strlen_acute")}, "😀"=${seen.get("native_strlen_emoji")})`
          );
        }
      });
    });
  }
});
