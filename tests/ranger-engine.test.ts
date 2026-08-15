import { describe, it, expect, beforeAll } from "vitest";
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

let api: any;

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
    if (!fs.existsSync(API) || !fs.existsSync(VM_ONLY)) {
      // Only the two hosts these tests use; the command line and the dumper
      // are another twenty seconds of compiler for nothing.
      execFileSync("bash", [path.join(ROOT, "scripts/ranger-engine-build.sh"), "api", "vm"], {
        cwd: ROOT,
        stdio: "pipe",
      });
    }
    process.env.RANGER_LIB = `${path.join(ROOT, "compiler")}/;${path.join(ROOT, "lib")}/`;
    api = require(API);
  }, 180000);

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

  it("generates JavaScript whose registers are plain locals", async () => {
    const jit = await load("bench.rgr", 1);
    jit.callNum("Bench.fib", [10]);
    jit.callNum("Bench.fib", [10]);
    const fib = jit.module.functions.find((f: any) => f.name === "Bench.fib");
    expect(fib.jitSource).toContain("var n0 = 0;");
    expect(fib.jitSource).toContain("vm.retNum");
    expect(fib.jitSource).not.toContain("itemAt");
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

  it("prints exactly what the compiled program prints", async () => {
    // The differential gate: the same file, once through the engine and once
    // through the ordinary compiler, has to produce the same output. Anything
    // the lowering pass gets subtly wrong shows up here rather than in a
    // hand-written expectation that was copied from the engine itself.
    const outDir = path.join(ROOT, "tmp/ranger-engine-test");
    fs.mkdirSync(outDir, { recursive: true });
    execFileSync(
      "node",
      [
        "bin/output.js",
        "-es6",
        path.join(ENGINE, "examples/demo.rgr"),
        "-d=./tmp/ranger-engine-test",
        "-o=demo.js",
      ],
      {
        cwd: ROOT,
        env: { ...process.env, RANGER_LIB: "./compiler/Lang.rgr:./lib/stdops.rgr" },
        stdio: "pipe",
      },
    );
    const compiled = execFileSync("node", [path.join(outDir, "demo.js")], {
      cwd: ROOT,
      encoding: "utf8",
    })
      .trimEnd()
      .split("\n");

    const engine = await load("demo.rgr");
    expect(engine.runMain("Demo"), engine.errorText).toBe(true);
    expect(engine.vm.output).toEqual(compiled);
  }, 60000);

  it("builds a runtime half that carries none of the compiler", () => {
    const vmOnly = fs.readFileSync(VM_ONLY, "utf8");
    expect(vmOnly).toContain("class RgVM");
    expect(vmOnly).not.toContain("class VirtualCompiler");
    expect(vmOnly).not.toContain("class RangerFlowParser");
    // The whole point of the split: the runtime is small enough to ship.
    expect(vmOnly.length).toBeLessThan(80 * 1024);
  });
});
