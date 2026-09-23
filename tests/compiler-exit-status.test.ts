import { describe, it, expect } from "vitest";
import { spawnSync } from "child_process";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const COMPILER = path.join(ROOT_DIR, "dist", "rgrc.js");

// The compiler used to print [FAIL] and end with a status of 0, so
// `rgrc x.rgr && node build/x.js` ran the PREVIOUS build and looked green.
// These tests are about the status a shell reads, not about the report.
function compile(args: string[]) {
  const res = spawnSync("node", [COMPILER, ...args], {
    cwd: ROOT_DIR,
    env: { ...process.env, RANGER_LIB: "./compiler/Lang.rgr;./lib/stdops.rgr" },
    encoding: "utf-8",
    timeout: 60000,
    // Pipes, not a terminal: that is how every build script runs it, and it is
    // where an exit-on-the-spot would drop the report.
    stdio: ["pipe", "pipe", "pipe"],
  });
  return {
    status: res.status,
    output: (res.stdout || "") + (res.stderr || ""),
  };
}

describe("rgrc exit status", () => {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "rgrc-exit-"));

  it("exits non-zero when compilation fails", () => {
    const res = compile([
      "-es6",
      "./tests/cli/test_error.rgr",
      "-nodecli",
      `-d=${outDir}`,
      "-o=exit_status_error.js",
    ]);

    expect(res.output).toContain("Compilation FAILED");
    expect(res.status, `compiler output:\n${res.output}`).not.toBe(0);
  });

  it("still prints the whole error report to a pipe", () => {
    const res = compile([
      "-es6",
      "./tests/cli/test_error.rgr",
      "-nodecli",
      `-d=${outDir}`,
      "-o=exit_status_error.js",
    ]);

    // The summary line is written last, so it is the first thing lost if the
    // compiler ever goes back to ending the process on the spot here.
    expect(res.output).toContain("Undefined variable");
    expect(res.output.indexOf("Compilation FAILED")).toBeGreaterThan(
      res.output.indexOf("Undefined variable")
    );
  });

  it("exits non-zero when the source file does not exist", () => {
    const res = compile(["-es6", "./tests/fixtures/no_such_file_here.rgr"]);

    expect(res.output).toContain("File not found");
    expect(res.status, `compiler output:\n${res.output}`).not.toBe(0);
  });

  it("exits zero when compilation succeeds", () => {
    const res = compile([
      "-es6",
      "./tests/fixtures/hello.rgr",
      "-nodecli",
      `-d=${outDir}`,
      "-o=exit_status_hello.js",
    ]);

    expect(res.status, `compiler output:\n${res.output}`).toBe(0);
    expect(fs.existsSync(path.join(outDir, "exit_status_hello.js"))).toBe(true);
  });

  it("exits zero when asked for the usage text", () => {
    const res = compile([]);

    expect(res.status, `compiler output:\n${res.output}`).toBe(0);
  });
});

// The status the compiler now ends with is one `set_exit_code` in its own
// source, so the operator has to write something on every target the compiler
// is built for.
describe("set_exit_code", () => {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "rgrc-setexit-"));
  const expected: Array<[string, string, RegExp]> = [
    ["-es6", "exit_code.js", /process\.exitCode = 3;/],
    ["-l=go", "exit_code.go", /os\.Exit\(int\(int64\(3\)\)\)/],
    ["-l=python", "exit_code.py", /sys\.exit\(3\)/],
    ["-l=dart", "exit_code.dart", /exitCode = 3;/],
    ["-l=csharp", "exit_code.cs", /Environment\.ExitCode = 3;/],
    ["-l=rust", "exit_code.rs", /std::process::exit\(\(3\) as i32\);/],
  ];

  for (const [flag, out, wanted] of expected) {
    it(`writes the status on ${flag}`, () => {
      const res = compile([
        flag,
        "./tests/fixtures/exit_code.rgr",
        "-nodecli",
        `-d=${outDir}`,
        `-o=${out}`,
      ]);

      expect(res.status, `compiler output:\n${res.output}`).toBe(0);
      expect(fs.readFileSync(path.join(outDir, out), "utf-8")).toMatch(wanted);
    });
  }
});
