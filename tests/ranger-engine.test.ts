import { describe, it, expect, afterAll, beforeAll } from "vitest";
import { execFileSync } from "child_process";
import { createRequire } from "module";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

/**
 * The Ranger engine (gallery/ranger_engine): a bytecode VM plus a host JIT
 * tier that runs Ranger source directly, without emitting a target file.
 *
 * These tests drive it in process through the `-nodemodule` build, so they can
 * assert on what an ordinary run cannot show: which tier each function ended
 * up in, how many instructions the interpreter executed, and what the JIT
 * generated. The engine host is built on demand and cached in
 * gallery/ranger_engine/bin/ (gitignored).
 */

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ENGINE = path.join(ROOT, "gallery/ranger_engine");
const API = path.join(ENGINE, "bin/rg_api.js");
const VM_ONLY = path.join(ENGINE, "bin/rg_vm.js");
const RG_BUILD = path.join(ENGINE, "bin/rg_build.js");
const RG_CLI = path.join(ENGINE, "bin/rg_cli.js");
const NATIVE_CLI = path.join(ENGINE, "bin/rangercli");
const TMP = path.join(ROOT, "tmp/ranger-engine-test");

let api: any;
let previousRangerLib: string | undefined;

/** The frontend prints its progress; tests do not need to see it. */
async function quiet<T>(run: () => T | Promise<T>): Promise<T> {
  const log = console.log;
  console.log = () => {};
  try {
    return await run();
  } finally {
    console.log = log;
  }
}

async function load(program: string, jitThreshold = -1) {
  const engine = new api.RgEngine();
  engine.vm.echo = false;
  if (jitThreshold >= 0) engine.enableJit(jitThreshold);
  const ok = await quiet(() => engine.loadFile(path.join(ENGINE, "examples", program)));
  expect(ok, `load failed: ${engine.errorText}`).toBe(true);
  return engine;
}

function tierOf(engine: any, name: string): string {
  const f = engine.module.functions.find((fn: any) => fn.name === name);
  expect(f, `no such function in the module: ${name}`).toBeTruthy();
  return ["bytecode", "jit", "unsupported"][f.tier];
}

describe("Ranger engine", () => {
  beforeAll(() => {
    if (!fs.existsSync(API) || !fs.existsSync(VM_ONLY) || !fs.existsSync(RG_BUILD) || !fs.existsSync(RG_CLI)) {
      // Only the two hosts these tests use; the command line and the dumper
      // are another twenty seconds of compiler for nothing.
      execFileSync("bash", [path.join(ROOT, "scripts/ranger-engine-build.sh"), "api", "vm", "build", "cli"], {
        cwd: ROOT,
        stdio: "pipe",
      });
    }
    // The engine embeds the compiler, so it reads RANGER_LIB from this process
    // rather than from a child's environment. The whole suite shares one fork,
    // so the previous value goes back afterwards.
    previousRangerLib = process.env.RANGER_LIB;
    process.env.RANGER_LIB = `${path.join(ROOT, "compiler")}/;${path.join(ROOT, "lib")}/`;
    api = require(API);
  }, 180000);

  afterAll(() => {
    if (previousRangerLib === undefined) {
      delete process.env.RANGER_LIB;
    } else {
      process.env.RANGER_LIB = previousRangerLib;
    }
  });

  it("runs a program from Ranger source with no target file in between", async () => {
    const engine = await load("demo.rgr");
    expect(engine.runMain("Demo"), engine.errorText).toBe(true);
    expect(engine.vm.output).toEqual([
      "fib(20)     = 6765",
      "sumTo(100)  = 5050",
      "arraySum(5) = 20",
      "counter = 42",
      "hello, ranger",
    ]);
  });

  it("calls single functions and returns numbers and strings", async () => {
    const engine = await load("demo.rgr");
    expect(engine.callNum("Demo.fib", [15])).toBe(610);
    expect(engine.callNum("Demo.sumTo", [10])).toBe(55);
    expect(engine.callNum("Demo.arraySum", [4])).toBe(12);
    expect(engine.callText("Demo.counterDemo", [])).toBe("counter = 42");
  });

  it("keeps objects, fields and instance methods working", async () => {
    const engine = await load("demo.rgr");
    // counterDemo constructs a Counter, calls add twice and reads a field
    // through a method, so a right answer here covers NEWOBJ, SETFN, GETFN
    // and MCALL together with the class's declared string default.
    expect(engine.callText("Demo.counterDemo", [])).toBe("counter = 42");
    expect(tierOf(engine, "Counter.add")).toBe("bytecode");
  });

  it("promotes a hot function to the host JIT and gets the same answers", async () => {
    const interp = await load("bench.rgr");
    const jit = await load("bench.rgr", 2);

    const a = interp.callNum("Bench.fib", [18]);
    const b = jit.callNum("Bench.fib", [18]);
    expect(b).toBe(a);
    expect(a).toBe(2584);

    expect(tierOf(interp, "Bench.fib")).toBe("bytecode");
    expect(tierOf(jit, "Bench.fib")).toBe("jit");
    // The interpreter stops doing the work once the function is compiled.
    expect(jit.vm.steps).toBeLessThan(interp.vm.steps / 10);
  });

  it("agrees with the interpreter on integer division and modulo", async () => {
    const interp = await load("bench.rgr");
    const jit = await load("bench.rgr", 1);
    for (const n of [7, 27, 97, 871]) {
      const viaBytecode = interp.callNum("Bench.collatzSteps", [n]);
      jit.callNum("Bench.collatzSteps", [n]);
      const viaJit = jit.callNum("Bench.collatzSteps", [n]);
      expect(viaJit, `collatzSteps(${n})`).toBe(viaBytecode);
    }
    expect(tierOf(jit, "Bench.collatzSteps")).toBe("jit");
  });

  it("truncates and takes remainders the way the host does, in both tiers", async () => {
    const interp = await load("bench.rgr");
    const jit = await load("bench.rgr", 1);
    const pairs = [
      [7, 2], [-7, 2], [7, -2], [-7, -2], [1, 3], [-1, 3], [1000003, 7], [-1000003, 7],
    ];
    for (const [a, b] of pairs) {
      const expected = Math.trunc(a / b) * 1000 + (a % b);
      expect(interp.callNum("Bench.signedMath", [a, b]), `bytecode ${a} ${b}`).toBe(expected);
      jit.callNum("Bench.signedMath", [a, b]);
      expect(jit.callNum("Bench.signedMath", [a, b]), `jit ${a} ${b}`).toBe(expected);
    }
  });

  it("generates JavaScript whose registers are plain locals", async () => {
    const jit = await load("bench.rgr", 1);
    jit.callNum("Bench.fib", [10]);
    jit.callNum("Bench.fib", [10]);
    const fib = jit.module.functions.find((f: any) => f.name === "Bench.fib");
    // Parameters are parameters, registers are locals, and the body returns a
    // value rather than parking one on the VM.
    expect(fib.jitSource).toContain("var direct = function(vm, n0)");
    expect(fib.jitSource).toContain("entry.direct = direct;");
    expect(fib.jitSource).not.toContain("itemAt");
  });

  it("recurses into itself directly instead of through the VM", async () => {
    // The calling convention was the whole gap to compiled output: reaching
    // another compiled function through vm.callFunction measured ~11x on this
    // shape, against ~1.3x for the dispatch loop itself.
    const jit = await load("bench.rgr", 1);
    jit.callNum("Bench.fib", [10]);
    jit.callNum("Bench.fib", [10]);
    const fib = jit.module.functions.find((f: any) => f.name === "Bench.fib");
    expect(fib.jitSource).toContain("direct(vm, n");
    expect(fib.jitSource).not.toContain("vm.callFunction");
    expect(jit.callNum("Bench.fib", [20])).toBe(6765);
  });

  it("links a call to another function once that one is compiled too", async () => {
    const jit = await load("bench.rgr", 1);
    // loopChunks calls loopSum; both get hot, and the call site upgrades
    // itself from the argument-buffer path to a direct call.
    for (let i = 0; i < 4; i++) jit.callNum("Bench.loopChunks", [2, 100]);
    const chunks = jit.module.functions.find((f: any) => f.name === "Bench.loopChunks");
    expect(tierOf(jit, "Bench.loopSum")).toBe("jit");
    expect(chunks.jitSource).toContain("hd.direct");
    expect(jit.callNum("Bench.loopChunks", [2, 100])).toBe(
      // same answer as the interpreter gives
      (await load("bench.rgr")).callNum("Bench.loopChunks", [2, 100]),
    );
  });

  it("marks what it cannot lower and still runs the rest", async () => {
    const engine = await load("partial.rgr");
    expect(tierOf(engine, "Partial.tally")).toBe("unsupported");
    const tally = engine.module.functions.find((f: any) => f.name === "Partial.tally");
    expect(tally.bailReason.length).toBeGreaterThan(0);
    expect(engine.callNum("Partial.triple", [14])).toBe(42);
    expect(engine.runMain("Partial"), engine.errorText).toBe(true);
    expect(engine.vm.output).toEqual(["triple(14) = 42"]);
  });

  it("reports a call into an unsupported function instead of running it", async () => {
    const engine = await load("partial.rgr");
    engine.vm.callStaticVoid("Partial.tally");
    expect(engine.vm.failed).toBe(true);
    expect(engine.vm.errorText).toContain("Partial.tally");
  });

  // The differential gate: the same file, once through the engine and once
  // through the ordinary compiler, has to print the same lines. Anything the
  // lowering pass gets subtly wrong shows up here rather than in a
  // hand-written expectation that was copied from the engine itself.
  for (const [program, entry] of [
    ["demo.rgr", "Demo"],
    ["forward.rgr", "Front"],
    ["partial.rgr", "Partial"],
  ]) {
    it(`prints exactly what compiled ${program} prints`, async () => {
      const outDir = path.join(ROOT, "tmp/ranger-engine-test");
      fs.mkdirSync(outDir, { recursive: true });
      const js = `${program.replace(".rgr", "")}.js`;
      execFileSync(
        "node",
        [
          "bin/output.js",
          "-es6",
          path.join(ENGINE, "examples", program),
          "-d=./tmp/ranger-engine-test",
          `-o=${js}`,
        ],
        {
          cwd: ROOT,
          env: { ...process.env, RANGER_LIB: "./compiler/Lang.rgr:./lib/stdops.rgr" },
          stdio: "pipe",
        },
      );
      const compiled = execFileSync("node", [path.join(outDir, js)], {
        cwd: ROOT,
        encoding: "utf8",
      })
        .trimEnd()
        .split("\n");

      const engine = await load(program);
      expect(engine.runMain(entry), engine.errorText).toBe(true);
      expect(engine.vm.output).toEqual(compiled);
    }, 60000);
  }

  it("knows a callee's signature before the callee is lowered", async () => {
    // forward.rgr calls a static of a class declared after it. Signatures are
    // settled in their own pass for exactly this: with the return kind still
    // defaulting to void, the call compiled to "call and drop the result" and
    // the destination register kept whatever happened to be in it.
    const engine = await load("forward.rgr");
    expect(engine.callNum("Front.total", [5])).toBe(11);
    expect(engine.callText("Front.label", [5])).toBe("total = 11");
  });

  it("builds a runtime half that carries none of the compiler", () => {
    const vmOnly = fs.readFileSync(VM_ONLY, "utf8");
    expect(vmOnly).toContain("class RgVM");
    expect(vmOnly).not.toContain("class VirtualCompiler");
    expect(vmOnly).not.toContain("class RangerFlowParser");
    // The whole point of the split: the runtime is small enough to ship.
    expect(vmOnly.length).toBeLessThan(80 * 1024);
  });
});

/**
 * The other half of the split: bytecode as a file, and a runtime that has no
 * compiler in it. `rg_build` writes a `.rgb`; `rg_cli` (Node) and `rangercli`
 * (native, via the C++ target) run one.
 */
describe("Ranger engine — bytecode files and the CLI", () => {
  function buildBytecode(program: string): string {
    fs.mkdirSync(TMP, { recursive: true });
    const rgb = path.join(TMP, program.replace(".rgr", ".rgb"));
    execFileSync(
      "node",
      [RG_BUILD, path.join(ENGINE, "examples", program), `-o=${path.relative(ROOT, rgb)}`, "-quiet"],
      {
        cwd: ROOT,
        env: { ...process.env, RANGER_LIB: `${path.join(ROOT, "compiler")}/;${path.join(ROOT, "lib")}/` },
        stdio: "pipe",
      },
    );
    return rgb;
  }

  function runCli(args: string[]) {
    return execFileSync("node", [RG_CLI, ...args], { cwd: ROOT, encoding: "utf8" }).trimEnd();
  }

  it("round-trips a program through a bytecode file", () => {
    const rgb = buildBytecode("demo.rgr");
    const text = fs.readFileSync(rgb, "utf8");
    expect(text.startsWith("rgb 1")).toBe(true);
    // Opcodes are written by name, which is what makes a stale name table a
    // build error instead of a program that quietly does something else.
    expect(text).toContain("o RETN ");
    expect(runCli([path.relative(ROOT, rgb)]).split("\n")).toEqual([
      "fib(20)     = 6765",
      "sumTo(100)  = 5050",
      "arraySum(5) = 20",
      "counter = 42",
      "hello, ranger",
    ]);
  }, 120000);

  it("passes the command line through to the program", () => {
    const rgb = buildBytecode("cli_args.rgr");
    const out = runCli([path.relative(ROOT, rgb), "world", "42"]);
    expect(out.split("\n")).toEqual([
      "arguments: 2",
      "  0 = world",
      "  1 = 42",
      "hello, world",
    ]);
  }, 120000);

  it("reads a file, splits it and counts what is in it", () => {
    const rgb = buildBytecode("cli_wc.rgr");
    const target = "gallery/ranger_engine/examples/cli_args.rgr";
    const out = runCli([path.relative(ROOT, rgb), target]);
    const source = fs.readFileSync(path.join(ROOT, target), "utf8");
    const lines = source.split("\n").length - (source.endsWith("\n") ? 1 : 0);
    const words = source.split(/\s+/).filter((w) => w.length > 0).length;
    expect(out).toBe(`${lines} lines, ${words} words, ${source.length} characters in ${target}`);
  }, 120000);

  it("refuses a bytecode file it cannot read, instead of running part of it", () => {
    const rgb = buildBytecode("demo.rgr");
    const broken = path.join(TMP, "broken.rgb");

    fs.writeFileSync(broken, fs.readFileSync(rgb, "utf8").replace("o RETN ", "o NOTANOP "));
    expect(() => runCli([path.relative(ROOT, broken)])).toThrow();
    try {
      runCli([path.relative(ROOT, broken)]);
    } catch (e: any) {
      expect(e.stdout).toContain("unknown opcode NOTANOP");
    }

    fs.writeFileSync(broken, fs.readFileSync(rgb, "utf8").replace("rgb 1", "rgb 99"));
    try {
      runCli([path.relative(ROOT, broken)]);
      throw new Error("a future format version should have been refused");
    } catch (e: any) {
      expect(e.stdout).toContain("bytecode format version 99");
    }
  }, 120000);

  it("runs the same bytecode from a native binary with no compiler in it", () => {
    let haveCompiler = true;
    try {
      execFileSync("g++", ["--version"], { stdio: "pipe" });
    } catch {
      haveCompiler = false;
    }
    if (!haveCompiler) {
      // Nothing to assert against; the Node runtime is covered above.
      return;
    }
    execFileSync("bash", [path.join(ROOT, "scripts/ranger-engine-build.sh"), "native"], {
      cwd: ROOT,
      stdio: "pipe",
    });
    const rgb = buildBytecode("demo.rgr");
    const native = execFileSync(NATIVE_CLI, [path.relative(ROOT, rgb)], {
      cwd: ROOT,
      encoding: "utf8",
    }).trimEnd();
    expect(native).toBe(runCli([path.relative(ROOT, rgb)]));
    // The point of the exercise: it is small, and it carries no frontend.
    expect(fs.statSync(NATIVE_CLI).size).toBeLessThan(1024 * 1024);
  }, 300000);
});
