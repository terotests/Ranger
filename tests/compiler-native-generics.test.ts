import { describe, it, expect } from "vitest";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

// Native generics. `History@(int)` is still expanded into `History_int` and
// type checked as a class of its own, but a target with generic classes of
// its own is handed ONE class, `History<Op>`, when the template's body only
// stores, moves and returns its parameter values. The compiler decides that
// by checking the template once more with its parameters as empty
// placeholder classes (RangerFlowParser.checkNativeGenerics).
//
// compiler-generics.test.ts runs the same two programs on every target and
// compares what they print; this file checks that the targets that can
// write generics actually do, that the ones that cannot keep the copies, and
// that a body which needs to know its parameter falls back.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "tests", ".output-native-generics");

const HISTORY = "tests/conformance/generic_class/program.rgr";
const KERNEL = "tests/conformance/generic_class_kernel/program.rgr";
const FALLBACK = "tests/fixtures/generic_native_fallback.rgr";

function expected(program: string): string {
  const f = path.join(ROOT, path.dirname(program), "expected_output.txt");
  return normalize(fs.readFileSync(f, "utf-8"));
}

function normalize(s: string): string {
  return s.replace(/\r\n/g, "\n").trim();
}

// Compile `program` for `lang` into a directory of its own and return the
// directory. Java writes a file per class, so everything is read back from
// the directory rather than from one file.
function compile(
  program: string,
  lang: string,
  outFile: string,
  flags: string[] = []
): string {
  const dir = path.join(
    OUT,
    `${path.basename(path.dirname(program))}_${path.basename(program, ".rgr")}_${lang}${flags.join("")}`
  );
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const langFlag = lang === "es6" ? "-es6" : `-l=${lang}`;
  const out = execSync(
    [
      `node "${path.join(ROOT, "dist", "rgrc.js")}"`,
      langFlag,
      ...flags,
      `"./${program}"`,
      "-nodecli",
      `-d="${dir}"`,
      `-o="${outFile}"`,
    ].join(" "),
    { cwd: ROOT, encoding: "utf-8", timeout: 120000, stdio: ["pipe", "pipe", "pipe"] }
  );
  expect(out.includes("[OK] Compilation successful!"), `${lang}:\n${out}`).toBe(true);
  return dir;
}

function allText(dir: string): string {
  return fs
    .readdirSync(dir)
    .filter((f) => fs.statSync(path.join(dir, f)).isFile())
    .map((f) => fs.readFileSync(path.join(dir, f), "utf-8"))
    .join("\n");
}

function have(tool: string): boolean {
  try {
    execSync(`command -v ${tool}`, { stdio: "ignore", shell: "/bin/bash" });
    return true;
  } catch {
    return false;
  }
}

interface NativeTarget {
  lang: string;
  file: string;
  flags?: string[];
  // how the generic form of `History @params(Op)` is declared
  decl: string;
  // how `History@(int)` is spelled where it is used, if the target spells it
  use?: string;
}

const NATIVE: NativeTarget[] = [
  { lang: "cpp", file: "main.cpp", decl: "template <class Op> class History {", use: "History<int>" },
  { lang: "java7", file: "Main.java", decl: "public class History<Op>", use: "History<Integer>" },
  { lang: "go", file: "main.go", decl: "type History[Op any] struct", use: "*History[int64]" },
  { lang: "es6", file: "main.js", decl: "class History ", use: "new History(" },
  { lang: "es6", file: "main.ts", flags: ["-typescript"], decl: "class History<Op>", use: "History<number>" },
  { lang: "python", file: "main.py", decl: "class History(Generic[Op])", use: "History()" },
  { lang: "php", file: "main.php", decl: "class History ", use: "new History(" },
  { lang: "csharp", file: "main.cs", decl: "class History<Op>", use: "History<int>" },
  { lang: "dart", file: "main.dart", decl: "class History<Op>", use: "History<int>" },
  { lang: "kotlin", file: "main.kt", decl: "class History<Op>", use: "History<Int>" },
  { lang: "scala", file: "main.scala", decl: "class History[Op]", use: "History[Int]" },
  { lang: "rust", file: "main.rs", decl: "impl<Op: Clone> History<Op> {", use: "History::<i64>::new()" },
];

// The targets that keep the expanded copies: Swift passes arguments and holds
// instances in ways that differ between copies of one template, and LLVM has
// no generics. (Rust makes the copies agree: settleRustNativeGenerics.)
const COPIES: { lang: string; file: string; flags?: string[] }[] = [
  { lang: "swift6", file: "main.swift" },
  { lang: "llvm", file: "main.ll", flags: ["-target=native-linux-gnu"] },
];

describe("native generics", () => {
  describe("a target with generics of its own writes the template once", () => {
    for (const t of NATIVE) {
      const label = t.lang + (t.flags ? " " + t.flags.join(" ") : "");
      it(label, () => {
        const text = allText(compile(HISTORY, t.lang, t.file, t.flags ?? []));
        expect(text).toContain(t.decl);
        if (t.use) {
          expect(text).toContain(t.use);
        }
        expect(text).not.toMatch(/History_int\b/);
        expect(text).not.toContain("__tp_");
      });
    }
  });

  describe("the others keep one class per instance", () => {
    for (const t of COPIES) {
      it(t.lang, () => {
        const text = allText(compile(HISTORY, t.lang, t.file, t.flags ?? []));
        expect(text).toMatch(/History_int/);
        expect(text).not.toContain("__tp_");
      });
    }
  });

  // -nodemodule exports every class by name; the instances are no longer
  // classes of their own, so the export has to name the one generic class
  // (it named `History_int`, and the module failed to load).
  it("-nodemodule exports the generic class, not its instances", () => {
    const dir = compile(HISTORY, "es6", "main.js", ["-nodemodule"]);
    const text = allText(dir);
    expect(text).toContain("module.exports.History = History;");
    expect(text).not.toMatch(/module\.exports\.History_/);
    const out = execSync(
      `node -e "const m = require('${path.join(dir, "main.js")}'); console.log(typeof m.History)"`,
      { encoding: "utf-8" }
    );
    expect(out.trim().split("\n").pop()).toBe("function");
  });

  it("-no-native-generics keeps the copies", () => {
    const text = allText(compile(HISTORY, "cpp", "main.cpp", ["-no-native-generics"]));
    expect(text).toContain("class History_int");
    expect(text).not.toContain("template <class Op>");
  });

  describe("a body that needs to know its parameter falls back", () => {
    for (const t of [
      { lang: "cpp", file: "main.cpp", box: "template <class T> class Box" },
      { lang: "java7", file: "Main.java", box: "public class Box<T>" },
      { lang: "go", file: "main.go", box: "type Box[T any] struct" },
      { lang: "python", file: "main.py", box: "class Box(Generic[T])" },
    ]) {
      it(t.lang, () => {
        const text = allText(compile(FALLBACK, t.lang, t.file));
        for (const copy of ["Sum_int", "Greeter_Named", "Show_int"]) {
          expect(text, `${copy} should stay a class of its own`).toContain(copy);
        }
        expect(text).toContain(t.box);
        expect(text).not.toContain("Box_string");
      });
    }

    // `Box` is a Rust prelude type; a generic class of that name would hide
    // it, so on Rust even Box keeps its copy.
    it("rust (Box is a prelude name)", () => {
      const text = allText(compile(FALLBACK, "rust", "main.rs"));
      for (const copy of ["Sum_int", "Greeter_Named", "Show_int", "Box_string"]) {
        expect(text, `${copy} should stay a class of its own`).toContain(copy);
      }
      expect(text).not.toContain("__tp_");
    });

    it("and still runs (es6)", () => {
      const dir = compile(FALLBACK, "es6", "main.js");
      const out = execSync(`node "${path.join(dir, "main.js")}"`, { encoding: "utf-8" });
      expect(normalize(out)).toBe("6\nn\nv=4\nboxed");
    });

    it.skipIf(!have("g++"))("and still runs (cpp)", () => {
      const dir = compile(FALLBACK, "cpp", "main.cpp");
      const bin = path.join(dir, "main.bin");
      execSync(`g++ -std=c++17 -o "${bin}" "${path.join(dir, "main.cpp")}"`, { timeout: 120000 });
      expect(normalize(execSync(`"${bin}"`, { encoding: "utf-8" }))).toBe("6\nn\nv=4\nboxed");
    }, 120000);
  });

  // compiler-generics.test.ts already runs es6, go, python, php and cpp.
  // These are the native targets it does not run.
  describe("the generic output runs", () => {
    for (const program of [HISTORY, KERNEL]) {
      const name = path.basename(path.dirname(program));

      it.skipIf(!have("javac"))(`java7 ${name}`, () => {
        const dir = compile(program, "java7", "Main.java");
        execSync(`javac *.java`, { cwd: dir, timeout: 120000, stdio: "pipe" });
        const main = fs
          .readdirSync(dir)
          .filter((f) => f.endsWith(".java"))
          .find((f) => /static void main\(/.test(fs.readFileSync(path.join(dir, f), "utf-8")));
        expect(main).toBeTruthy();
        const out = execSync(`java ${main!.replace(/\.java$/, "")}`, {
          cwd: dir,
          encoding: "utf-8",
          stdio: ["pipe", "pipe", "pipe"],
        });
        expect(normalize(out)).toBe(expected(program));
      }, 120000);

      it.skipIf(!have("mcs") || !have("mono"))(`csharp ${name}`, () => {
        const dir = compile(program, "csharp", "main.cs");
        execSync(`mcs -out:main.exe main.cs`, { cwd: dir, timeout: 120000, stdio: "pipe" });
        const out = execSync(`mono main.exe`, { cwd: dir, encoding: "utf-8" });
        expect(normalize(out)).toBe(expected(program));
      }, 120000);

      it.skipIf(!have("dart"))(`dart ${name}`, () => {
        const dir = compile(program, "dart", "main.dart");
        const out = execSync(`dart run main.dart`, { cwd: dir, encoding: "utf-8", timeout: 120000 });
        expect(normalize(out)).toBe(expected(program));
      }, 120000);
    }

    it.skipIf(!have("tsc") && !fs.existsSync(path.join(ROOT, "node_modules", ".bin", "tsc")))(
      "typescript generic_class type-checks",
      () => {
        const dir = compile(HISTORY, "es6", "main.ts", ["-typescript"]);
        execSync(`npx tsc --target es2020 --noEmit --skipLibCheck --moduleResolution node "${path.join(dir, "main.ts")}"`, {
          cwd: ROOT,
          timeout: 120000,
          stdio: "pipe",
        });
      },
      120000
    );
  });
});
