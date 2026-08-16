import { describe, it, expect, afterAll } from "vitest";
import { execFileSync } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

// compiler/EmbeddedLib.rgr is committed as a stub, and only the packaged
// binaries are built with it filled in — so nothing in the ordinary test run
// touches the path that makes RANGER_LIB optional. This is that gate: fill the
// file in, build a compiler from it, and compile a program in a directory that
// has no Lang.rgr, no lib/, and no RANGER_LIB.
//
// It restores the stub whatever happens. A filled-in EmbeddedLib.rgr left in
// the working tree is 850 kB of generated source that would land in the next
// commit.
describe("the library compiled into the compiler", () => {
  const OUT = path.join(ROOT, "tests", ".output-embedded-lib");

  afterAll(() => {
    execFileSync("node", ["scripts/generate-embedded-lib.mjs", "--stub"], {
      cwd: ROOT,
    });
  });

  it("lets a compiler built with it work with no library on disk", () => {
    fs.mkdirSync(OUT, { recursive: true });

    execFileSync("node", ["scripts/generate-embedded-lib.mjs"], { cwd: ROOT });
    const embedded = fs.readFileSync(
      path.join(ROOT, "compiler", "EmbeddedLib.rgr"),
      "utf8"
    );
    expect(embedded).toContain('case "Lang.rgr" { return true }');

    execFileSync(
      "node",
      [
        "--max-old-space-size=8192",
        "bin/output.js",
        "-es6",
        "./compiler/ng_Compiler.rgr",
        "-nodecli",
        `-d=./tests/.output-embedded-lib`,
        "-o=embedded-compiler.js",
      ],
      {
        cwd: ROOT,
        env: { ...process.env, RANGER_LIB: "./compiler/Lang.rgr:./lib/stdops.rgr" },
        stdio: ["pipe", "pipe", "pipe"],
      }
    );

    const compiler = path.join(OUT, "embedded-compiler.js");
    expect(fs.existsSync(compiler)).toBe(true);

    // An empty directory somewhere else entirely: only the source to compile.
    const bare = fs.mkdtempSync(path.join(os.tmpdir(), "rgr-embedded-"));
    fs.copyFileSync(
      path.join(ROOT, "tests", "fixtures", "hello.rgr"),
      path.join(bare, "hello.rgr")
    );
    const { RANGER_LIB: _dropped, ...envWithoutLib } = process.env;

    execFileSync(
      "node",
      [compiler, "-es6", "./hello.rgr", "-nodecli", "-d=./out", "-o=hello.js"],
      { cwd: bare, env: envWithoutLib, stdio: ["pipe", "pipe", "pipe"] }
    );

    const generated = path.join(bare, "out", "hello.js");
    expect(fs.existsSync(generated)).toBe(true);
    expect(execFileSync("node", [generated]).toString().trim()).toBe("Hello World");

    fs.rmSync(bare, { recursive: true, force: true });
  }, 300_000);

  it("prefers a file on disk over the one inside the binary", () => {
    const compiler = path.join(OUT, "embedded-compiler.js");
    expect(fs.existsSync(compiler)).toBe(true);

    const bare = fs.mkdtempSync(path.join(os.tmpdir(), "rgr-embedded-disk-"));
    fs.copyFileSync(
      path.join(ROOT, "tests", "fixtures", "hello.rgr"),
      path.join(bare, "hello.rgr")
    );
    // A Lang.rgr that cannot parse: if the embedded copy were preferred, this
    // compile would succeed and the override would be a lie.
    fs.writeFileSync(path.join(bare, "Lang.rgr"), "this is not a language file )))\n");
    const { RANGER_LIB: _dropped, ...envWithoutLib } = process.env;

    let failed = false;
    try {
      execFileSync(
        "node",
        [compiler, "-es6", "./hello.rgr", "-nodecli", "-d=./out", "-o=hello.js"],
        { cwd: bare, env: envWithoutLib, stdio: ["pipe", "pipe", "pipe"] }
      );
    } catch {
      failed = true;
    }
    expect(failed || !fs.existsSync(path.join(bare, "out", "hello.js"))).toBe(true);

    fs.rmSync(bare, { recursive: true, force: true });
  }, 120_000);
});
