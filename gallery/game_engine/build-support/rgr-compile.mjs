/**
 * Compile a Ranger source for the web builds, and actually check that it worked.
 *
 * Two traps live here, and between them they kept the whole GitHub Pages site
 * from deploying for six days without anyone getting a usable error message:
 *
 * 1. `bin/output.js` prints "Compilation FAILED" and still exits 0. A plain
 *    execFileSync therefore sees success, the build carries on, and the first
 *    thing that goes wrong is `ENOENT` on the output file that was never
 *    written. The real diagnostics scrolled past hundreds of lines earlier.
 *
 * 2. The compiler is recursive-descent, and a host that pulls in
 *    ComponentEngine overflows Node's default ~984KB stack. That surfaces as
 *    "Unexpected compiler error: RangeError: Maximum call stack size
 *    exceeded", which hides whatever real type errors are underneath — raising
 *    the stack is what makes them visible. 4MB is well inside the 8MB thread
 *    stack these runners give us.
 *
 * Use this instead of shelling out to the compiler directly.
 */
import { execFileSync } from "node:child_process";

/** V8 stack in KB. Default is ~984; ComponentEngine hosts need ~1500. */
export const COMPILER_STACK_KB = 4000;

export const RANGER_LIB = "./compiler/Lang.rgr:./lib/stdops.rgr";

/**
 * @param {object}   o
 * @param {string}   o.root      repository root, used as cwd
 * @param {string}   o.src       .rgr path, relative to root
 * @param {string}   o.outDir    -d= value, relative to root
 * @param {string}   o.outName   -o= value
 * @param {string[]} [o.args]    extra compiler flags (default ["-es6", "-nodecli"])
 * @param {object}   [o.env]     extra environment on top of process.env
 * @param {(s:string)=>void} [o.log] where to write the compiler's own output
 */
export function compileRgr({ root, src, outDir, outName, args, env, log }) {
  const flags = args ?? ["-es6", "-nodecli"];
  const out = execFileSync(
    "node",
    [
      `--stack-size=${COMPILER_STACK_KB}`,
      "bin/output.js",
      ...flags.filter((f) => f !== "-nodecli"),
      src,
      `-d=${outDir}`,
      `-o=${outName}`,
      ...(flags.includes("-nodecli") ? ["-nodecli"] : []),
    ],
    {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 1 << 28,
      env: { RANGER_LIB, ...process.env, ...env },
    }
  );
  (log ?? ((s) => process.stdout.write(s)))(out);
  if (out.includes("Compilation FAILED")) {
    const fails = out
      .split("\n")
      .filter((l) => l.includes("[FAIL]"))
      .slice(0, 12)
      .join("\n");
    throw new Error(`Ranger compilation failed for ${src}\n${fails}`);
  }
  return out;
}
